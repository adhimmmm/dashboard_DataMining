from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import io
import base64

# Mengatur agar matplotlib tidak memerlukan GUI desktop saat dijalankan di server Flask
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.metrics import classification_report, confusion_matrix
from sklearn.tree import plot_tree

app = Flask(__name__)
CORS(app)

# 1. Load Semua Model dan Scaler
try:
    models = {
        'random_forest': joblib.load('model_greenhouse_rf.pkl'),
        'decision_tree': joblib.load('model_greenhouse_dt.pkl'),
        'naive_bayes': joblib.load('model_greenhouse_nb.pkl')
    }
    scaler = joblib.load('scaler_greenhouse.pkl')
    print("── 3 MODEL & SCALER BERHASIL DI-LOAD ──")
except Exception as e:
    print(f"⚠️ Gagal memuat file .pkl: {str(e)}")

NUMERIC_COLS = [
    'avg_temperature_C', 'humidity_percent', 'co2_ppm', 'light_intensity_lux',
    'irrigation_mm', 'fertilizer_N_kg_ha', 'fertilizer_P_kg_ha', 'fertilizer_K_kg_ha',
    'soil_pH', 'pest_severity'
]

# Fungsi pembantu untuk mengubah plot matplotlib menjadi teks string Base64 agar bisa dibaca tag <img> HTML
def plot_to_base64():
    img = io.BytesIO()
    plt.savefig(img, format='png', bbox_inches='tight', dpi=150)
    img.seek(0)
    plot_url = base64.b64encode(img.getvalue()).decode('utf8')
    plt.close()
    return plot_url

# ── RUTE 1: PREDIKSI TUNGGAL ──
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        selected_model = data.get('model_choice', 'random_forest')
        
        if selected_model not in models:
            return jsonify({'status': 'error', 'message': 'Model tidak ditemukan'})
            
        model = models[selected_model]
        crop_type = data['crop_type']
        
        numeric_data = [[
            data['avg_temperature_C'], data['humidity_percent'], data['co2_ppm'],
            data['light_intensity_lux'], data['irrigation_mm'], data['fertilizer_N_kg_ha'],
            data['fertilizer_P_kg_ha'], data['fertilizer_K_kg_ha'], data['soil_pH'],
            data['pest_severity']
        ]]
        
        scaled_numeric = scaler.transform(numeric_data)
        final_input = [[crop_type] + scaled_numeric[0].tolist()]
        
        prediksi = model.predict(final_input)[0]
        hasil = "🌟 Tinggi (1) - Optimal" if prediksi == 1 else "⚠️ Rendah (0) - Risiko"
        return jsonify({'status': 'success', 'prediksi': hasil})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# ── RUTE 2: PREDIKSI MASSAL & EVALUASI MANDIRI VIA CSV ──
@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    try:
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'Tidak ada file diunggah'})
        
        file = request.files['file']
        selected_model = request.form.get('model_choice', 'random_forest')
        
        if file.filename == '' or selected_model not in models:
            return jsonify({'status': 'error', 'message': 'File atau model tidak valid'})
            
        model = models[selected_model]
        df = pd.read_csv(io.StringIO(file.stream.read().decode("UTF8")))
        
        # ── 1. PROSES AMAN 1: AUTO-MAPPING CROP_TYPE (KATA -> ANGKA) ──
        text_to_num_mapping = {
            'cucumber': 0, 'cucumber ': 0, 'timun': 0,
            'lettuce': 1, 'lettuce ': 1, 'selada': 1,
            'pepper': 2, 'pepper ': 2, 'paprika': 2,
            'tomato': 3, 'tomato ': 3, 'tomat': 3
        }

        if 'crop_type' in df.columns:
            # Jika isinya teks string, ubah ke angka menggunakan mapping
            if df['crop_type'].dtype == 'object':
                df['crop_type'] = df['crop_type'].astype(str).str.lower().str.strip().map(text_to_num_mapping)
            
            # Paksa konversi ke numerik, jika ada yang gagal/NaN jadikan default 3 (Tomato), lalu paksa jadi int
            df['crop_type'] = pd.to_numeric(df['crop_type'], errors='coerce').fillna(3).astype(int)
        
        # Validasi kelengkapan nama kolom prediktor dasar
        required_cols = ['crop_type'] + NUMERIC_COLS
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            return jsonify({'status': 'error', 'message': f'Kolom tidak cocok. Kurang: {", ".join(missing_cols)}'})
        
        # Ambil nilai murni array setelah crop_type dijamin 100% berupa angka int
        batch_crop_types = df['crop_type'].values
        
        # ── 2. PROSES AMAN 2: PAKSA SEMUA KOLOM SENSOR MENJADI NUMERIK MURNI ──
        for col in NUMERIC_COLS:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)
            
        batch_numeric_data = df[NUMERIC_COLS].values.astype(float)
        
        # ── 3. PROTEKSI DOUBLE SCALING BYPASS ──
        if batch_numeric_data.max() <= 1.0:
            print("-> Jalur Bypass: Data CSV terdeteksi sudah dinormalisasi.")
            batch_final_input = np.column_stack((batch_crop_types, batch_numeric_data))
        else:
            print("-> Jalur Normal: Data CSV berupa angka mentah, menjalankan scaler.transform().")
            batch_scaled_numeric = scaler.transform(batch_numeric_data)
            batch_final_input = np.column_stack((batch_crop_types, batch_scaled_numeric))
        
        # Eksekusi Prediksi Massal sekaligus
        predictions = model.predict(batch_final_input)
        
        # Susun hasil data rows untuk tabel HTML
        results = []
        for idx, pred in enumerate(predictions):
            results.append({
                'baris': idx + 1,
                'crop_type': int(batch_crop_types[idx]), # Di sini dijamin aman dari string 'Tomato'
                'prediksi': "🌟 Tinggi (1)" if pred == 1 else "⚠️ Rendah (0)"
            })
            
        # Evaluasi Metriks (Jika kolom target Yield_Status tersedia)
        has_ground_truth = False
        cm_base64 = ""
        tree_base64 = ""
        report_data = {}
        
        target_col = [col for col in df.columns if col.lower().strip() == 'yield_status']
        if target_col and len(df) > 0:
            # 🔥 PERBAIKAN MUTAKHIR: Gunakan errors='coerce' agar jika ada string nyasar di kolom target, 
            # ia akan diubah menjadi NaN terlebih dahulu, diisi dengan 0, baru diubah aman menjadi int.
            df[target_col[0]] = pd.to_numeric(df[target_col[0]], errors='coerce').fillna(0).astype(int)
            y_true = df[target_col[0]].values
            y_pred = predictions
            
            if len(np.unique(y_true)) > 0:
                has_ground_truth = True
                report_data = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
                
                plt.figure(figsize=(4.5, 3.5))
                cm = confusion_matrix(y_true, y_pred)
                cmap_map = {'random_forest': 'Blues', 'decision_tree': 'Greens', 'naive_bayes': 'Reds'}
                sns.heatmap(cm, annot=True, fmt='d', cmap=cmap_map.get(selected_model, 'Blues'),
                            xticklabels=['Rendah', 'Tinggi'], yticklabels=['Rendah', 'Tinggi'], cbar=False)
                plt.title(f"Confusion Matrix ({selected_model.replace('_',' ').title()})")
                plt.ylabel('Aktual')
                plt.xlabel('Prediksi')
                cm_base64 = plot_to_base64()
                
                if selected_model == 'decision_tree':
                    plt.figure(figsize=(15, 8), facecolor='#ffffff')
                    plot_tree(model, 
                              max_depth=3,
                              feature_names=['crop_type'] + NUMERIC_COLS, 
                              class_names=['Rendah', 'Tinggi'], 
                              filled=True, rounded=True, fontsize=9)
                    plt.title("Struktur Logika Ekstraksi Pohon Keputusan (Decision Tree)", fontsize=14, fontweight='bold', pad=10)
                    tree_base64 = plot_to_base64()

        return jsonify({
            'status': 'success',
            'results': results,
            'has_metrics': has_ground_truth,
            'confusion_matrix_img': cm_base64,
            'tree_img': tree_base64,
            'report': report_data
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})  


if __name__ == '__main__':
    app.run(debug=True, port=5000)
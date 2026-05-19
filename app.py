from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import io

app = Flask(__name__)
CORS(app) # Mengizinkan index.html mengakses server ini

# 1. Load Model dan Scaler
model = joblib.load('model_greenhouse_rf.pkl')
scaler = joblib.load('scaler_greenhouse.pkl')

# Kolom numerik wajib yang dipakai saat training (urutan harus pas)
NUMERIC_COLS = [
    'avg_temperature_C', 'humidity_percent', 'co2_ppm', 'light_intensity_lux',
    'irrigation_mm', 'fertilizer_N_kg_ha', 'fertilizer_P_kg_ha', 'fertilizer_K_kg_ha',
    'soil_pH', 'pest_severity'
]

# ── RUTE 1: SINGLE PREDICTION (DARI FORM INPUT) ──
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        crop_type = data['crop_type']
        
        # Ambil 10 fitur numerik
        numeric_data = [[
            data['avg_temperature_C'], data['humidity_percent'], data['co2_ppm'],
            data['light_intensity_lux'], data['irrigation_mm'], data['fertilizer_N_kg_ha'],
            data['fertilizer_P_kg_ha'], data['fertilizer_K_kg_ha'], data['soil_pH'],
            data['pest_severity']
        ]]
        
        # Normalisasi & Gabungkan kembali
        scaled_numeric = scaler.transform(numeric_data)
        final_input = [[crop_type] + scaled_numeric[0].tolist()]
        
        prediksi = model.predict(final_input)[0]
        hasil = "🌟 Tinggi (1) - Optimal" if prediksi == 1 else "⚠️ Rendah (0) - Risiko"
        return jsonify({'status': 'success', 'prediksi': hasil})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# ── RUTE 2: BATCH PREDICTION (DARI UPLOAD CSV MASSAL) ──
@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    try:
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'Tidak ada file yang diunggah'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'Nama file kosong'})
        
        # Membaca data CSV langsung dari memory buffer
        df = pd.read_csv(io.StringIO(file.stream.read().decode("UTF8")))
        
        # Validasi kecocokan kolom di dalam file CSV
        required_cols = ['crop_type'] + NUMERIC_COLS
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            return jsonify({'status': 'error', 'message': f'Kolom CSV tidak lengkap. Kurang: {", ".join(missing_cols)}'})
        
        # Proses Pemisahan & Scaling Massal (Aman dari error nama fitur)
        batch_crop_types = df['crop_type'].values
        batch_numeric_data = df[NUMERIC_COLS].values
        batch_scaled_numeric = scaler.transform(batch_numeric_data)
        
        # Stack horizontal: tempel crop_type kembali ke kolom paling depan
        batch_final_input = np.column_stack((batch_crop_types, batch_scaled_numeric))
        
        # Prediksi sekaligus secara instan
        predictions = model.predict(batch_final_input)
        
        # Bungkus hasil ke bentuk JSON list agar mudah dibaca JavaScript
        results = []
        for idx, pred in enumerate(predictions):
            results.append({
                'baris': idx + 1,
                'crop_type': int(batch_crop_types[idx]),
                'prediksi': "🌟 Tinggi (1)" if pred == 1 else "⚠️ Rendah (0)"
            })
            
        return jsonify({'status': 'success', 'results': results})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
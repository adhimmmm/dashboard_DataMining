from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

app = Flask(__name__)
CORS(app)

# 1. Load Model dan Scaler
model = joblib.load('model_greenhouse_rf.pkl')
scaler = joblib.load('scaler_greenhouse.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        # 2. PISAHKAN crop_type (Tidak boleh ikut di-scale)
        crop_type = data['crop_type']
        
        # 3. Susun HANYA 10 fitur numerik untuk masuk ke Scaler
        numeric_data = [[
            data['avg_temperature_C'],
            data['humidity_percent'],
            data['co2_ppm'],
            data['light_intensity_lux'],
            data['irrigation_mm'],
            data['fertilizer_N_kg_ha'],
            data['fertilizer_P_kg_ha'],
            data['fertilizer_K_kg_ha'],
            data['soil_pH'],
            data['pest_severity']
        ]]
        
        # 4. Scale 10 fitur numerik tersebut
        scaled_numeric = scaler.transform(numeric_data)
        
        # 5. GABUNGKAN KEMBALI: crop_type di urutan pertama, ditambah 10 fitur yang sudah di-scale
        # scaled_numeric[0].tolist() mengubah array hasil scaling menjadi list biasa
        final_input = [[crop_type] + scaled_numeric[0].tolist()]
        
        # 6. Lakukan Prediksi menggunakan total 11 fitur
        prediksi = model.predict(final_input)[0]
        
        hasil = "🌟 Tinggi (1) - Optimal" if prediksi == 1 else "⚠️ Rendah (0) - Risiko"
        return jsonify({'status': 'success', 'prediksi': hasil})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import logging
import os

app = Flask(__name__)
CORS(app)

# Initialize model and scaler as None
model = None
scaler = None

# Try to load the model and scaler
try:
    model = joblib.load('best_model.joblib')
    scaler = joblib.load('scaler.joblib')
    logging.info("Successfully loaded model and scaler")
except FileNotFoundError as e:
    logging.warning(f"Model files not found: {e}")
    logging.warning("Please upload best_model.joblib and scaler.joblib to the server")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data or 'players' not in data:
            return jsonify({'error': 'Invalid input data'}), 400

        # If model and scaler are not available, return a fallback prediction
        if model is None or scaler is None:
            # Calculate a simple average of player ratings as fallback
            total_rating = sum(player['rating'] for player in data['players'])
            avg_rating = total_rating / len(data['players'])
            predicted_wins = int(avg_rating * 0.5)  # Simple linear relationship
            
            return jsonify({
                'predicted_wins': predicted_wins,
                'message': 'Using fallback prediction as model files are not available'
            })

        # Prepare features for prediction
        features = []
        for player in data['players']:
            player_features = [
                player['rating'],
                player.get('points', 0),
                player.get('rebounds', 0),
                player.get('assists', 0),
                player.get('steals', 0),
                player.get('blocks', 0)
            ]
            features.append(player_features)

        # Scale features and make prediction
        features_scaled = scaler.transform(features)
        predicted_wins = int(model.predict(features_scaled)[0])

        return jsonify({'predicted_wins': predicted_wins})

    except Exception as e:
        logging.error(f"Error during prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'scaler_loaded': scaler is not None
    })

if __name__ == '__main__':
    app.run(debug=True) 
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import logging
import os

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Set fixed random seed for reproducibility
np.random.seed(42)

app = Flask(__name__)
# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Load the model and scaler
model = joblib.load('best_model.joblib')
scaler = joblib.load('scaler.joblib')

def predict_team_wins(player_stats):
    """Predict wins for a given team's player stats"""
    try:
        # Calculate team totals
        team_totals = {
            'PTS': sum(float(p['Points Per Game (Avg)']) for p in player_stats),
            'REB': sum(float(p['Rebounds Per Game (Avg)']) for p in player_stats),
            'AST': sum(float(p['Assists Per Game (Avg)']) for p in player_stats),
            'STL': sum(float(p.get('Steals Per Game (Avg)', 0)) for p in player_stats),
            'BLK': sum(float(p.get('Blocks Per Game (Avg)', 0)) for p in player_stats),
            'FG_PCT': np.mean([float(p.get('Field Goal % (Avg)', 45)) for p in player_stats]),
            'FG3_PCT': np.mean([float(p.get('Three Point % (Avg)', 35)) for p in player_stats]),
            'FT_PCT': np.mean([float(p.get('Free Throw % (Avg)', 75)) for p in player_stats]),
            'PLUS_MINUS': np.mean([float(p.get('Rating', 50)) - 50 for p in player_stats]),
            'MIN': 240,  # Assuming 48 minutes per position * 5 positions
            'GP': np.mean([float(p.get('Games Played (Avg)', 70)) for p in player_stats])
        }
        
        logger.debug("Team totals: %s", team_totals)
        
        # Calculate derived features
        team_totals['EFFICIENCY'] = (team_totals['PTS'] + team_totals['REB'] + team_totals['AST'] + 
                                   team_totals['STL'] + team_totals['BLK']) / 5
        
        # Prepare features for prediction
        features = pd.DataFrame([team_totals])
        
        # Make prediction
        if model is not None:
            predicted_wins = model.predict(features)[0]
            return round(predicted_wins)
        else:
            # Fallback calculation if model is not available
            base_wins = 41
            efficiency_bonus = (team_totals['EFFICIENCY'] - 20) * 0.5
            return round(base_wins + efficiency_bonus)
            
    except Exception as e:
        logger.error("Error in prediction: %s", str(e), exc_info=True)
        return 41  # Return league average if prediction fails

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        logger.debug(f"Received data: {data}")
        
        # Extract features in the correct order
        features = ['PTS', 'REB', 'AST', 'STL', 'BLK', 'FG_PCT', 'FG3_PCT', 'FT_PCT', 'PLUS_MINUS']
        input_data = np.array([[data[feature] for feature in features]])
        
        # Scale the input data
        scaled_data = scaler.transform(input_data)
        
        # Make prediction
        prediction = model.predict(scaled_data)[0]
        
        # Ensure prediction is within reasonable bounds
        prediction = max(20, min(62, prediction))
        
        logger.debug(f"Prediction: {prediction}")
        return jsonify({'predicted_wins': round(prediction)})
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True) 
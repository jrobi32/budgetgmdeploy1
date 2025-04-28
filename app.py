from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import logging
import os

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

def predict_team_wins(player_stats):
    """Predict wins for a given team's player stats using a simple formula"""
    try:
        # Calculate team totals
        team_totals = {
            'points': sum(float(p['Points Per Game (Avg)']) for p in player_stats),
            'rebounds': sum(float(p['Rebounds Per Game (Avg)']) for p in player_stats),
            'assists': sum(float(p['Assists Per Game (Avg)']) for p in player_stats),
            'steals': sum(float(p.get('Steals Per Game (Avg)', 0)) for p in player_stats),
            'blocks': sum(float(p.get('Blocks Per Game (Avg)', 0)) for p in player_stats),
            'fg_pct': np.mean([float(p.get('Field Goal % (Avg)', 45)) for p in player_stats]),
            'ft_pct': np.mean([float(p.get('Free Throw % (Avg)', 75)) for p in player_stats]),
            'three_pct': np.mean([float(p.get('Three Point % (Avg)', 35)) for p in player_stats])
        }
        
        logger.debug("Team totals: %s", team_totals)
        
        # Simple win prediction formula based on key stats
        base_wins = 41  # League average
        efficiency_bonus = (
            (team_totals['points'] * 0.2) +
            (team_totals['rebounds'] * 0.1) +
            (team_totals['assists'] * 0.1) +
            (team_totals['steals'] * 0.05) +
            (team_totals['blocks'] * 0.05) +
            ((team_totals['fg_pct'] - 45) * 0.5) +
            ((team_totals['ft_pct'] - 75) * 0.2) +
            ((team_totals['three_pct'] - 35) * 0.3)
        ) / 5
        
        predicted_wins = base_wins + efficiency_bonus
        return round(max(20, min(62, predicted_wins)))
            
    except Exception as e:
        logger.error("Error in prediction: %s", str(e), exc_info=True)
        return 41  # Return league average if prediction fails

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        logger.debug(f"Received data: {data}")
        
        # Make prediction using the simplified function
        prediction = predict_team_wins(data)
        
        logger.debug(f"Prediction: {prediction}")
        return jsonify({'predicted_wins': prediction})
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Service is running with simplified prediction model'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True) 
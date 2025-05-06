import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
import joblib

def load_and_prepare_data():
    # Load the team stats
    df = pd.read_csv('nba_team_stats.csv')
    
    # Select relevant columns
    team_stats = df[[
        'PTS',  # Points per game
        'REB',  # Rebounds per game
        'AST',  # Assists per game
        'STL',  # Steals per game
        'BLK',  # Blocks per game
        'FG_PCT',  # Field goal percentage
        'FT_PCT',  # Free throw percentage
        'FG3_PCT',  # Three-point percentage
        'W'  # Wins
    ]]
    
    # Rename columns to match our player stats format
    team_stats.columns = [
        'points', 'rebounds', 'assists', 'steals', 'blocks',
        'fg_pct', 'ft_pct', 'three_pct', 'wins'
    ]
    
    # Scale down counting stats to represent starters-only (approximately 70% of team stats)
    starter_stats = team_stats.copy()
    counting_stats = ['points', 'rebounds', 'assists', 'steals', 'blocks']
    starter_stats[counting_stats] = team_stats[counting_stats] * 0.7
    
    return starter_stats

def train_model():
    # Load and prepare data
    data = load_and_prepare_data()
    
    # Features and target
    X = data[['points', 'rebounds', 'assists', 'steals', 'blocks', 
              'fg_pct', 'ft_pct', 'three_pct']]
    y = data['wins']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    
    # Print coefficients
    print("\nModel Coefficients:")
    for feature, coef in zip(X.columns, model.coef_):
        print(f"{feature}: {coef:.4f}")
    print(f"Intercept: {model.intercept_:.4f}")
    print(f"\nR² Score: {r2:.4f}")
    
    # Save model
    joblib.dump(model, 'win_predictor_model.joblib')
    
    return model.coef_, model.intercept_

if __name__ == "__main__":
    coefficients, intercept = train_model()
    
    # Print JavaScript code to update the game.js file
    print("\nJavaScript code to update calculateExpectedWins function:")
    print("""
function calculateExpectedWins(selectedPlayers) {
    try {
        // Calculate team statistics
        const teamStats = {
            points: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Points Per Game (Avg)']), 0),
            rebounds: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Rebounds Per Game (Avg)']), 0),
            assists: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Assists Per Game (Avg)']), 0),
            steals: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Steals Per Game (Avg)']), 0),
            blocks: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Blocks Per Game (Avg)']), 0),
            fg_pct: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Field Goal % (Avg)']), 0) / selectedPlayers.length,
            ft_pct: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Free Throw % (Avg)']), 0) / selectedPlayers.length,
            three_pct: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Three Point % (Avg)']), 0) / selectedPlayers.length
        };

        // Calculate predicted wins using the trained model coefficients
        let predictedWins = """ + f"{intercept:.4f}" + """ +
            (teamStats.points * """ + f"{coefficients[0]:.4f}" + """) +
            (teamStats.rebounds * """ + f"{coefficients[1]:.4f}" + """) +
            (teamStats.assists * """ + f"{coefficients[2]:.4f}" + """) +
            (teamStats.steals * """ + f"{coefficients[3]:.4f}" + """) +
            (teamStats.blocks * """ + f"{coefficients[4]:.4f}" + """) +
            (teamStats.fg_pct * """ + f"{coefficients[5]:.4f}" + """) +
            (teamStats.ft_pct * """ + f"{coefficients[6]:.4f}" + """) +
            (teamStats.three_pct * """ + f"{coefficients[7]:.4f}" + """);

        // Scale up the prediction since bench players will contribute some wins
        predictedWins = predictedWins * 1.3;  // Assume starters account for about 70% of wins
        
        // Ensure prediction stays within reasonable bounds and round to nearest integer
        return Math.round(Math.max(20, Math.min(62, predictedWins)));
    } catch (error) {
        console.error('Error in win calculation:', error);
        return 41; // Return league average if calculation fails
    }
}
    """) 
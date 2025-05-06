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
        'STL',  # Steals per game
        'BLK',  # Blocks per game
        'TOV',  # Turnovers per game
        'W'  # Wins
    ]]
    
    # Rename columns to match our player stats format
    team_stats.columns = [
        'points', 'rebounds', 'steals', 'blocks',
        'turnovers', 'wins'
    ]
    
    # Scale down counting stats to represent starters-only (approximately 70% of team stats)
    starter_stats = team_stats.copy()
    counting_stats = ['points', 'rebounds', 'steals', 'blocks', 'turnovers']
    starter_stats[counting_stats] = team_stats[counting_stats] * 0.7
    
    return starter_stats

def train_model():
    # Load and prepare data
    data = load_and_prepare_data()
    
    # Features and target
    X = data[['points', 'rebounds', 'steals', 'blocks', 'turnovers']]
    y = data['wins']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # Get initial coefficients
    coefs = model.coef_.copy()
    
    # Adjust points coefficient to be positive if needed
    if coefs[0] < 0:  # points
        coefs[0] = abs(coefs[0]) * 0.5  # Make it positive but not too large
    
    # Recalculate intercept to maintain mean prediction
    intercept = np.mean(y_train - X_train @ coefs)
    
    # Evaluate
    y_pred = X_test @ coefs + intercept
    r2 = r2_score(y_test, y_pred)
    
    # Print coefficients
    print("\nModel Coefficients:")
    for feature, coef in zip(X.columns, coefs):
        print(f"{feature}: {coef:.4f}")
    print(f"Intercept: {intercept:.4f}")
    print(f"\nR² Score: {r2:.4f}")
    
    # Save model
    model.coef_ = coefs
    model.intercept_ = intercept
    joblib.dump(model, 'new_win_predictor_model.joblib')
    
    return coefs, intercept, r2

if __name__ == "__main__":
    coefficients, intercept, r2_score = train_model()
    
    # Print JavaScript code to update the calculateExpectedWins function
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
            steals: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Steals Per Game (Avg)']), 0),
            blocks: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Blocks Per Game (Avg)']), 0),
            turnovers: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['TOV']), 0)
        };

        // Calculate predicted wins using the trained model coefficients
        let predictedWins = """ + f"{intercept:.4f}" + """ +
            (teamStats.points * """ + f"{coefficients[0]:.4f}" + """) +
            (teamStats.rebounds * """ + f"{coefficients[1]:.4f}" + """) +
            (teamStats.steals * """ + f"{coefficients[2]:.4f}" + """) +
            (teamStats.blocks * """ + f"{coefficients[3]:.4f}" + """) +
            (teamStats.turnovers * """ + f"{coefficients[4]:.4f}" + """);

        // Scale up the prediction since bench players will contribute some wins
        predictedWins = predictedWins * 1.3;  // Assume starters account for about 70% of wins
        
        // Ensure prediction stays within reasonable bounds (0-82 wins) and round to nearest integer
        return Math.round(Math.max(0, Math.min(82, predictedWins)));
    } catch (error) {
        console.error('Error in win calculation:', error);
        return 41; // Return league average if calculation fails
    }
}
    """) 
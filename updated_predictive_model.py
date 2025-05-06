import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
import joblib

def calculate_scoring_efficiency(points, fg_pct):
    # Combine points and field goal percentage
    # Higher points with better shooting is more valuable
    efficiency = points * fg_pct
    return efficiency

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
        'TOV',  # Turnovers per game
        'FG_PCT',  # Field goal percentage
        'FT_PCT',  # Free throw percentage
        'FG3_PCT',  # Three-point percentage
        'W'  # Wins
    ]]
    
    # Rename columns to match our player stats format
    team_stats.columns = [
        'points', 'rebounds', 'assists', 'steals', 'blocks',
        'turnovers', 'fg_pct', 'ft_pct', 'three_pct', 'wins'
    ]
    
    # Scale down counting stats to represent starters-only (approximately 70% of team stats)
    starter_stats = team_stats.copy()
    counting_stats = ['points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers']
    starter_stats[counting_stats] = team_stats[counting_stats] * 0.7
    
    # Scale down percentage stats to account for starters' higher efficiency
    # Starters typically shoot better than bench players
    percentage_stats = ['fg_pct', 'ft_pct', 'three_pct']
    starter_stats[percentage_stats] = team_stats[percentage_stats] * 1.1  # Assume 10% better shooting
    
    # Calculate scoring efficiency (points * FG%)
    starter_stats['scoring_efficiency'] = calculate_scoring_efficiency(
        starter_stats['points'],
        starter_stats['fg_pct']
    )
    
    # Calculate assist-to-turnover ratio
    starter_stats['ast_to_tov'] = starter_stats['assists'] / starter_stats['turnovers']
    
    # Handle any potential division by zero
    starter_stats['ast_to_tov'] = starter_stats['ast_to_tov'].replace([np.inf, -np.inf], 0)
    
    return starter_stats

def train_model():
    # Load and prepare data
    data = load_and_prepare_data()
    
    # Features and target
    X = data[['scoring_efficiency', 'rebounds', 'ast_to_tov', 'steals', 'blocks', 
              'ft_pct', 'three_pct']]
    y = data['wins']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # Get coefficients
    coefs = model.coef_
    intercept = model.intercept_
    
    # Evaluate
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    
    # Print model details
    print("\nModel Coefficients:")
    for feature, coef in zip(X.columns, coefs):
        print(f"{feature}: {coef:.4f}")
    print(f"Intercept: {intercept:.4f}")
    print(f"\nR² Score: {r2:.4f}")
    print(f"RMSE: {rmse:.4f}")
    
    # Print some example predictions
    print("\nExample Predictions:")
    for i in range(min(5, len(X_test))):
        actual = y_test.iloc[i]
        predicted = y_pred[i]
        print(f"Actual wins: {actual:.1f}, Predicted wins: {predicted:.1f}")
    
    # Save model
    joblib.dump(model, 'starter_win_predictor_model.joblib')
    
    return coefs, intercept, r2

if __name__ == "__main__":
    coefficients, intercept, r2_score = train_model()
    
    # Print JavaScript code to update the calculateExpectedWins function
    print("\nJavaScript code to update calculateExpectedWins function:")
    print("""
function calculateScoringEfficiency(points, fg_pct) {
    // Combine points and field goal percentage
    // Higher points with better shooting is more valuable
    return points * fg_pct;
}

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
            turnovers: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['TOV']), 0),
            fg_pct: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Field Goal % (Avg)']), 0) / selectedPlayers.length,
            ft_pct: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Free Throw % (Avg)']), 0) / selectedPlayers.length,
            three_pct: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Three Point % (Avg)']), 0) / selectedPlayers.length
        };

        // Calculate scoring efficiency
        const scoringEfficiency = calculateScoringEfficiency(
            teamStats.points,
            teamStats.fg_pct
        );

        // Calculate assist-to-turnover ratio
        const astToTov = teamStats.turnovers === 0 ? 0 : teamStats.assists / teamStats.turnovers;

        // Calculate predicted wins using the trained model coefficients
        let predictedWins = """ + f"{intercept:.4f}" + """ +
            (scoringEfficiency * """ + f"{coefficients[0]:.4f}" + """) +
            (teamStats.rebounds * """ + f"{coefficients[1]:.4f}" + """) +
            (astToTov * """ + f"{coefficients[2]:.4f}" + """) +
            (teamStats.steals * """ + f"{coefficients[3]:.4f}" + """) +
            (teamStats.blocks * """ + f"{coefficients[4]:.4f}" + """) +
            (teamStats.ft_pct * """ + f"{coefficients[5]:.4f}" + """) +
            (teamStats.three_pct * """ + f"{coefficients[6]:.4f}" + """);

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
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import json

def prepare_features(player_stats_df, team_stats_df):
    """Prepare features for the model"""
    # Group player stats by team and season, taking top 5 players by minutes played
    team_player_stats = player_stats_df.sort_values('MIN', ascending=False).groupby(['TEAM_ID', 'SEASON']).head(5)
    
    # Calculate team-level statistics from starting lineup
    team_stats = team_player_stats.groupby(['TEAM_ID', 'SEASON']).agg({
        # Basic stats (summed)
        'PTS': 'sum',  # Total points from starting lineup
        'REB': 'sum',  # Total rebounds from starting lineup
        'AST': 'sum',  # Total assists from starting lineup
        'STL': 'sum',  # Total steals from starting lineup
        'BLK': 'sum',  # Total blocks from starting lineup
        
        # Shooting percentages (averaged)
        'FG_PCT': 'mean',  # Average field goal percentage
        'FG3_PCT': 'mean',  # Average three-point percentage
        'FT_PCT': 'mean',  # Average free throw percentage
        
        # Advanced metrics
        'PLUS_MINUS': 'mean',  # Average plus/minus
        'MIN': 'sum',  # Total minutes played
        'GP': 'mean'  # Average games played
    }).reset_index()
    
    # Calculate derived features
    team_stats['EFFICIENCY'] = (team_stats['PTS'] + team_stats['REB'] + team_stats['AST'] + 
                               team_stats['STL'] + team_stats['BLK']) / 5
    
    # Merge with team stats
    features = pd.merge(
        team_stats,
        team_stats_df[['TEAM_ID', 'SEASON', 'W_PCT', 'W', 'L']],
        on=['TEAM_ID', 'SEASON']
    )
    
    # Select features for the model
    X = features[[
        # Basic stats
        'PTS', 'REB', 'AST', 'STL', 'BLK',
        
        # Shooting percentages
        'FG_PCT', 'FG3_PCT', 'FT_PCT',
        
        # Advanced metrics
        'PLUS_MINUS', 'EFFICIENCY', 'MIN', 'GP'
    ]]
    
    y = features['W']  # Target variable: number of wins
    
    return X, y

def train_random_forest(X, y):
    """Train the Random Forest model"""
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Initialize and train the model
    rf = RandomForestRegressor(
        n_estimators=500,  # Increased number of trees
        max_depth=25,      # Increased depth
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    rf.fit(X_train, y_train)
    
    # Evaluate the model
    y_pred = rf.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Mean Squared Error: {mse:.2f}")
    print(f"R2 Score: {r2:.2f}")
    
    # Get feature importance
    feature_importance = dict(zip(X.columns, rf.feature_importances_))
    print("\nFeature Importance:")
    for feature, importance in sorted(feature_importance.items(), key=lambda x: x[1], reverse=True):
        print(f"{feature}: {importance:.3f}")
    
    return rf

def predict_team_wins(model, player_stats):
    """Predict wins for a given team's player stats"""
    # Calculate team totals
    team_totals = {
        'PTS': sum(p['Points Per Game (Avg)'] for p in player_stats),
        'REB': sum(p['Rebounds Per Game (Avg)'] for p in player_stats),
        'AST': sum(p['Assists Per Game (Avg)'] for p in player_stats),
        'STL': sum(p['Steals Per Game (Avg)'] for p in player_stats),
        'BLK': sum(p['Blocks Per Game (Avg)'] for p in player_stats),
        'FG_PCT': np.mean([p['Field Goal % (Avg)'] for p in player_stats]),
        'FG3_PCT': np.mean([p['Three Point % (Avg)'] for p in player_stats]),
        'FT_PCT': np.mean([p['Free Throw % (Avg)'] for p in player_stats]),
        'PLUS_MINUS': np.mean([p['Rating'] - 50 for p in player_stats]),
        'MIN': 240,  # Assuming 48 minutes per position * 5 positions
        'GP': np.mean([p['Games Played (Avg)'] for p in player_stats])
    }
    
    # Calculate derived features
    team_totals['EFFICIENCY'] = (team_totals['PTS'] + team_totals['REB'] + team_totals['AST'] + 
                                team_totals['STL'] + team_totals['BLK']) / 5
    
    # Prepare features for prediction
    features = pd.DataFrame([team_totals])
    
    # Make prediction
    predicted_wins = model.predict(features)[0]
    return round(predicted_wins)

if __name__ == "__main__":
    # Load the data
    player_stats_df = pd.read_csv('nba_starting_lineup_stats.csv')
    team_stats_df = pd.read_csv('nba_team_stats.csv')
    
    # Prepare features and train model
    X, y = prepare_features(player_stats_df, team_stats_df)
    model = train_random_forest(X, y)
    
    # Save the model
    joblib.dump(model, 'nba_win_predictor.joblib')
    
    print("\nModel trained and saved successfully!") 
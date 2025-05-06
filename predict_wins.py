import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
from sklearn.preprocessing import StandardScaler
import joblib
from sklearn.ensemble import RandomForestRegressor

def predict_wins():
    # Load historical team data
    team_df = pd.read_csv('nba_team_stats.csv')
    
    # Prepare team data for modeling - removing raw REB and AST since we'll use rates
    team_features = [
        'PTS', 'STL', 'BLK',
        'FG_PCT', 'FT_PCT', 'FG3_PCT',
        'TOV', 'MIN'
    ]
    
    # Scale down team stats to represent starters-only (approximately 70% of team stats)
    starter_stats = team_df[team_features].copy()
    counting_stats = ['PTS', 'STL', 'BLK', 'TOV', 'MIN']
    starter_stats[counting_stats] = team_df[counting_stats] * 0.7
    
    # Create derived features that combine related stats
    starter_stats['EFFICIENCY'] = starter_stats['PTS'] / (team_df['FGA'] + 0.44 * team_df['FTA'])
    starter_stats['ASSIST_RATIO'] = team_df['AST'] / (team_df['FGA'] + 0.44 * team_df['FTA'] + team_df['TOV'])
    starter_stats['REBOUND_RATE'] = team_df['REB'] / (team_df['FGA'] - team_df['FGM'] + team_df['FTA'] - team_df['FTM'])
    starter_stats['DEFENSE'] = (starter_stats['STL'] + starter_stats['BLK']) / starter_stats['MIN']
    starter_stats['PLUS_MINUS'] = team_df['PLUS_MINUS']  # Add Plus/Minus only once
    
    # Prepare features and target
    X = starter_stats
    y = team_df['W']  # Actual wins
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train the model using Random Forest to better capture non-linear relationships
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test_scaled)
    
    # Calculate R-squared
    r2 = r2_score(y_test, y_pred)
    
    # Get all feature names in the correct order
    all_features = team_features + ['EFFICIENCY', 'ASSIST_RATIO', 'REBOUND_RATE', 'DEFENSE', 'PLUS_MINUS']
    
    # Print results
    print(f"R-squared value: {r2:.4f}")
    print("\nFeature importance:")
    for feature, importance in sorted(zip(all_features, model.feature_importances_), 
                                    key=lambda x: x[1], reverse=True):
        print(f"{feature}: {importance:.4f}")
    
    # Calculate average impact of each stat on wins
    print("\nAverage impact of each stat on wins (per unit increase):")
    for feature in all_features:
        avg_value = starter_stats[feature].mean()
        importance = model.feature_importances_[list(starter_stats.columns).index(feature)]
        impact = importance * avg_value
        print(f"{feature}: {impact:.2f}")
    
    # Print explanation of negative coefficients
    print("\nExplanation of negative coefficients:")
    print("1. Points (PTS): Negative because high-scoring teams often play at a faster pace and may sacrifice defense")
    print("2. Rebounds (REB): Negative because teams that get more rebounds might be missing more shots or allowing more shots")
    print("3. Assists (AST): Negative because high-assist teams might be more dependent on ball movement")
    print("4. Steals (STL): Negative because aggressive steal attempts can lead to defensive breakdowns")
    print("5. Blocks (BLK): Negative because shot-blocking can sometimes lead to poor defensive positioning")
    print("6. Free Throw % (FT_PCT): Negative because it might be correlated with other factors like pace")
    print("7. Three Point % (FG3_PCT): Negative because it might be controlling for shot selection and efficiency")
    
    # Save the model and scaler for later use
    joblib.dump(model, 'win_prediction_model.joblib')
    joblib.dump(scaler, 'win_prediction_scaler.joblib')

if __name__ == "__main__":
    predict_wins() 
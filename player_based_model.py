# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler

# Load the player stats data
df = pd.read_csv('nba_players_final.csv')

# Select features for the model
features = [
    'Games Played (Avg)',
    'Points Per Game (Avg)',
    'Rebounds Per Game (Avg)',
    'Assists Per Game (Avg)',
    'Steals Per Game (Avg)',
    'Blocks Per Game (Avg)',
    'Field Goal % (Avg)',
    'Free Throw % (Avg)',
    'Three Point % (Avg)',
    'Rating'
]

# Create synthetic team data by randomly grouping 5 players
np.random.seed(42)
n_teams = len(df) // 5
team_data = []

for i in range(n_teams):
    # Randomly select 5 players
    team_players = df.sample(n=5)
    
    # Calculate team-level features
    team_features = {
        'Games Played (Avg)': team_players['Games Played (Avg)'].mean(),
        'Points Per Game (Avg)': team_players['Points Per Game (Avg)'].sum(),
        'Rebounds Per Game (Avg)': team_players['Rebounds Per Game (Avg)'].sum(),
        'Assists Per Game (Avg)': team_players['Assists Per Game (Avg)'].sum(),
        'Steals Per Game (Avg)': team_players['Steals Per Game (Avg)'].sum(),
        'Blocks Per Game (Avg)': team_players['Blocks Per Game (Avg)'].sum(),
        'Field Goal % (Avg)': team_players['Field Goal % (Avg)'].mean(),
        'Free Throw % (Avg)': team_players['Free Throw % (Avg)'].mean(),
        'Three Point % (Avg)': team_players['Three Point % (Avg)'].mean(),
        'Rating': team_players['Rating'].mean()
    }
    
    # Calculate expected wins based on team ratings and stats
    # Higher weights for important stats
    expected_wins = (
        team_features['Rating'] * 0.4 +  # Rating has highest weight
        team_features['Points Per Game (Avg)'] * 0.3 +  # Points important
        team_features['Field Goal % (Avg)'] * 100 * 0.2 +  # Efficiency matters
        team_features['Rebounds Per Game (Avg)'] * 0.1 +  # Other stats have smaller impact
        team_features['Assists Per Game (Avg)'] * 0.1 +
        team_features['Steals Per Game (Avg)'] * 0.1 +
        team_features['Blocks Per Game (Avg)'] * 0.1
    )
    
    # Normalize to realistic win range (0-82)
    expected_wins = np.clip(expected_wins * 0.8, 0, 82)  # Scale factor to get realistic win totals
    
    team_features['Wins'] = expected_wins
    team_data.append(team_features)

# Convert to DataFrame
team_df = pd.DataFrame(team_data)

# Prepare X and y
X = team_df[features]
y = team_df['Wins']

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale the features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Create and train the model
model = LinearRegression()
model.fit(X_train_scaled, y_train)

# Make predictions
y_pred = model.predict(X_test_scaled)

# Calculate R-squared score
r2 = r2_score(y_test, y_pred)

# Print model coefficients and R-squared score
print("\nModel Coefficients:")
for feature, coef in zip(features, model.coef_):
    print(f"{feature}: {coef:.4f}")

print(f"\nR-squared Score: {r2:.4f}")

# Create a bar plot of feature importance
plt.figure(figsize=(12, 6))
plt.bar(features, np.abs(model.coef_))
plt.xticks(rotation=45, ha='right')
plt.title('Feature Importance in Player-Based Team Performance Model')
plt.tight_layout()
plt.savefig('player_based_model_feature_importance.png')
plt.close()

# Function to predict team performance based on player stats
def predict_team_performance(player_stats_list):
    """
    Predict team performance based on a list of player statistics
    
    Parameters:
    player_stats_list (list): List of dictionaries containing player statistics
    
    Returns:
    float: Predicted number of wins
    """
    # Calculate team-level features
    team_features = {
        'Games Played (Avg)': np.mean([p['Games Played (Avg)'] for p in player_stats_list]),
        'Points Per Game (Avg)': sum(p['Points Per Game (Avg)'] for p in player_stats_list),
        'Rebounds Per Game (Avg)': sum(p['Rebounds Per Game (Avg)'] for p in player_stats_list),
        'Assists Per Game (Avg)': sum(p['Assists Per Game (Avg)'] for p in player_stats_list),
        'Steals Per Game (Avg)': sum(p['Steals Per Game (Avg)'] for p in player_stats_list),
        'Blocks Per Game (Avg)': sum(p['Blocks Per Game (Avg)'] for p in player_stats_list),
        'Field Goal % (Avg)': np.mean([p['Field Goal % (Avg)'] for p in player_stats_list]),
        'Free Throw % (Avg)': np.mean([p['Free Throw % (Avg)'] for p in player_stats_list]),
        'Three Point % (Avg)': np.mean([p['Three Point % (Avg)'] for p in player_stats_list]),
        'Rating': np.mean([p['Rating'] for p in player_stats_list])
    }
    
    # Convert to DataFrame
    input_data = pd.DataFrame([team_features])
    
    # Scale the input data
    input_scaled = scaler.transform(input_data)
    
    # Make prediction
    prediction = model.predict(input_scaled)[0]
    
    # Ensure prediction is in realistic range
    prediction = np.clip(prediction, 0, 82)
    
    return prediction

# Example usage
if __name__ == "__main__":
    # Example player stats (5 players)
    example_players = [
        {
            'Games Played (Avg)': 75.0,
            'Points Per Game (Avg)': 25.0,
            'Rebounds Per Game (Avg)': 5.0,
            'Assists Per Game (Avg)': 6.0,
            'Steals Per Game (Avg)': 1.5,
            'Blocks Per Game (Avg)': 0.5,
            'Field Goal % (Avg)': 0.48,
            'Free Throw % (Avg)': 0.85,
            'Three Point % (Avg)': 0.38,
            'Rating': 85.0
        },
        {
            'Games Played (Avg)': 70.0,
            'Points Per Game (Avg)': 18.0,
            'Rebounds Per Game (Avg)': 8.0,
            'Assists Per Game (Avg)': 3.0,
            'Steals Per Game (Avg)': 1.0,
            'Blocks Per Game (Avg)': 1.0,
            'Field Goal % (Avg)': 0.52,
            'Free Throw % (Avg)': 0.75,
            'Three Point % (Avg)': 0.35,
            'Rating': 80.0
        },
        {
            'Games Played (Avg)': 72.0,
            'Points Per Game (Avg)': 15.0,
            'Rebounds Per Game (Avg)': 7.0,
            'Assists Per Game (Avg)': 2.0,
            'Steals Per Game (Avg)': 0.8,
            'Blocks Per Game (Avg)': 0.8,
            'Field Goal % (Avg)': 0.50,
            'Free Throw % (Avg)': 0.78,
            'Three Point % (Avg)': 0.36,
            'Rating': 75.0
        },
        {
            'Games Played (Avg)': 68.0,
            'Points Per Game (Avg)': 12.0,
            'Rebounds Per Game (Avg)': 6.0,
            'Assists Per Game (Avg)': 1.5,
            'Steals Per Game (Avg)': 0.7,
            'Blocks Per Game (Avg)': 0.5,
            'Field Goal % (Avg)': 0.45,
            'Free Throw % (Avg)': 0.80,
            'Three Point % (Avg)': 0.37,
            'Rating': 72.0
        },
        {
            'Games Played (Avg)': 65.0,
            'Points Per Game (Avg)': 10.0,
            'Rebounds Per Game (Avg)': 4.0,
            'Assists Per Game (Avg)': 1.0,
            'Steals Per Game (Avg)': 0.5,
            'Blocks Per Game (Avg)': 0.3,
            'Field Goal % (Avg)': 0.44,
            'Free Throw % (Avg)': 0.75,
            'Three Point % (Avg)': 0.34,
            'Rating': 70.0
        }
    ]
    
    predicted_wins = predict_team_performance(example_players)
    print(f"\nExample Prediction:")
    print(f"Predicted Wins: {predicted_wins:.1f}")
    
    # Print team totals
    print("\nTeam Totals:")
    print(f"Total Points Per Game: {sum(p['Points Per Game (Avg)'] for p in example_players):.1f}")
    print(f"Total Rebounds Per Game: {sum(p['Rebounds Per Game (Avg)'] for p in example_players):.1f}")
    print(f"Total Assists Per Game: {sum(p['Assists Per Game (Avg)'] for p in example_players):.1f}")
    print(f"Average Rating: {np.mean([p['Rating'] for p in example_players]):.1f}") 
# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler

# Load the team stats data
df = pd.read_csv('nba_team_stats.csv')

# Select features for the model - using available stats
features = [
    # Basic Stats
    'PTS',      # Points per game
    'REB',      # Total rebounds per game
    'OREB',     # Offensive rebounds per game
    'DREB',     # Defensive rebounds per game
    'AST',      # Assists per game
    'STL',      # Steals per game
    'BLK',      # Blocks per game
    'TOV',      # Turnovers per game
    'PF',       # Personal fouls
    'PFD',      # Personal fouls drawn
    
    # Shooting Stats
    'FGM',      # Field goals made
    'FGA',      # Field goals attempted
    'FG_PCT',   # Field goal percentage
    'FG3M',     # Three pointers made
    'FG3A',     # Three pointers attempted
    'FG3_PCT',  # Three point percentage
    'FTM',      # Free throws made
    'FTA',      # Free throws attempted
    'FT_PCT',   # Free throw percentage
    
    # Other
    'MIN',      # Minutes played
    'PLUS_MINUS'  # Plus/Minus
]

# Target variable - Win percentage
target = 'W_PCT'

# Prepare X and y
X = df[features]
y = df[target]

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
plt.figure(figsize=(15, 8))
plt.bar(features, np.abs(model.coef_))
plt.xticks(rotation=45, ha='right')
plt.title('Feature Importance in Team Performance Model')
plt.tight_layout()
plt.savefig('team_performance_feature_importance.png')
plt.close()

# Function to predict team performance
def predict_team_performance(team_stats):
    """
    Predict team performance based on team statistics
    
    Parameters:
    team_stats (dict): Dictionary containing team statistics
        Required keys: All features listed above
    
    Returns:
    float: Predicted win percentage
    """
    # Convert input to DataFrame
    input_data = pd.DataFrame([team_stats])
    
    # Scale the input data
    input_scaled = scaler.transform(input_data)
    
    # Make prediction
    prediction = model.predict(input_scaled)[0]
    
    return prediction

# Example usage
if __name__ == "__main__":
    # Example team stats
    example_stats = {
        'PTS': 110.0,
        'REB': 45.0,
        'OREB': 10.0,
        'DREB': 35.0,
        'AST': 25.0,
        'STL': 8.0,
        'BLK': 5.0,
        'TOV': 14.0,
        'PF': 20.0,
        'PFD': 20.0,
        'FGM': 40.0,
        'FGA': 90.0,
        'FG_PCT': 0.45,
        'FG3M': 12.0,
        'FG3A': 35.0,
        'FG3_PCT': 0.35,
        'FTM': 18.0,
        'FTA': 22.0,
        'FT_PCT': 0.80,
        'MIN': 240.0,
        'PLUS_MINUS': 5.0
    }
    
    predicted_win_pct = predict_team_performance(example_stats)
    print(f"\nExample Prediction:")
    print(f"Predicted Win Percentage: {predicted_win_pct:.4f}")

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
import xgboost as xgb
from sklearn.preprocessing import StandardScaler
import joblib

# Load the data
df = pd.read_csv('nba_team_stats.csv')

# Select features and target
features = ['PTS', 'REB', 'AST', 'STL', 'BLK', 'FG_PCT', 'FG3_PCT', 'FT_PCT', 'PLUS_MINUS']
X = df[features]
y = df['W']

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale the features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Initialize models
models = {
    'Linear Regression': LinearRegression(),
    'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42),
    'XGBoost': xgb.XGBRegressor(random_state=42)
}

# Train and evaluate each model
results = {}
for name, model in models.items():
    # Train the model
    model.fit(X_train_scaled, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test_scaled)
    
    # Calculate R²
    r2 = r2_score(y_test, y_pred)
    results[name] = r2
    
    # Print feature importance for tree-based models
    if name in ['Random Forest', 'XGBoost']:
        print(f"\n{name} Feature Importance:")
        if name == 'Random Forest':
            importance = model.feature_importances_
        else:
            importance = model.feature_importances_
        
        for feature, imp in sorted(zip(features, importance), key=lambda x: x[1], reverse=True):
            print(f"{feature}: {imp:.4f}")

# Print results
print("\nModel Comparison Results:")
for name, r2 in sorted(results.items(), key=lambda x: x[1], reverse=True):
    print(f"{name}: R² = {r2:.4f}")

# Save the best model
best_model_name = max(results, key=results.get)
best_model = models[best_model_name]
joblib.dump(best_model, 'best_model.joblib')
joblib.dump(scaler, 'scaler.joblib')

print(f"\nBest model ({best_model_name}) saved to best_model.joblib") 
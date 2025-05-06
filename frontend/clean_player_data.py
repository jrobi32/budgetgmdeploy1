import pandas as pd
import numpy as np

def clean_player_data():
    # Read the CSV file
    df = pd.read_csv('nba_players_final_updated.csv')
    
    # Remove duplicates based on Player ID
    df = df.drop_duplicates(subset=['Player ID'], keep='first')
    
    # Standardize position values
    position_mapping = {
        'G': 'Guard',
        'F': 'Forward',
        'C': 'Center',
        'G-F': 'Guard-Forward',
        'F-G': 'Forward-Guard',
        'F-C': 'Forward-Center',
        'C-F': 'Center-Forward'
    }
    df['Position'] = df['Position'].map(position_mapping).fillna(df['Position'])
    
    # Clean up player names
    df['Full Name'] = df['Full Name'].str.strip()
    df['First Name'] = df['First Name'].str.strip()
    df['Last Name'] = df['Last Name'].str.strip()
    
    # Select only the most relevant columns and remove duplicates
    columns_to_keep = [
        'Player ID', 'Full Name', 'First Name', 'Last Name', 'Position',
        'Games Played (Avg)', 'Points Per Game (Avg)', 'Rebounds Per Game (Avg)',
        'Assists Per Game (Avg)', 'Steals Per Game (Avg)', 'Blocks Per Game (Avg)',
        'Field Goal % (Avg)', 'Free Throw % (Avg)', 'Three Point % (Avg)',
        'Rating', 'Dollar Value'
    ]
    
    df = df[columns_to_keep]
    
    # Handle missing values
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    df[numeric_columns] = df[numeric_columns].fillna(0)
    
    # Convert numeric columns to appropriate types
    for col in numeric_columns:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # Sort by last name for easier reference
    df = df.sort_values('Last Name')
    
    # Save cleaned data
    df.to_csv('nba_players_cleaned.csv', index=False)
    print(f"Cleaned data saved to nba_players_cleaned.csv")
    print(f"Original row count: {len(pd.read_csv('nba_players_final_updated.csv'))}")
    print(f"Cleaned row count: {len(df)}")
    print(f"Removed {len(pd.read_csv('nba_players_final_updated.csv')) - len(df)} duplicate rows")
    print(f"Number of columns before cleaning: {len(pd.read_csv('nba_players_final_updated.csv').columns)}")
    print(f"Number of columns after cleaning: {len(df.columns)}")

if __name__ == "__main__":
    clean_player_data() 
import pandas as pd
import requests
import time
import json

def get_player_stats(player_id):
    """Get all available stats for a player from NBA API"""
    url = "https://stats.nba.com/stats/playergamelog"
    
    headers = {
        'Host': 'stats.nba.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-nba-stats-origin': 'stats',
        'x-nba-stats-token': 'true',
        'Connection': 'keep-alive',
        'Referer': 'https://www.nba.com/',
        'Origin': 'https://www.nba.com'
    }
    
    params = {
        'LastNGames': 0,
        'LeagueID': '00',
        'PlayerID': player_id,
        'Season': '2023-24',
        'SeasonType': 'Regular Season'
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract stats from response
        if 'resultSets' in data and len(data['resultSets']) > 0:
            player_stats = data['resultSets'][0]
            headers = player_stats['headers']
            rows = player_stats['rowSet']
            
            if len(rows) > 0:
                # Calculate averages from all games
                total_games = len(rows)
                stats_sum = {}
                
                for row in rows:
                    for header, value in zip(headers, row):
                        if header not in ['GAME_DATE', 'MATCHUP', 'WL', 'MIN']:
                            if header not in stats_sum:
                                stats_sum[header] = 0
                            if isinstance(value, (int, float)):
                                stats_sum[header] += float(value)
                
                # Calculate averages
                stats_avg = {}
                for header, total in stats_sum.items():
                    stats_avg[header] = total / total_games
                
                return stats_avg
        
        return None
    
    except Exception as e:
        print(f"Error getting stats for player {player_id}: {str(e)}")
        if 'response' in locals():
            print(f"Status code: {response.status_code}")
            print(f"Response content: {response.text}")
        return None

def update_player_stats():
    # Load existing player data
    df = pd.read_csv('nba_players_final.csv')
    
    # Get all available stats for the first player to determine columns
    first_player_id = df.iloc[0]['Player ID']
    first_player_stats = get_player_stats(first_player_id)
    
    if first_player_stats:
        # Add new columns if they don't exist
        for column in first_player_stats.keys():
            if column not in df.columns:
                df[column] = 0.0
    
    # Update stats for each player
    for index, row in df.iterrows():
        player_id = row['Player ID']
        print(f"Updating stats for {row['Full Name']} (ID: {player_id})")
        
        player_stats = get_player_stats(player_id)
        if player_stats:
            for stat, value in player_stats.items():
                df.at[index, stat] = value
        
        # Add delay to avoid rate limiting
        time.sleep(2)  # Increased delay to 2 seconds
    
    # Save updated data
    df.to_csv('nba_players_final_updated.csv', index=False)
    print("Player stats have been updated successfully!")

if __name__ == "__main__":
    update_player_stats() 
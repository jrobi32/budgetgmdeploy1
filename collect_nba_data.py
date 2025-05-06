import requests
import pandas as pd
import numpy as np
from datetime import datetime
import time
import json

def get_player_stats(season):
    """Get player stats for a given season from NBA API"""
    url = f"https://stats.nba.com/stats/leaguedashplayerstats"
    headers = {
        'Host': 'stats.nba.com',
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-nba-stats-origin': 'stats',
        'x-nba-stats-token': 'true',
        'Connection': 'keep-alive',
        'Referer': 'https://www.nba.com/',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
    }
    
    params = {
        'LastNGames': 0,
        'LeagueID': '00',
        'MeasureType': 'Base',  # Changed to get more stats
        'Month': 0,
        'OpponentTeamID': 0,
        'PORound': 0,
        'PaceAdjust': 'N',
        'PerMode': 'PerGame',
        'Period': 0,
        'PlayerExperience': '',
        'PlayerPosition': '',
        'PlusMinus': 'Y',  # Enable plus/minus stats
        'Rank': 'N',
        'Season': season,
        'SeasonType': 'Regular Season',
        'StarterBench': 'Starters',
        'TeamID': 0,
        'TwoWay': 0,
        'VsConference': '',
        'VsDivision': ''
    }
    
    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    
    # Extract headers and rows
    headers = data['resultSets'][0]['headers']
    rows = data['resultSets'][0]['rowSet']
    
    # Create DataFrame
    df = pd.DataFrame(rows, columns=headers)
    
    # Select and rename columns
    df = df[[
        'PLAYER_ID', 'PLAYER_NAME', 'TEAM_ABBREVIATION', 'GP', 'MIN',
        'PTS', 'REB', 'AST', 'STL', 'BLK', 'TOV',  # Added turnovers
        'FG_PCT', 'FG3_PCT', 'FT_PCT',
        'PLUS_MINUS',  # Added plus/minus
        'E_OFF_RATING', 'E_DEF_RATING',  # Added offensive/defensive ratings
        'E_NET_RATING',  # Added net rating
        'USG_PCT',  # Added usage percentage
        'PIE'  # Added player impact estimate
    ]]
    
    # Rename columns to match our format
    df.columns = [
        'Player ID', 'Full Name', 'Team', 'Games Played (Avg)', 'Minutes Per Game (Avg)',
        'Points Per Game (Avg)', 'Rebounds Per Game (Avg)', 'Assists Per Game (Avg)',
        'Steals Per Game (Avg)', 'Blocks Per Game (Avg)', 'Turnovers Per Game (Avg)',
        'Field Goal % (Avg)', 'Three Point % (Avg)', 'Free Throw % (Avg)',
        'Plus Minus (Avg)', 'Offensive Rating (Avg)', 'Defensive Rating (Avg)',
        'Net Rating (Avg)', 'Usage % (Avg)', 'Player Impact Estimate (Avg)'
    ]
    
    return df

def get_team_stats(season):
    """Get team stats and win totals for a given season"""
    url = f"https://stats.nba.com/stats/leaguedashteamstats"
    headers = {
        'Host': 'stats.nba.com',
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-nba-stats-origin': 'stats',
        'x-nba-stats-token': 'true',
        'Connection': 'keep-alive',
        'Referer': 'https://www.nba.com/',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
    }
    
    params = {
        'LastNGames': 0,
        'LeagueID': '00',
        'MeasureType': 'Base',
        'Month': 0,
        'OpponentTeamID': 0,
        'PORound': 0,
        'PaceAdjust': 'N',
        'PerMode': 'PerGame',
        'Period': 0,
        'PlayerExperience': '',
        'PlayerPosition': '',
        'PlusMinus': 'N',
        'Rank': 'N',
        'Season': season,
        'SeasonType': 'Regular Season',
        'StarterBench': '',
        'TeamID': 0,
        'TwoWay': 0,
        'VsConference': '',
        'VsDivision': ''
    }
    
    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    
    headers = data['resultSets'][0]['headers']
    rows = data['resultSets'][0]['rowSet']
    
    df = pd.DataFrame(rows, columns=headers)
    return df

def get_starting_lineups(season):
    """Get starting lineups for each game in a season"""
    # This is a simplified version - in reality, you'd need to scrape this data
    # from basketball-reference.com or another source
    url = f"https://www.basketball-reference.com/leagues/NBA_{season.split('-')[0]}_games.html"
    # Add web scraping logic here
    pass

def collect_data(start_season=2015, end_season=2023):
    """Collect data for multiple seasons"""
    all_player_stats = []
    all_team_stats = []
    
    for year in range(start_season, end_season + 1):
        season = f"{year}-{str(year + 1)[-2:]}"
        print(f"Collecting data for season {season}...")
        
        # Get player stats (only starters)
        player_stats = get_player_stats(season)
        player_stats['SEASON'] = season
        all_player_stats.append(player_stats)
        
        # Get team stats
        team_stats = get_team_stats(season)
        team_stats['SEASON'] = season
        all_team_stats.append(team_stats)
        
        # Add delay to avoid rate limiting
        time.sleep(2)
    
    # Combine all data
    player_stats_df = pd.concat(all_player_stats, ignore_index=True)
    team_stats_df = pd.concat(all_team_stats, ignore_index=True)
    
    # Save to CSV
    player_stats_df.to_csv('nba_starting_lineup_stats.csv', index=False)
    team_stats_df.to_csv('nba_team_stats.csv', index=False)
    
    return player_stats_df, team_stats_df

if __name__ == "__main__":
    player_stats, team_stats = collect_data()
    print("Data collection complete!") 
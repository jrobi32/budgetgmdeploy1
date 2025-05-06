# NBA Player Stats Analyzer

This program fetches NBA player statistics from the NBA API and calculates player ratings based on their performance metrics.

## Features

- Fetches data for all NBA players
- Calculates a comprehensive rating (0-100) based on multiple statistics
- Saves player data to a CSV file
- Displays top 10 players by rating

## Installation

1. Make sure you have Python 3.7+ installed
2. Install the required packages:
```bash
pip install -r requirements.txt
```

## Usage

Run the program using:
```bash
python nba_player_stats.py
```

The program will:
1. Fetch all NBA players
2. Get their career statistics
3. Calculate ratings based on performance metrics
4. Save the data to a CSV file with timestamp
5. Display the top 10 players by rating

## Rating Calculation

The player rating (0-100) is calculated using the following weighted metrics:
- Points per game (25%)
- Rebounds per game (15%)
- Assists per game (15%)
- Steals per game (10%)
- Blocks per game (10%)
- Field Goal Percentage (10%)
- Free Throw Percentage (5%)
- Three Point Percentage (5%)
- Games Played (5%)

## Output

The program generates a CSV file named `nba_player_stats_YYYYMMDD_HHMMSS.csv` containing:
- Player ID
- Full Name
- First Name
- Last Name
- Rating
- Various statistics (points, rebounds, assists, etc.) 
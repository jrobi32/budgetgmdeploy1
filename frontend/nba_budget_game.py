import pandas as pd
import random
import numpy as np

class NBABudgetGame:
    def __init__(self):
        # Load and clean the player data
        self.players_df = pd.read_csv('nba_players_final.csv')
        
        # Clean the data
        columns_to_keep = [
            'Player ID', 'Full Name', 'First Name', 'Last Name', 'Position',
            'Games Played (Avg)', 'Minutes Per Game (Avg)',
            'Points Per Game (Avg)', 'Rebounds Per Game (Avg)',
            'Assists Per Game (Avg)', 'Steals Per Game (Avg)', 'Blocks Per Game (Avg)',
            'Turnovers Per Game (Avg)',
            'Field Goal % (Avg)', 'Free Throw % (Avg)', 'Three Point % (Avg)',
            'Plus Minus (Avg)',
            'Offensive Rating (Avg)', 'Defensive Rating (Avg)',
            'Net Rating (Avg)',
            'Usage % (Avg)',
            'Player Impact Estimate (Avg)',
            'Rating', 'Dollar Value'
        ]
        
        self.players_df = self.players_df[columns_to_keep].drop_duplicates()
        self.players_df = self.players_df.dropna(subset=['Player ID', 'Full Name', 'Rating', 'Dollar Value'])
        
        self.selected_players = []
        self.budget = 15
        self.remaining_budget = 15
        self.available_players = None

    def generate_player_pool(self):
        # Group players by dollar value
        value_groups = self.players_df.groupby('Dollar Value')
        
        # Select 5 random players from each dollar value group
        player_pool = []
        for value in range(1, 6):  # Dollar values 1-5
            try:
                group = value_groups.get_group(value)
                selected = group.sample(n=min(5, len(group)))
                player_pool.append(selected)
            except KeyError:
                # Skip if no players with this dollar value
                continue
        
        if not player_pool:
            raise ValueError("No players available in the database")
            
        self.available_players = pd.concat(player_pool)
        return self.available_players

    def find_player_by_name(self, name):
        # Search by full name, first name, or last name in available players only
        name = name.lower()
        matches = self.available_players[
            (self.available_players['Full Name'].str.lower().str.contains(name)) |
            (self.available_players['First Name'].str.lower().str.contains(name)) |
            (self.available_players['Last Name'].str.lower().str.contains(name))
        ]
        return matches

    def select_player(self, player_name):
        if len(self.selected_players) >= 5:
            return False, "Team is already full (5 players maximum)"
        
        # Find the player by name
        matches = self.find_player_by_name(player_name)
        
        if len(matches) == 0:
            return False, "No player found with that name"
        elif len(matches) > 1:
            return False, f"Multiple players found. Please be more specific:\n" + \
                   "\n".join([f"{row['Full Name']} (${row['Dollar Value']})" for _, row in matches.iterrows()])
        
        player = matches.iloc[0]
        cost = player['Dollar Value']
        
        if cost > self.remaining_budget:
            return False, f"Not enough budget (need ${cost}, have ${self.remaining_budget})"
        
        self.selected_players.append(player)
        self.remaining_budget -= cost
        # Remove selected player from available players
        self.available_players = self.available_players[self.available_players['Player ID'] != player['Player ID']]
        return True, f"Successfully added {player['Full Name']} (${cost})"

    def simulate_season(self):
        if len(self.selected_players) != 5:
            return None, "Need exactly 5 players to simulate a season"
        
        # Calculate team metrics
        avg_rating = np.mean([p['Rating'] for p in self.selected_players])
        total_points = sum(p['Points Per Game (Avg)'] for p in self.selected_players)
        total_rebounds = sum(p['Rebounds Per Game (Avg)'] for p in self.selected_players)
        total_assists = sum(p['Assists Per Game (Avg)'] for p in self.selected_players)
        total_steals = sum(p['Steals Per Game (Avg)'] for p in self.selected_players)
        total_blocks = sum(p['Blocks Per Game (Avg)'] for p in self.selected_players)
        avg_fg_pct = np.mean([p['Field Goal % (Avg)'] for p in self.selected_players])
        avg_ft_pct = np.mean([p['Free Throw % (Avg)'] for p in self.selected_players])
        avg_3p_pct = np.mean([p['Three Point % (Avg)'] for p in self.selected_players])
        
        # Calculate expected wins based on team metrics
        # Base formula: 41 wins (average) + contributions from each metric
        expected_wins = 41 + (
            (avg_rating - 50) * 0.4 +  # Rating contribution
            (total_points - 100) * 0.1 +  # Scoring contribution
            (total_rebounds - 40) * 0.05 +  # Rebounding contribution
            (total_assists - 20) * 0.05 +  # Playmaking contribution
            (total_steals + total_blocks - 5) * 0.05 +  # Defense contribution
            (avg_fg_pct - 0.45) * 100 +  # Efficiency contribution
            (avg_ft_pct - 0.75) * 50 +  # Free throw contribution
            (avg_3p_pct - 0.35) * 50  # Three-point contribution
        )
        
        # Add some randomness to simulate real NBA variance
        expected_wins += np.random.normal(0, 5)
        
        # Clip to valid range (0-82 wins)
        expected_wins = np.clip(expected_wins, 0, 82)
        
        return int(round(expected_wins)), "Season simulated successfully"

    def get_team_summary(self, show_stats=False):
        summary = []
        summary.append("\nYour Team:")
        summary.append("-" * 50)
        total_ppg = 0
        total_rpg = 0
        total_apg = 0
        for player in self.selected_players:
            summary.append(f"{player['Full Name']} (${player['Dollar Value']})")
            total_ppg += player['Points Per Game (Avg)']
            total_rpg += player['Rebounds Per Game (Avg)']
            total_apg += player['Assists Per Game (Avg)']
        summary.append("-" * 50)
        if show_stats:
            summary.append(f"Team Stats: {total_ppg:.1f} PPG, {total_rpg:.1f} RPG, {total_apg:.1f} APG")
        summary.append(f"Remaining Budget: ${self.remaining_budget}")
        return "\n".join(summary)

def main():
    game = NBABudgetGame()
    player_pool = game.generate_player_pool()
    
    print("Welcome to the NBA Budget Game!")
    print("Build your team with a $15 budget. Select 5 players.")
    print("\nAvailable Players:")
    print("-" * 80)
    
    # Display available players grouped by dollar value
    for value in range(5, 0, -1):
        value_players = player_pool[player_pool['Dollar Value'] == value]
        print(f"\n${value} Players:")
        for _, player in value_players.iterrows():
            print(f"{player['Full Name']}")
    
    # Main game loop
    while len(game.selected_players) < 5:
        print("\n" + game.get_team_summary(show_stats=False))
        player_name = input(f"\nEnter player name to add to your team (${game.remaining_budget} remaining): ")
        
        success, message = game.select_player(player_name)
        print(message)
        
        if success:
            print("\nRemaining Players:")
            for value in range(5, 0, -1):
                value_players = game.available_players[game.available_players['Dollar Value'] == value]
                if not value_players.empty:
                    print(f"\n${value} Players:")
                    for _, player in value_players.iterrows():
                        print(f"{player['Full Name']}")
    
    # Simulate season
    wins, message = game.simulate_season()
    print("\nFinal Team:")
    print(game.get_team_summary(show_stats=True))
    print(f"\nSimulated Season Results: {wins} wins")
    
    # Display detailed player stats after simulation
    print("\nPlayer Statistics:")
    print("-" * 50)
    for player in game.selected_players:
        print(f"{player['Full Name']} (${player['Dollar Value']})")
        print(f"  {player['Points Per Game (Avg)']:.1f} PPG, {player['Rebounds Per Game (Avg)']:.1f} RPG, {player['Assists Per Game (Avg)']:.1f} APG")
    
    # Provide season analysis
    if wins >= 60:
        print("\nChampionship contender! Your team dominated the regular season!")
    elif wins >= 50:
        print("\nExcellent team! Definitely a playoff contender with home court advantage.")
    elif wins >= 45:
        print("\nSolid playoff team with potential to make a deep run.")
    elif wins >= 41:
        print("\nYour team finished above .500, fighting for a playoff spot.")
    elif wins >= 35:
        print("\nIn the hunt for the play-in tournament.")
    else:
        print("\nRebuilding year. Time to rethink the roster construction.")

if __name__ == "__main__":
    main() 
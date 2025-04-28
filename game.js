class NBABudgetGame {
    constructor() {
        this.budget = 15;
        this.remainingBudget = 15;
        this.selectedPlayers = [];
        this.availablePlayers = [];
        this.displayedPlayers = []; // Keep track of displayed players
        this.playersGrid = document.querySelector('.players-grid');
        this.teamDisplay = document.querySelector('.team-display');
        this.budgetDisplay = document.getElementById('remaining-budget');
        this.simulateButton = document.getElementById('simulate-button');
        this.resultsSection = document.querySelector('.results-section');
        
        this.loadPlayers();
        this.setupEventListeners();
    }

    async loadPlayers() {
        try {
            const response = await fetch('nba_players_final_updated.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            const players = this.parseCSV(csvText);
            console.log('Loaded players:', players.length);
            this.availablePlayers = players;
            this.initializeDisplayedPlayers();
            this.displayPlayers();
        } catch (error) {
            console.error('Error loading players:', error);
            this.playersGrid.innerHTML = `<div class="error">Error loading players: ${error.message}</div>`;
        }
    }

    initializeDisplayedPlayers() {
        this.displayedPlayers = [];
        const playersByValue = this.groupPlayersByValue();
        
        for (let value = 5; value >= 1; value--) {
            const valuePlayers = playersByValue[value] || [];
            const selectedPlayers = this.getRandomPlayers(valuePlayers, 5);
            this.displayedPlayers.push(...selectedPlayers);
        }
    }

    displayPlayers() {
        this.playersGrid.innerHTML = '';
        const playersByValue = this.groupDisplayedPlayersByValue();
        
        for (let value = 5; value >= 1; value--) {
            const valuePlayers = playersByValue[value] || [];
            const valueSection = document.createElement('div');
            valueSection.className = 'value-section';
            valueSection.innerHTML = `<h3>$${value} Players</h3>`;
            
            const playersContainer = document.createElement('div');
            playersContainer.className = 'players-container';
            
            valuePlayers.forEach(player => {
                const playerCard = document.createElement('div');
                playerCard.className = 'player-card';
                const isSelected = this.selectedPlayers.some(p => p['Player ID'] === player['Player ID']);
                
                // Use a more reliable image source
                const imageUrl = `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player['Player ID']}.png`;
                
                if (isSelected) {
                    playerCard.classList.add('selected');
                } else {
                    playerCard.addEventListener('click', () => this.selectPlayer(player));
                }
                
                playerCard.innerHTML = `
                    <img src="${imageUrl}" alt="${player['Full Name']}" onerror="this.src='https://cdn.nba.com/headshots/nba/latest/1040x760/fallback.png'">
                    <h3>${player['Full Name']}</h3>
                    <div class="price">$${player['Dollar Value']}</div>
                `;
                playerCard.dataset.playerId = player['Player ID'];
                playerCard.dataset.value = player['Dollar Value'];
                playersContainer.appendChild(playerCard);
            });
            
            valueSection.appendChild(playersContainer);
            this.playersGrid.appendChild(valueSection);
        }
    }

    groupDisplayedPlayersByValue() {
        const groups = {};
        this.displayedPlayers.forEach(player => {
            const value = parseInt(player['Dollar Value']);
            if (!groups[value]) groups[value] = [];
            groups[value].push(player);
        });
        return groups;
    }

    updateDisplay() {
        // Update budget display
        this.budgetDisplay.textContent = this.remainingBudget;

        // Update team display
        this.teamDisplay.innerHTML = '';
        this.selectedPlayers.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'team-player';
            const imageUrl = `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player['Player ID']}.png`;
            playerElement.innerHTML = `
                <img src="${imageUrl}" alt="${player['Full Name']}" onerror="this.src='https://cdn.nba.com/headshots/nba/latest/1040x760/fallback.png'">
                <span>${player['Full Name']} ($${player['Dollar Value']})</span>
                <button onclick="game.removePlayer(${JSON.stringify(player).replace(/"/g, '&quot;')})">×</button>
            `;
            this.teamDisplay.appendChild(playerElement);
        });

        // Show/hide simulate button
        this.simulateButton.style.display = this.selectedPlayers.length === 5 ? 'block' : 'none';
        
        // Update the display without re-randomizing
        this.displayPlayers();
    }

    removePlayer(player) {
        const index = this.selectedPlayers.findIndex(p => p['Player ID'] === player['Player ID']);
        if (index !== -1) {
            this.remainingBudget += parseInt(player['Dollar Value']);
            this.selectedPlayers.splice(index, 1);
            this.updateDisplay();
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file is empty or invalid');
        }
        
        const headers = lines[0].split(',').map(header => header.trim());
        console.log('CSV Headers:', headers); // Debug log
        
        return lines.slice(1).map(line => {
            const values = line.split(',').map(value => value.trim());
            if (values.length !== headers.length) {
                console.warn('Mismatched columns in line:', line);
                return null;
            }
            return headers.reduce((obj, header, index) => {
                // Convert numeric fields to numbers
                if (header.includes('(Avg)') || header === 'Rating' || header === 'Dollar Value') {
                    const numValue = parseFloat(values[index]);
                    obj[header] = isNaN(numValue) ? 0 : numValue;
                } else {
                    obj[header] = values[index];
                }
                return obj;
            }, {});
        }).filter(player => player !== null);
    }

    getRandomPlayers(players, count) {
        // Create a copy of the array to avoid modifying the original
        const shuffled = [...players];
        // Fisher-Yates shuffle algorithm
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // Return the first 'count' players
        return shuffled.slice(0, count);
    }

    groupPlayersByValue() {
        const groups = {};
        this.availablePlayers.forEach(player => {
            const value = parseInt(player['Dollar Value']);
            if (!groups[value]) groups[value] = [];
            groups[value].push(player);
        });
        console.log('Grouped players:', groups); // Debug log
        return groups;
    }

    selectPlayer(player) {
        // Check if player is already selected
        if (this.selectedPlayers.some(p => p['Player ID'] === player['Player ID'])) {
            alert('This player is already on your team!');
            return;
        }

        if (this.selectedPlayers.length >= 5) {
            alert('Your team is already full (5 players maximum)');
            return;
        }

        const cost = parseInt(player['Dollar Value']);
        if (cost > this.remainingBudget) {
            alert(`Not enough budget (need $${cost}, have $${this.remainingBudget})`);
            return;
        }

        this.selectedPlayers.push(player);
        this.remainingBudget -= cost;
        this.updateDisplay();
    }

    async simulateSeason() {
        try {
            let points = 0;
            let rebounds = 0;
            let assists = 0;
            let steals = 0;
            let blocks = 0;
            let fgPercentages = [];  // Array to store FG percentages
            let ftPercentages = [];  // Array to store FT percentages
            let threePointPercentages = [];  // Array to store 3PT percentages

            // Calculate team totals
            this.selectedPlayers.forEach(player => {
                points += parseFloat(player['Points Per Game (Avg)']);
                rebounds += parseFloat(player['Rebounds Per Game (Avg)']);
                assists += parseFloat(player['Assists Per Game (Avg)']);
                steals += parseFloat(player['Steals Per Game (Avg)']);
                blocks += parseFloat(player['Blocks Per Game (Avg)']);
                
                // Store percentages in arrays
                fgPercentages.push(parseFloat(player['Field Goal % (Avg)']));
                ftPercentages.push(parseFloat(player['Free Throw % (Avg)']));
                threePointPercentages.push(parseFloat(player['Three Point % (Avg)']));
            });

            // Calculate average percentages
            const fgPercentage = fgPercentages.reduce((a, b) => a + b, 0) / fgPercentages.length;
            const ftPercentage = ftPercentages.reduce((a, b) => a + b, 0) / ftPercentages.length;
            const threePointPercentage = threePointPercentages.reduce((a, b) => a + b, 0) / threePointPercentages.length;

            // Log team statistics for debugging
            console.log('Team Statistics:', {
                points, rebounds, assists, steals, blocks,
                fgPercentage, ftPercentage, threePointPercentage
            });

            // Calculate predicted wins using trained model coefficients
            let predictedWins = -371.2357 +  // Intercept
                (points * -0.5129) +
                (rebounds * 3.6424) +
                (assists * -1.8054) +
                (steals * 5.7423) +
                (blocks * 1.2707) +
                (fgPercentage * 408.3473) +
                (ftPercentage * 70.4720) +
                (threePointPercentage * 252.3153);

            // Scale up prediction since bench players contribute some wins
            predictedWins = predictedWins * 1.3;  // Assume starters account for about 70% of wins

            // Ensure prediction stays within reasonable bounds
            predictedWins = Math.max(20, Math.min(62, Math.round(predictedWins)));

            console.log('Predicted Wins:', predictedWins);

            // Format data for display
            const results = {
                wins: predictedWins,
                total_ppg: points.toFixed(1),
                total_rpg: rebounds.toFixed(1),
                total_apg: assists.toFixed(1),
                outcome: this.getSeasonOutcome(predictedWins)
            };

            // Display the results
            this.displayResults(results);

        } catch (error) {
            console.error('Error in season simulation:', error);
            // Display default results if simulation fails
            this.displayResults({
                wins: 41,
                total_ppg: '100.0',
                total_rpg: '40.0',
                total_apg: '20.0',
                outcome: this.getSeasonOutcome(41)
            });
        }
    }

    displayResults(data) {
        // Create results div if it doesn't exist
        let resultsDiv = document.getElementById('results');
        if (!resultsDiv) {
            resultsDiv = document.createElement('div');
            resultsDiv.id = 'results';
            document.body.appendChild(resultsDiv);
        }

        try {
            resultsDiv.innerHTML = `
                <div class="results-container">
                    <h2>SEASON RESULTS</h2>
                    <p>Projected Wins: ${data.wins}</p>
                    <p>Team Stats:</p>
                    <ul>
                        <li>Points Per Game: ${data.total_ppg}</li>
                        <li>Rebounds Per Game: ${data.total_rpg}</li>
                        <li>Assists Per Game: ${data.total_apg}</li>
                    </ul>
                    <p>Season Outlook: ${data.outcome}</p>
                    <button onclick="game.closeResults()" class="close-button">Close</button>
                </div>
            `;
            resultsDiv.style.display = 'block';
            resultsDiv.classList.add('active');
        } catch (error) {
            console.error('Error displaying results:', error);
            alert('Error displaying results. Please try again.');
        }
    }

    closeResults() {
        const resultsDiv = document.getElementById('results');
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
            resultsDiv.classList.remove('active');
        }
    }

    getSeasonOutcome(wins) {
        if (wins >= 55) return "Championship Contender";
        if (wins >= 45) return "Playoff Contender";
        if (wins >= 35) return "Playoff Bubble Team";
        return "Rebuilding Year";
    }

    setupEventListeners() {
        this.simulateButton.addEventListener('click', () => this.simulateSeason());
    }
}

// Initialize the game
const game = new NBABudgetGame(); 
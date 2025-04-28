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
            console.log('Attempting to load players from CSV...');
            const response = await fetch('/nba_players_final_updated.csv');
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            console.log('CSV text length:', csvText.length);
            const players = this.parseCSV(csvText);
            console.log('Successfully loaded players:', players.length);
            this.availablePlayers = players;
            this.initializeDisplayedPlayers();
            this.displayPlayers();
        } catch (error) {
            console.error('Error loading players:', error);
            this.playersGrid.innerHTML = `
                <div class="error">
                    Error loading players: ${error.message}
                    <br>
                    Please check the console for more details.
                </div>
            `;
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
            // Prepare team data
            const teamData = this.selectedPlayers.map(player => ({
                'Points Per Game (Avg)': player['Points Per Game (Avg)'],
                'Rebounds Per Game (Avg)': player['Rebounds Per Game (Avg)'],
                'Assists Per Game (Avg)': player['Assists Per Game (Avg)'],
                'Steals Per Game (Avg)': player['Steals Per Game (Avg)'],
                'Blocks Per Game (Avg)': player['Blocks Per Game (Avg)'],
                'Field Goal % (Avg)': player['Field Goal % (Avg)'],
                'Free Throw % (Avg)': player['Free Throw % (Avg)'],
                'Three Point % (Avg)': player['Three Point % (Avg)']
            }));

            // Call the backend API
            const response = await fetch('https://budgetgm-backend.onrender.com/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(teamData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const predictedWins = data.predicted_wins;

            // Display results
            this.displayResults({
                wins: predictedWins,
                players: this.selectedPlayers
            });

        } catch (error) {
            console.error('Error simulating season:', error);
            this.resultsSection.innerHTML = `
                <div class="error">
                    Error simulating season: ${error.message}
                </div>
            `;
        }
    }

    displayResults(data) {
        // Calculate team totals
        let points = 0;
        let rebounds = 0;
        let assists = 0;
        let steals = 0;
        let blocks = 0;
        let fgPercentages = [];
        let ftPercentages = [];
        let threePointPercentages = [];

        data.players.forEach(player => {
            points += parseFloat(player['Points Per Game (Avg)']);
            rebounds += parseFloat(player['Rebounds Per Game (Avg)']);
            assists += parseFloat(player['Assists Per Game (Avg)']);
            steals += parseFloat(player['Steals Per Game (Avg)']);
            blocks += parseFloat(player['Blocks Per Game (Avg)']);
            
            fgPercentages.push(parseFloat(player['Field Goal % (Avg)']));
            ftPercentages.push(parseFloat(player['Free Throw % (Avg)']));
            threePointPercentages.push(parseFloat(player['Three Point % (Avg)']));
        });

        // Calculate averages
        const avgFG = (fgPercentages.reduce((a, b) => a + b, 0) / fgPercentages.length).toFixed(1);
        const avgFT = (ftPercentages.reduce((a, b) => a + b, 0) / ftPercentages.length).toFixed(1);
        const avg3PT = (threePointPercentages.reduce((a, b) => a + b, 0) / threePointPercentages.length).toFixed(1);

        this.resultsSection.innerHTML = `
            <div class="results-container">
                <h2>Season Prediction Results</h2>
                <div class="prediction-card">
                    <h3>Predicted Wins: ${data.wins}</h3>
                    <p class="outcome">${this.getSeasonOutcome(data.wins)}</p>
                </div>
                <div class="team-stats">
                    <h3>Team Statistics</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Points Per Game:</span>
                            <span class="stat-value">${points.toFixed(1)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Rebounds Per Game:</span>
                            <span class="stat-value">${rebounds.toFixed(1)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Assists Per Game:</span>
                            <span class="stat-value">${assists.toFixed(1)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Steals Per Game:</span>
                            <span class="stat-value">${steals.toFixed(1)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Blocks Per Game:</span>
                            <span class="stat-value">${blocks.toFixed(1)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Field Goal %:</span>
                            <span class="stat-value">${avgFG}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Free Throw %:</span>
                            <span class="stat-value">${avgFT}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Three Point %:</span>
                            <span class="stat-value">${avg3PT}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
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

function calculateExpectedWins(selectedPlayers) {
    try {
        // Calculate team statistics
        const teamStats = {
            points: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Points Per Game (Avg)']), 0),
            rebounds: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Rebounds Per Game (Avg)']), 0),
            assists: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Assists Per Game (Avg)']), 0),
            steals: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Steals Per Game (Avg)']), 0),
            blocks: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Blocks Per Game (Avg)']), 0),
            turnovers: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Turnovers Per Game (Avg)']), 0),
            fg_pct: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Field Goal % (Avg)']), 0) / selectedPlayers.length,
            ft_pct: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Free Throw % (Avg)']), 0) / selectedPlayers.length,
            three_pct: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Three Point % (Avg)']), 0) / selectedPlayers.length,
            plus_minus: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Plus Minus (Avg)']), 0) / selectedPlayers.length,
            off_rating: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Offensive Rating (Avg)']), 0) / selectedPlayers.length,
            def_rating: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Defensive Rating (Avg)']), 0) / selectedPlayers.length,
            net_rating: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Net Rating (Avg)']), 0) / selectedPlayers.length,
            usage: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Usage % (Avg)']), 0) / selectedPlayers.length,
            pie: selectedPlayers.reduce((sum, p) => 
                sum + parseFloat(p['Player Impact Estimate (Avg)']), 0) / selectedPlayers.length
        };

        // Calculate predicted wins using the trained model coefficients
        let predictedWins = 41 +  // Base of 41 wins (league average)
            (teamStats.points * 0.5) +  // Points have moderate impact
            (teamStats.rebounds * 0.2) +  // Rebounds have lower impact
            (teamStats.assists * 0.3) +  // Assists have moderate impact
            (teamStats.steals * 0.4) +  // Steals have moderate impact
            (teamStats.blocks * 0.4) +  // Blocks have moderate impact
            (teamStats.fg_pct * 300) +  // FG% has highest impact
            (teamStats.ft_pct * 40) +  // FT% has moderate impact
            (teamStats.three_pct * 80);  // 3P% has moderate impact

        // Scale up the prediction since bench players will contribute some wins
        predictedWins = predictedWins * 1.3;  // Assume starters account for about 70% of wins
        
        // Ensure prediction stays within reasonable bounds and round to nearest integer
        return Math.round(Math.max(4, Math.min(74, predictedWins)));
    } catch (error) {
        console.error('Error in win calculation:', error);
        console.log('Player data:', selectedPlayers); // Debug log
        return 41; // Return league average if calculation fails
    }
}

// Initialize the game
const game = new NBABudgetGame(); 
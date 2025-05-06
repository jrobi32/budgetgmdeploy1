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
        
        // Add nickname elements
        this.nicknameInput = document.getElementById('nickname-input');
        this.saveNicknameBtn = document.getElementById('save-nickname');
        
        // Load nickname from localStorage
        this.nickname = localStorage.getItem('budgetgm_nickname');
        if (this.nickname) {
            this.nicknameInput.value = this.nickname;
            this.nicknameInput.disabled = true;
            this.saveNicknameBtn.disabled = true;
        }

        // Load selected team from localStorage
        const savedTeam = localStorage.getItem('budgetgm_selected_team');
        if (savedTeam) {
            this.selectedPlayers = JSON.parse(savedTeam);
            // Calculate remaining budget
            this.remainingBudget = this.budget - this.selectedPlayers.reduce((sum, player) => 
                sum + parseInt(player['Dollar Value']), 0);
        }

        // Check if user has already submitted today
        this.checkDailySubmission();
        
        // Add event listener for nickname save
        this.saveNicknameBtn.addEventListener('click', () => this.saveNickname());
        
        // Add event listeners for How to Play and How It Works buttons
        this.howToPlayBtn = document.getElementById('how-to-play-btn');
        this.howToPlayContent = document.getElementById('how-to-play-content');
        this.howItWorksBtn = document.getElementById('how-it-works-btn');
        this.howItWorksContent = document.getElementById('how-it-works-content');
        this.quickTipsBtn = document.getElementById('quick-tips-btn');
        this.quickTipsContent = document.getElementById('quick-tips-content');
        
        this.howToPlayBtn.addEventListener('click', () => {
            this.howToPlayContent.style.display = this.howToPlayContent.style.display === 'block' ? 'none' : 'block';
            this.howItWorksContent.style.display = 'none';
            this.quickTipsContent.style.display = 'none';
        });

        this.howItWorksBtn.addEventListener('click', () => {
            this.howItWorksContent.style.display = this.howItWorksContent.style.display === 'block' ? 'none' : 'block';
            this.howToPlayContent.style.display = 'none';
            this.quickTipsContent.style.display = 'none';
        });

        this.quickTipsBtn.addEventListener('click', () => {
            this.quickTipsContent.style.display = this.quickTipsContent.style.display === 'block' ? 'none' : 'block';
            this.howToPlayContent.style.display = 'none';
            this.howItWorksContent.style.display = 'none';
        });
        
        this.loadPlayers();
        this.setupEventListeners();
    }

    checkDailySubmission() {
        const lastSubmission = localStorage.getItem('budgetgm_last_submission');
        const today = new Date().toDateString();
        
        if (lastSubmission === today) {
            this.simulateButton.textContent = 'View Results';
            this.simulateButton.classList.add('active');
        }
    }

    async loadPlayers() {
        try {
            console.log('Fetching players from backend...');
            // Fetch the daily player pool from the backend
            const response = await fetch('https://budgetbackenddeploy1.onrender.com/api/players', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                credentials: 'same-origin'
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            const players = await response.json();
            console.log('Received players:', players);
            
            if (!Array.isArray(players) || players.length === 0) {
                throw new Error('No players received from server');
            }
            
            // Group players by dollar value
            const playersByDollar = {};
            players.forEach(player => {
                const dollarValue = player['Dollar Value'];
                if (!playersByDollar[dollarValue]) {
                    playersByDollar[dollarValue] = [];
                }
                playersByDollar[dollarValue].push(player);
            });
            
            // Update the game state
            this.playersByDollar = playersByDollar;
            this.availablePlayers = players;
            
            // Update the UI
            this.initializeDisplayedPlayers();
            this.displayPlayers();
            
            // If we have a saved team, update the display
            if (this.selectedPlayers.length > 0) {
                this.updateDisplay();
            }
        } catch (error) {
            console.error('Error loading players:', error);
            this.playersGrid.innerHTML = `<div class="error">Error loading players: ${error.message}. Please try again later.</div>`;
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
            playersContainer.style.display = 'flex';
            playersContainer.style.flexWrap = 'nowrap';
            playersContainer.style.overflowX = 'auto';
            playersContainer.style.gap = '20px';
            playersContainer.style.padding = '10px';
            
            valuePlayers.forEach(player => {
                const playerCard = document.createElement('div');
                playerCard.className = 'player-card';
                const isSelected = this.selectedPlayers.some(p => p['Player ID'] === player['Player ID']);
                
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

        // Update simulate button state
        if (this.selectedPlayers.length === 5) {
            this.simulateButton.classList.add('active');
        } else {
            this.simulateButton.classList.remove('active');
        }
        
        // Update the display without re-randomizing
        this.displayPlayers();
    }

    removePlayer(player) {
        // Check if user has already submitted today
        const lastSubmission = localStorage.getItem('budgetgm_last_submission');
        const today = new Date().toDateString();
        if (lastSubmission === today) {
            alert('You have already submitted your team for today. Come back tomorrow!');
            return;
        }

        const index = this.selectedPlayers.findIndex(p => p['Player ID'] === player['Player ID']);
        if (index !== -1) {
            this.remainingBudget += parseInt(player['Dollar Value']);
            this.selectedPlayers.splice(index, 1);
            // Update localStorage after removing player
            localStorage.setItem('budgetgm_selected_team', JSON.stringify(this.selectedPlayers));
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
        // Check if user has already submitted today
        const lastSubmission = localStorage.getItem('budgetgm_last_submission');
        const today = new Date().toDateString();
        if (lastSubmission === today) {
            alert('You have already submitted your team for today. Come back tomorrow!');
            return;
        }

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
        // Save selected team to localStorage
        localStorage.setItem('budgetgm_selected_team', JSON.stringify(this.selectedPlayers));
        this.updateDisplay();
    }

    async simulateSeason() {
        try {
            // Check if nickname is set
            if (!this.nickname) {
                alert("Don't forget to enter a nickname first!");
                return;
            }

            if (this.selectedPlayers.length !== 5) {
                alert("Please select exactly 5 players!");
                return;
            }

            // Calculate team stats
            let points = 0, rebounds = 0, assists = 0, steals = 0, blocks = 0;
            this.selectedPlayers.forEach(player => {
                points += parseFloat(player['Points Per Game (Avg)'] || 0);
                rebounds += parseFloat(player['Rebounds Per Game (Avg)'] || 0);
                assists += parseFloat(player['Assists Per Game (Avg)'] || 0);
                steals += parseFloat(player['Steals Per Game (Avg)'] || 0);
                blocks += parseFloat(player['Blocks Per Game (Avg)'] || 0);
            });

            // Calculate predicted wins
            let predictedWins = 0 +
                (points * 0.45) +
                (rebounds * 0.15) +
                (assists * 0.18) +
                (steals * 0.11) +
                (blocks * 0.09);

            // Scale up the prediction
            predictedWins = predictedWins * 1.2;
            
            // Ensure prediction stays within reasonable bounds
            predictedWins = Math.round(Math.max(8, Math.min(74, predictedWins)));

            const results = {
                wins: predictedWins,
                total_ppg: points.toFixed(1),
                total_rpg: rebounds.toFixed(1),
                total_apg: assists.toFixed(1),
                total_spg: steals.toFixed(1),
                total_bpg: blocks.toFixed(1),
                outcome: this.getSeasonOutcome(predictedWins)
            };

            // Save submission date and results
            const today = new Date().toDateString();
            localStorage.setItem('budgetgm_last_submission', today);

            // Store the submission
            const submission = {
                date: today,
                nickname: this.nickname,
                players: this.selectedPlayers.map(p => ({
                    id: p['Player ID'],
                    name: p['Full Name'],
                    value: p['Dollar Value']
                })),
                results: results
            };

            // Get existing submissions or initialize empty array
            const submissions = JSON.parse(localStorage.getItem('budgetgm_submissions') || '[]');
            submissions.push(submission);
            localStorage.setItem('budgetgm_submissions', JSON.stringify(submissions));

            // Fetch leaderboard data
            try {
                const response = await fetch('https://budgetbackenddeploy1.onrender.com/api/leaderboard', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const leaderboardData = await response.json();
                const todaySubmissions = leaderboardData.submissions || [];
                
                // Find user's rank
                const userRank = todaySubmissions.findIndex(sub => sub.nickname === this.nickname) + 1;
                const totalUsers = todaySubmissions.length;
                
                // Calculate percentile
                const percentile = totalUsers > 1 ? 
                    Math.round(((totalUsers - userRank + 1) / totalUsers) * 100) : 100;

                // Add ranking info to results
                results.ranking = {
                    rank: userRank,
                    total: totalUsers,
                    percentile: percentile
                };
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
                // Continue without ranking info
            }

            // Display the results
            this.displayResults(results);

            // Update the submit button
            this.simulateButton.disabled = false;
            this.simulateButton.textContent = 'View Results';
            this.simulateButton.classList.add('active');

            // Disable player selection
            this.playersGrid.querySelectorAll('.player-card').forEach(card => {
                card.style.pointerEvents = 'none';
                card.style.opacity = '0.7';
            });

        } catch (error) {
            console.error('Error in season simulation:', error);
            alert('Error simulating season. Please try again.');
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

        // Create overlay if it doesn't exist
        let overlay = document.getElementById('results-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'results-overlay';
            document.body.appendChild(overlay);
        }

        try {
            // Create ranking message if available
            let rankingMessage = '';
            if (data.ranking) {
                const { rank, total, percentile } = data.ranking;
                rankingMessage = `
                    <div class="ranking-info">
                        <h3>Your Ranking</h3>
                        <p>Great job! Your team was in the ${percentile}th percentile, ranking #${rank} out of ${total} users!</p>
                    </div>
                `;
            }

            resultsDiv.innerHTML = `
                <div class="results-container">
                    <h2>SEASON RESULTS</h2>
                    <div class="results-content">
                        <div class="predicted-wins">
                            <h3>Predicted Wins: ${data.wins}</h3>
                            <p>Season Outlook: ${data.outcome}</p>
                        </div>
                        ${rankingMessage}
                        <div class="team-stats">
                            <h3>Team Statistics</h3>
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <span class="stat-label">Points Per Game:</span>
                                    <span class="stat-value">${data.total_ppg}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Rebounds Per Game:</span>
                                    <span class="stat-value">${data.total_rpg}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Assists Per Game:</span>
                                    <span class="stat-value">${data.total_apg}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Steals Per Game:</span>
                                    <span class="stat-value">${data.total_spg}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Blocks Per Game:</span>
                                    <span class="stat-value">${data.total_bpg}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onclick="game.closeResults()" class="close-button">Close</button>
                </div>
            `;
            
            resultsDiv.classList.add('active');
            overlay.classList.add('active');
        } catch (error) {
            console.error('Error displaying results:', error);
            alert('Error displaying results. Please try again.');
        }
    }

    closeResults() {
        const resultsDiv = document.getElementById('results');
        const overlay = document.getElementById('results-overlay');
        if (resultsDiv) {
            resultsDiv.classList.remove('active');
        }
        if (overlay) {
            overlay.classList.remove('active');
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

    saveNickname() {
        const nickname = this.nicknameInput.value.trim();
        if (nickname) {
            this.nickname = nickname;
            localStorage.setItem('budgetgm_nickname', nickname);
            this.nicknameInput.disabled = true;
            this.saveNicknameBtn.disabled = true;
        }
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

        // Calculate predicted wins using the specified coefficients divided by 1.5
        let predictedWins = 0 +  // Base value changed to 0 wins
            (teamStats.points * 0.45) +  // Points coefficient
            (teamStats.rebounds * 0.15) +  // Rebounds coefficient
            (teamStats.assists * 0.18) +  // Assists coefficient
            (teamStats.steals * 0.11) +  // Steals coefficient
            (teamStats.blocks * 0.09) +  // Blocks coefficient
            (teamStats.fg_pct * 0.23) +  // FG% coefficient
            (teamStats.ft_pct * 0.12) +  // FT% coefficient
            (teamStats.three_pct * 0.13);  // 3P% coefficient

        // Scale up the prediction since bench players will contribute some wins
        predictedWins = predictedWins * 1.2;  // Keep the same scaling factor
        
        // Ensure prediction stays within reasonable bounds and round to nearest integer
        return Math.round(Math.max(8, Math.min(74, predictedWins)));
    } catch (error) {
        console.error('Error in win calculation:', error);
        console.log('Player data:', selectedPlayers); // Debug log
        return 41; // Return league average if calculation fails
    }
}

// Initialize the game
const game = new NBABudgetGame(); 
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
        if (!this.nickname) {
            alert('Please enter a nickname first!');
            return;
        }

        if (this.selectedPlayers.length !== 5) {
            alert('Please select exactly 5 players!');
            return;
        }

        // Check if user has already submitted today
        const lastSubmission = localStorage.getItem('budgetgm_last_submission');
        const today = new Date().toDateString();
        if (lastSubmission === today) {
            // If already submitted, show results
            this.showResults();
            return;
        }

        try {
            // Calculate wins using the simplified model
            const predictedWins = calculateExpectedWins(this.selectedPlayers);

            // Submit the team
            const submitResponse = await fetch('https://budgetbackenddeploy1.onrender.com/api/submit-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nickname: this.nickname,
                    players: this.selectedPlayers,
                    results: {
                        wins: predictedWins,
                        losses: 82 - predictedWins
                    }
                })
            });

            if (!submitResponse.ok) {
                throw new Error(`HTTP error! status: ${submitResponse.status}`);
            }

            // Save submission date to localStorage
            localStorage.setItem('budgetgm_last_submission', today);

            // Update button text
            this.simulateButton.textContent = 'View Results';
            this.simulateButton.classList.add('active');

            // Show results
            this.showResults();

        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting team. Please try again later.');
        }
    }

    async showResults() {
        try {
            const response = await fetch('https://budgetbackenddeploy1.onrender.com/api/leaderboard', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayResults(data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            alert('Error fetching results. Please try again later.');
        }
    }

    displayResults(data) {
        const resultsSection = document.querySelector('.results-section');
        resultsSection.innerHTML = '';

        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container';

        // Add date
        const dateHeader = document.createElement('h2');
        dateHeader.textContent = `Results for ${data.date}`;
        resultsContainer.appendChild(dateHeader);

        // Create leaderboard
        const leaderboard = document.createElement('div');
        leaderboard.className = 'leaderboard';

        // Add headers
        const headerRow = document.createElement('div');
        headerRow.className = 'leaderboard-row header';
        headerRow.innerHTML = `
            <div class="rank">Rank</div>
            <div class="nickname">Nickname</div>
            <div class="wins">Predicted Wins</div>
            <div class="team">Team</div>
            <div class="stats" style="color: white;">Team Stats</div>
        `;
        leaderboard.appendChild(headerRow);

        // Add submissions
        data.submissions.forEach((submission, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            if (submission.nickname === this.nickname) {
                row.classList.add('current-user');
            }

            const teamList = submission.players.map(player => 
                `${player['Full Name']} ($${player['Dollar Value']})`
            ).join('<br>');

            // Calculate team stats
            const teamStats = {
                points: submission.players.reduce((sum, p) => sum + parseFloat(p['Points Per Game (Avg)']), 0).toFixed(1),
                rebounds: submission.players.reduce((sum, p) => sum + parseFloat(p['Rebounds Per Game (Avg)']), 0).toFixed(1),
                assists: submission.players.reduce((sum, p) => sum + parseFloat(p['Assists Per Game (Avg)']), 0).toFixed(1),
                fg_pct: submission.players.reduce((sum, p) => sum + parseFloat(p['Field Goal % (Avg)']), 0) / submission.players.length,
                turnovers: submission.players.reduce((sum, p) => sum + parseFloat(p['TOV']), 0).toFixed(1)
            };

            const statsDisplay = `
                PPG: ${teamStats.points}<br>
                RPG: ${teamStats.rebounds}<br>
                APG: ${teamStats.assists}<br>
                FG%: ${(teamStats.fg_pct * 100).toFixed(1)}%<br>
                TOV: ${teamStats.turnovers}
            `;

            row.innerHTML = `
                <div class="rank">${index + 1}</div>
                <div class="nickname">${submission.nickname}</div>
                <div class="wins">${submission.predicted_wins}</div>
                <div class="team">${teamList}</div>
                <div class="stats">${statsDisplay}</div>
            `;
            leaderboard.appendChild(row);
        });

        resultsContainer.appendChild(leaderboard);

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-results';
        closeButton.textContent = 'Close';
        closeButton.onclick = () => {
            const resultsSection = document.querySelector('.results-section');
            resultsSection.style.display = 'none';
        };
        resultsContainer.appendChild(closeButton);

        resultsSection.appendChild(resultsContainer);
        resultsSection.style.display = 'block';
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

    async saveNickname() {
        const nickname = this.nicknameInput.value.trim();
        if (nickname) {
            try {
                // Check if nickname is available
                const response = await fetch('https://budgetbackenddeploy1.onrender.com/api/submit-team', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nickname: nickname,
                        players: [],
                        results: { wins: 0, losses: 0 }
                    })
                });

                if (response.status === 409) {
                    alert('Sorry, that name is already taken.');
                    return;
                }

                this.nickname = nickname;
                localStorage.setItem('budgetgm_nickname', nickname);
                this.nicknameInput.disabled = true;
                this.saveNicknameBtn.disabled = true;
            } catch (error) {
                console.error('Error checking nickname:', error);
                alert('Error checking nickname availability. Please try again.');
            }
        }
    }
}

function calculateExpectedWins(selectedPlayers) {
    try {
        // Calculate team statistics
        const teamStats = {
            points: selectedPlayers.reduce((sum, p) => sum + parseFloat(p['Points Per Game (Avg)']), 0),
            rebounds: selectedPlayers.reduce((sum, p) => sum + parseFloat(p['Rebounds Per Game (Avg)']), 0),
            assists: selectedPlayers.reduce((sum, p) => sum + parseFloat(p['Assists Per Game (Avg)']), 0),
            steals: selectedPlayers.reduce((sum, p) => sum + parseFloat(p['Steals Per Game (Avg)']), 0),
            blocks: selectedPlayers.reduce((sum, p) => sum + parseFloat(p['Blocks Per Game (Avg)']), 0),
            turnovers: selectedPlayers.reduce((sum, p) => sum + parseFloat(p['TOV']), 0),
            fg_pct: selectedPlayers.reduce((sum, p) => sum + parseFloat(p['Field Goal % (Avg)']), 0) / selectedPlayers.length,
            ft_pct: selectedPlayers.reduce((sum, p) => sum + parseFloat(p['Free Throw % (Avg)']), 0) / selectedPlayers.length,
            three_pct: selectedPlayers.reduce((sum, p) => sum + parseFloat(p['Three Point % (Avg)']), 0) / selectedPlayers.length
        };

        // Calculate predicted wins starting from 0 instead of league average
        let predictedWins = 0 +  // Start from 0 instead of league average
            (teamStats.points * 0.55) +  // Points coefficient (0.22 * 2.5)
            (teamStats.rebounds * 0.20) +  // Rebounds coefficient (0.08 * 2.5)
            (teamStats.assists * 0.10) +  // Assists coefficient (0.04 * 2.5)
            (teamStats.steals * 0.15) +  // Steals coefficient (0.06 * 2.5)
            (teamStats.blocks * 0.10) +  // Blocks coefficient (0.04 * 2.5)
            (teamStats.fg_pct * 0.25) +  // FG% coefficient (0.1 * 2.5)
            (teamStats.ft_pct * 0.10) +  // FT% coefficient (0.04 * 2.5)
            (teamStats.three_pct * 0.15) -  // 3P% coefficient (0.06 * 2.5)
            (teamStats.turnovers * 0.1875);   // Negative impact of turnovers (0.075 * 2.5)

        // Scale up the prediction since bench players will contribute some wins
        predictedWins = predictedWins * 1.1;  // Reduced scaling factor
        
        // Ensure prediction stays within reasonable bounds and round to nearest integer
        return Math.round(Math.max(0, Math.min(74, predictedWins)));
    } catch (error) {
        console.error('Error in win calculation:', error);
        console.log('Player data:', selectedPlayers); // Debug log
        return 20; // Return below average if calculation fails
    }
}

// Initialize the game
const game = new NBABudgetGame();

// Add these variables at the top with other state variables
let currentDate = new Date().toISOString().split('T')[0];
let availableDates = [];
let playedDates = [];

// Add this function to load history
async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/history?nickname=${encodeURIComponent(currentNickname)}`);
        if (!response.ok) throw new Error('Failed to load history');
        const data = await response.json();
        availableDates = data.dates;
        playedDates = data.played_dates;
        updateHistoryView();
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Add this function to load a specific game state
async function loadGameState(date) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/game-state/${date}`);
        if (!response.ok) throw new Error('Failed to load game state');
        const data = await response.json();
        currentDate = date;
        playerStats = data.player_stats;
        updatePlayerList();
        updateTeamStats();
    } catch (error) {
        console.error('Error loading game state:', error);
    }
}

// Add this function to update the history view
function updateHistoryView() {
    const historyContainer = document.getElementById('history-container');
    if (!historyContainer) return;

    historyContainer.innerHTML = `
        <h3>Previous Games</h3>
        <div class="history-list">
            ${availableDates.map(date => `
                <div class="history-item ${playedDates.includes(date) ? 'played' : ''}" onclick="loadGameState('${date}')">
                    <span>${new Date(date).toLocaleDateString()}</span>
                    ${playedDates.includes(date) ? '<span class="played-badge">Played</span>' : ''}
                </div>
            `).join('')}
        </div>
    `;
}

// Modify the existing loadPlayerStats function
async function loadPlayerStats() {
    try {
        // If we're loading a historical game state, don't fetch new stats
        if (currentDate !== new Date().toISOString().split('T')[0]) {
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/player-stats`);
        if (!response.ok) throw new Error('Failed to load player stats');
        playerStats = await response.json();
        updatePlayerList();
        updateTeamStats();
    } catch (error) {
        console.error('Error loading player stats:', error);
    }
}

// Modify the existing saveNickname function
async function saveNickname() {
    const nickname = document.getElementById('nickname').value.trim();
    if (!nickname) {
        alert('Please enter a nickname');
        return;
    }

    try {
        // Check if nickname is available
        const checkResponse = await fetch(`${API_BASE_URL}/api/submit-team`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nickname: nickname,
                players: selectedPlayers,
                results: {
                    wins: calculatePredictedWins()
                }
            })
        });

        if (checkResponse.status === 409) {
            alert('Sorry, that name is already taken.');
            return;
        }

        if (!checkResponse.ok) throw new Error('Failed to save nickname');
        
        currentNickname = nickname;
        document.getElementById('nickname-container').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        
        // Load history after saving nickname
        await loadHistory();
    } catch (error) {
        console.error('Error saving nickname:', error);
        alert('Error saving nickname. Please try again.');
    }
}

// Add this to your HTML
document.body.insertAdjacentHTML('beforeend', `
    <div id="history-container" class="history-container">
        <h3>Previous Games</h3>
        <div class="history-list"></div>
    </div>
`);

// Add this CSS
const style = document.createElement('style');
style.textContent = `
    .history-container {
        position: fixed;
        right: 20px;
        top: 20px;
        background: rgba(0, 0, 0, 0.8);
        padding: 15px;
        border-radius: 8px;
        max-width: 300px;
        max-height: 80vh;
        overflow-y: auto;
    }

    .history-container h3 {
        color: white;
        margin: 0 0 10px 0;
        font-size: 1.2em;
    }

    .history-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .history-item {
        background: rgba(255, 255, 255, 0.1);
        padding: 10px;
        border-radius: 4px;
        cursor: pointer;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s;
    }

    .history-item:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .history-item.played {
        border-left: 3px solid #4CAF50;
    }

    .played-badge {
        background: #4CAF50;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.8em;
    }
`;
document.head.appendChild(style);

// Call loadHistory when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
}); 
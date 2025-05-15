const API_BASE_URL = 'https://budgetbackenddeploy1.onrender.com';

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
        const today = getCurrentGameDate();
        
        if (lastSubmission === today) {
            this.simulateButton.textContent = 'View Results';
            this.simulateButton.classList.add('active');
            // Disable player selection
            const playerCards = document.querySelectorAll('.player-card');
            playerCards.forEach(card => {
                if (!card.classList.contains('selected')) {
                    card.style.pointerEvents = 'none';
                    card.style.opacity = '0.5';
                }
            });
        } else {
            this.simulateButton.textContent = 'Submit Team';
            this.simulateButton.classList.remove('active');
            // Enable player selection
            const playerCards = document.querySelectorAll('.player-card');
            playerCards.forEach(card => {
                if (!card.classList.contains('selected')) {
                    card.style.pointerEvents = 'auto';
                    card.style.opacity = '1';
                }
            });
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
        
        console.log('Initialized displayed players:', this.displayedPlayers.length);
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
        // Clear the team display
        this.teamDisplay.innerHTML = '';
        
        // Create team header
        const teamHeader = document.createElement('div');
        teamHeader.className = 'team-header';
        teamHeader.innerHTML = `
            <h2>Your Team</h2>
            <div class="budget-info">
                <span>Budget: $${this.budget}</span>
                <span>Remaining: $${this.remainingBudget}</span>
            </div>
        `;
        this.teamDisplay.appendChild(teamHeader);

        // Calculate and display position multiplier
        const positionMultiplier = calculatePositionMultiplier(this.selectedPlayers);
        const multiplierDisplay = document.createElement('div');
        multiplierDisplay.className = 'position-multiplier';
        let multiplierText = '';
        let multiplierClass = '';
        
        if (positionMultiplier === 1.1) {
            multiplierText = 'Optimal Lineup (+10% Wins)';
            multiplierClass = 'optimal';
        } else if (positionMultiplier === 0.9) {
            multiplierText = 'Suboptimal Lineup (-10% Wins)';
            multiplierClass = 'suboptimal';
        } else if (positionMultiplier === 0.8) {
            multiplierText = 'Poor Lineup (-20% Wins)';
            multiplierClass = 'poor';
        } else {
            multiplierText = 'Balanced Lineup (No Multiplier)';
            multiplierClass = 'balanced';
        }
        
        multiplierDisplay.innerHTML = `<span class="${multiplierClass}">${multiplierText}</span>`;
        this.teamDisplay.appendChild(multiplierDisplay);

        // Create players container
        const playersContainer = document.createElement('div');
        playersContainer.className = 'selected-players';
        
        // Add selected players
        this.selectedPlayers.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'selected-player-card';
            
            const imageUrl = `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player['Player ID']}.png`;
            
            playerCard.innerHTML = `
                <img src="${imageUrl}" alt="${player['Player Name']}" onerror="this.src='https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/0.png'">
                <div class="player-info">
                    <h3>${player['Player Name']}</h3>
                    <p>Position: ${player['Position']}</p>
                    <p>Value: $${player['Dollar Value']}</p>
                </div>
                <button class="remove-player" data-player-id="${player['Player ID']}">×</button>
            `;
            
            playersContainer.appendChild(playerCard);
        });
        
        this.teamDisplay.appendChild(playersContainer);
        
        // Add event listeners for remove buttons
        const removeButtons = this.teamDisplay.querySelectorAll('.remove-player');
        removeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const playerId = button.getAttribute('data-player-id');
                const player = this.selectedPlayers.find(p => p['Player ID'] === playerId);
                if (player) {
                    this.removePlayer(player);
                }
            });
        });
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
        // If button says "View Results", just show the results
        if (this.simulateButton.textContent === 'View Results') {
            this.showResults();
            return;
        }

        if (!this.nickname) {
            alert('Please enter a nickname first!');
            return;
        }

        if (this.selectedPlayers.length !== 5) {
            alert('Please select exactly 5 players!');
            return;
        }

        try {
            // Calculate wins using the simplified model
            const predictedWins = calculateExpectedWins(this.selectedPlayers);

            // Submit the team
            const submitResponse = await fetch(`${API_BASE_URL}/api/submit-team`, {
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

            // Save submission date using game date
            localStorage.setItem('budgetgm_last_submission', getCurrentGameDate());

            // Update button text
            this.simulateButton.textContent = 'View Results';
            this.simulateButton.classList.add('active');

            // Disable player selection
            const playerCards = document.querySelectorAll('.player-card');
            playerCards.forEach(card => {
                if (!card.classList.contains('selected')) {
                    card.style.pointerEvents = 'none';
                    card.style.opacity = '0.5';
                }
            });

            // Show results
            this.showResults();

        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting team. Please try again later.');
        }
    }

    async showResults() {
        try {
            const date = getCurrentGameDate();
            console.log('Fetching leaderboard for game date:', date);

            const response = await fetch(`${API_BASE_URL}/api/leaderboard?date=${date}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received leaderboard data:', data);
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
            <div class="user-wins">User/Wins</div>
            <div class="team">Team</div>
            <div class="stats">
                <div class="stats-header">Team Stats</div>
                <div class="stats-matrix">
                    <div class="stats-row">
                        <span>PPG</span>
                        <span>RPG</span>
                        <span>APG</span>
                        <span>FG%</span>
                        <span>TOV</span>
                        <span>BLK</span>
                        <span>STL</span>
                    </div>
                </div>
            </div>
        `;
        leaderboard.appendChild(headerRow);

        // Add submissions
        data.submissions.forEach((submission, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            if (submission.nickname === this.nickname) {
                row.classList.add('current-user');
            }

            // Create team images container
            const teamImages = submission.players.map(player => {
                const imageUrl = `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player['Player ID']}.png`;
                return `<img src="${imageUrl}" alt="${player['Full Name']}" onerror="this.src='https://cdn.nba.com/headshots/nba/latest/1040x760/fallback.png'" class="team-player-image">`;
            }).join('');

            // Calculate team stats
            const teamStats = {
                points: submission.players.reduce((sum, p) => sum + parseFloat(p['Points Per Game (Avg)']), 0).toFixed(1),
                rebounds: submission.players.reduce((sum, p) => sum + parseFloat(p['Rebounds Per Game (Avg)']), 0).toFixed(1),
                assists: submission.players.reduce((sum, p) => sum + parseFloat(p['Assists Per Game (Avg)']), 0).toFixed(1),
                fg_pct: submission.players.reduce((sum, p) => sum + parseFloat(p['Field Goal % (Avg)']), 0) / submission.players.length,
                turnovers: submission.players.reduce((sum, p) => sum + parseFloat(p['TOV']), 0).toFixed(1),
                blocks: submission.players.reduce((sum, p) => sum + parseFloat(p['Blocks Per Game (Avg)']), 0).toFixed(1),
                steals: submission.players.reduce((sum, p) => sum + parseFloat(p['Steals Per Game (Avg)']), 0).toFixed(1)
            };

            const statsDisplay = `
                <div class="stats-matrix">
                    <div class="stats-row">
                        <span>${teamStats.points}</span>
                        <span>${teamStats.rebounds}</span>
                        <span>${teamStats.assists}</span>
                        <span>${(teamStats.fg_pct * 100).toFixed(1)}%</span>
                        <span>${teamStats.turnovers}</span>
                        <span>${teamStats.blocks}</span>
                        <span>${teamStats.steals}</span>
                    </div>
                </div>
            `;

            // Use the wins from the submission results
            const wins = submission.results.wins;

            row.innerHTML = `
                <div class="rank">${index + 1}</div>
                <div class="user-wins"><span class="nickname">${submission.nickname}</span> won <span class="wins">${wins}</span> games</div>
                <div class="team">${teamImages}</div>
                <div class="stats">${statsDisplay}</div>
            `;
            leaderboard.appendChild(row);
        });

        resultsContainer.appendChild(leaderboard);

        // Add buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'results-buttons';

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-results';
        closeButton.textContent = 'Close';
        closeButton.onclick = () => {
            const resultsSection = document.querySelector('.results-section');
            resultsSection.style.display = 'none';
        };

        buttonsContainer.appendChild(closeButton);
        resultsContainer.appendChild(buttonsContainer);

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

function calculatePositionMultiplier(selectedPlayers) {
    // Count positions
    const positionCounts = {
        PG: 0,
        SG: 0,
        SF: 0,
        PF: 0,
        C: 0
    };

    // Count each position
    selectedPlayers.forEach(player => {
        const position = player['Position'];
        if (positionCounts.hasOwnProperty(position)) {
            positionCounts[position]++;
        }
    });

    // Check for severely imbalanced lineups (0.8x multiplier)
    if (positionCounts.C >= 4 || 
        (positionCounts.PG + positionCounts.SG) >= 5 ||
        (positionCounts.C + positionCounts.PF) === 0) {
        return 0.8;
    }

    // Check for suboptimal lineups (0.9x multiplier)
    if (positionCounts.C >= 3 || 
        positionCounts.PF >= 3 ||
        (positionCounts.C >= 2 && positionCounts.PF >= 2) ||
        (positionCounts.PG + positionCounts.SG) >= 4 ||
        positionCounts.PG >= 3 ||
        positionCounts.C === 0 ||
        positionCounts.PG === 0 ||
        positionCounts.PF === 0) {
        return 0.9;
    }

    // Check for optimal lineups (1.1x multiplier)
    // Traditional starting 5
    if (positionCounts.PG === 1 && positionCounts.SG === 1 && 
        positionCounts.SF === 1 && positionCounts.PF === 1 && positionCounts.C === 1) {
        return 1.1;
    }

    // Modern small ball
    if ((positionCounts.PG === 1 && positionCounts.SG === 1 && 
         positionCounts.SF === 1 && positionCounts.PF === 2) ||
        (positionCounts.PG === 1 && positionCounts.SG === 1 && 
         positionCounts.SF === 2 && positionCounts.PF === 1) ||
        (positionCounts.PG === 2 && positionCounts.SG === 1 && 
         positionCounts.SF === 1 && positionCounts.PF === 1)) {
        return 1.1;
    }

    // Positionless basketball
    if ((positionCounts.PG === 1 && positionCounts.SG === 1 && 
         positionCounts.SF === 3) ||
        (positionCounts.PG === 1 && positionCounts.SG === 2 && 
         positionCounts.SF === 1 && positionCounts.PF === 1) ||
        (positionCounts.PG === 2 && positionCounts.SG === 1 && 
         positionCounts.SF === 2)) {
        return 1.1;
    }

    // Default case - balanced but not optimal
    return 1.0;
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
            (teamStats.points * 0.48) +  // Points coefficient (0.22 * 2.5)
            (teamStats.rebounds * 0.24) +  // Rebounds coefficient (0.08 * 2.5)
            (teamStats.assists * 0.11) +  // Assists coefficient (0.04 * 2.5)
            (teamStats.steals * 0.15) +  // Steals coefficient (0.06 * 2.5)
            (teamStats.blocks * 0.12) +  // Blocks coefficient (0.04 * 2.5)
            (teamStats.fg_pct * 0.28) +  // FG% coefficient (0.1 * 2.5)
            (teamStats.ft_pct * 0.08) +  // FT% coefficient (0.04 * 2.5)
            (teamStats.three_pct * 0.12) -  // 3P% coefficient (0.06 * 2.5)
            (teamStats.turnovers * 0.22);   // Negative impact of turnovers (0.075 * 2.5)

        // Apply position-based multiplier
        const positionMultiplier = calculatePositionMultiplier(selectedPlayers);
        predictedWins *= positionMultiplier;
        
        // Ensure prediction stays within reasonable bounds and round to nearest integer
        return Math.round(Math.max(0, Math.min(74, predictedWins)));
    } catch (error) {
        console.error('Error in win calculation:', error);
        console.log('Player data:', selectedPlayers); // Debug log
        return 20; // Return below average if calculation fails
    }
}

// Utility to get the current "game date" (after 1:00 AM ET, otherwise previous day)
function getCurrentGameDate() {
    const eastern = new Date().toLocaleString("en-US", { timeZone: "US/Eastern" });
    const now = new Date(eastern);
    // If it's before 1:00 AM or exactly at 1:00 AM, return previous day
    if (now.getHours() < 1 || (now.getHours() === 1 && now.getMinutes() === 0)) {
        now.setDate(now.getDate() - 1);
    }
    return now.toISOString().split('T')[0];
}

// On page load, clear "Your Team" if the date has changed
(function clearTeamIfDateChanged() {
    const lastTeamDate = localStorage.getItem('budgetgm_last_team_date');
    const today = getCurrentGameDate();
    if (lastTeamDate !== today) {
        localStorage.removeItem('budgetgm_selected_team');
        localStorage.removeItem('budgetgm_last_submission');
        localStorage.setItem('budgetgm_last_team_date', today);
    }
})();

// When saving a team, also update the date
NBABudgetGame.prototype.saveSelectedTeam = function() {
    localStorage.setItem('budgetgm_selected_team', JSON.stringify(this.selectedPlayers));
    localStorage.setItem('budgetgm_last_team_date', getCurrentGameDate());
};

// Make sure to call game.saveSelectedTeam() whenever the team is updated
// For example, after selecting/deselecting a player:
// this.saveSelectedTeam();

// Initialize the game
const game = new NBABudgetGame();

// Update the CSS to remove history-related styles
const style = document.createElement('style');
style.textContent = `
    .results-buttons {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 20px;
    }

    .close-results {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.2s;
        background-color: #666;
        color: white;
    }

    .close-results:hover {
        background-color: #555;
    }

    .stats-matrix {
        display: flex;
        flex-direction: column;
        font-family: monospace;
        font-size: 0.9em;
        width: fit-content;
        margin: 0 auto;
        padding: 0 10px;
    }

    .stats-row {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    .stats-row span {
        color: black;
        min-width: 68px;
        text-align: center;
        padding: 0;
        margin: 0;
        font-size: 1.1em;
        letter-spacing: -0.5px;
    }

    .stats-header {
        text-align: center;
        margin-bottom: 3px;
        font-weight: bold;
        font-size: 1.1em;
        color: white;
    }

    .leaderboard-row {
        display: grid;
        grid-template-columns: 30px 150px 108px 1fr;
        align-items: center;
        padding: 5px;
    }

    .leaderboard-row.header {
        font-weight: bold;
        border-bottom: 2px solid #666;
    }

    .team {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: 108px;
    }

    .team-player-image {
        width: 79px;
        height: 79px;
        object-fit: cover;
        border-radius: 2px;
        margin-right: -8px;
    }

    .user-wins {
        font-size: 0.9em;
        white-space: nowrap;
    }

    .user-wins .nickname {
        font-weight: bold;
        color: #4CAF50;
    }

    .user-wins .wins {
        font-weight: bold;
        color: #2196F3;
    }

    .results-container {
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        padding: 12px;
        box-sizing: border-box;
    }

    .leaderboard {
        width: 100%;
        overflow-x: auto;
        padding: 0 12px;
    }

    .stats {
        margin-left: 18px;
    }
`;
document.head.appendChild(style); 
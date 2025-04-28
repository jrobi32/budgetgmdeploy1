// Backend API URL
const API_URL = 'https://budgetbackenddeploy1.onrender.com';

// Game state
let players = [];
let selectedPlayers = [];
let budget = 15;

// DOM elements
const availablePlayersList = document.getElementById('available-players');
const selectedPlayersList = document.getElementById('selected-players');
const budgetDisplay = document.getElementById('budget');
const predictButton = document.getElementById('predict-button');
const resultsDiv = document.getElementById('results');

// Initialize the game
async function initGame() {
    try {
        // Load players from backend
        const response = await fetch(`${API_URL}/players`);
        if (!response.ok) {
            throw new Error('Failed to load players');
        }
        players = await response.json();
        displayPlayers();
        updateBudget();
    } catch (error) {
        console.error('Error loading players:', error);
        alert('Failed to load players. Please try again later.');
    }
}

// Display available players
function displayPlayers() {
    availablePlayersList.innerHTML = '';
    players.forEach(player => {
        if (!selectedPlayers.includes(player)) {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-card';
            playerElement.innerHTML = `
                <h3>${player.name}</h3>
                <p>Rating: ${player.rating}</p>
                <p>Cost: $${player.cost}</p>
                <button onclick="selectPlayer(${player.id})">Select</button>
            `;
            availablePlayersList.appendChild(playerElement);
        }
    });
}

// Select a player
function selectPlayer(playerId) {
    const player = players.find(p => p.id === playerId);
    if (player && budget >= player.cost && selectedPlayers.length < 5) {
        selectedPlayers.push(player);
        budget -= player.cost;
        updateBudget();
        displayPlayers();
        displaySelectedPlayers();
    }
}

// Display selected players
function displaySelectedPlayers() {
    selectedPlayersList.innerHTML = '';
    selectedPlayers.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-card';
        playerElement.innerHTML = `
            <h3>${player.name}</h3>
            <p>Rating: ${player.rating}</p>
            <p>Cost: $${player.cost}</p>
            <button onclick="removePlayer(${player.id})">Remove</button>
        `;
        selectedPlayersList.appendChild(playerElement);
    });
}

// Remove a player
function removePlayer(playerId) {
    const player = selectedPlayers.find(p => p.id === playerId);
    if (player) {
        selectedPlayers = selectedPlayers.filter(p => p.id !== playerId);
        budget += player.cost;
        updateBudget();
        displayPlayers();
        displaySelectedPlayers();
    }
}

// Update budget display
function updateBudget() {
    budgetDisplay.textContent = `$${budget}`;
}

// Predict wins
async function predictWins() {
    if (selectedPlayers.length !== 5) {
        alert('Please select exactly 5 players');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                players: selectedPlayers
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get prediction');
        }

        const data = await response.json();
        displayResults(data);
    } catch (error) {
        console.error('Error getting prediction:', error);
        alert('Failed to get prediction. Please try again later.');
    }
}

// Display results
function displayResults(data) {
    resultsDiv.innerHTML = `
        <div class="results-card">
            <h2>Predicted Wins: ${data.predicted_wins}</h2>
            ${data.message ? `<p>${data.message}</p>` : ''}
        </div>
    `;
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initGame); 
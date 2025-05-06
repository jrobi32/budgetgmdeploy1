const fs = require('fs');

class ModelTester {
    constructor() {
        this.testData = [];
        this.stats = {
            min: {},
            max: {},
            mean: {}
        };
    }

    loadTestData() {
        try {
            const csvText = fs.readFileSync('nba_team_stats.csv', 'utf8');
            const lines = csvText.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            
            this.testData = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                return headers.reduce((obj, header, index) => {
                    obj[header] = parseFloat(values[index]) || 0;
                    return obj;
                }, {});
            }).filter(team => !isNaN(team.W) && !isNaN(team.PTS) && !isNaN(team.FG_PCT) && !isNaN(team.PLUS_MINUS));
            
            // Calculate statistics
            const numericFields = ['PTS', 'PLUS_MINUS', 'FG_PCT'];
            numericFields.forEach(field => {
                const values = this.testData.map(team => team[field]);
                this.stats.min[field] = Math.min(...values);
                this.stats.max[field] = Math.max(...values);
                this.stats.mean[field] = values.reduce((a, b) => a + b, 0) / values.length;
            });
            
            console.log('Loaded test data:', this.testData.length, 'teams');
            
            // Log some basic statistics
            console.log('\nBasic Statistics:');
            numericFields.forEach(field => {
                const value = field === 'FG_PCT' ? 
                    (this.stats.mean[field] * 100).toFixed(2) + '%' :
                    this.stats.mean[field].toFixed(2);
                console.log(`Average ${field}:`, value);
            });
        } catch (error) {
            console.error('Error loading test data:', error);
            throw error;
        }
    }

    calculateR2(actual, predicted) {
        const mean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
        const ssTotal = actual.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
        const ssResidual = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
        return 1 - (ssResidual / ssTotal);
    }

    testModel() {
        const predictions = this.testData.map(team => {
            // Calculate offensive rating (points per game relative to league average)
            const offensiveRating = (team.PTS - this.stats.mean['PTS']) / (this.stats.max['PTS'] - this.stats.min['PTS']);
            
            // Calculate efficiency rating (FG% relative to league average)
            const efficiencyRating = (team.FG_PCT - this.stats.mean['FG_PCT']) / (this.stats.max['FG_PCT'] - this.stats.min['FG_PCT']);
            
            // Calculate team impact (plus/minus relative to league average)
            const impactRating = (team.PLUS_MINUS - this.stats.mean['PLUS_MINUS']) / (this.stats.max['PLUS_MINUS'] - this.stats.min['PLUS_MINUS']);
            
            // Combine ratings with weights
            const rating = (
                offensiveRating * 0.25 +
                efficiencyRating * 0.25 +
                impactRating * 0.5  // Increased weight for plus/minus
            );
            
            // Convert rating to wins (41 is league average)
            // Increased the multiplier to make predictions more extreme
            return 41 + (rating * 25);
        });

        const actualWins = this.testData.map(team => team.W);
        const r2 = this.calculateR2(actualWins, predictions);
        
        // Calculate average error
        const errors = actualWins.map((actual, i) => Math.abs(actual - predictions[i]));
        const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
        
        console.log('\nModel Performance:');
        console.log('R² Score:', r2.toFixed(4));
        console.log('Average Error:', avgError.toFixed(2), 'wins');
        
        // Print some example predictions
        console.log('\nExample Predictions:');
        for (let i = 0; i < 5; i++) {
            console.log(
                'Team with', this.testData[i].PTS.toFixed(1), 'PPG,',
                (this.testData[i].FG_PCT * 100).toFixed(1) + '% FG,',
                'Plus/Minus:', this.testData[i].PLUS_MINUS.toFixed(1),
                '=> Predicted:', predictions[i].toFixed(1),
                'wins (Actual:', this.testData[i].W + ')'
            );
        }
        
        // Print distribution of predictions
        const predictionRanges = {
            '0-20': 0,
            '21-30': 0,
            '31-40': 0,
            '41-50': 0,
            '51-60': 0,
            '61+': 0
        };
        
        predictions.forEach(pred => {
            if (pred < 20) predictionRanges['0-20']++;
            else if (pred < 30) predictionRanges['21-30']++;
            else if (pred < 40) predictionRanges['31-40']++;
            else if (pred < 50) predictionRanges['41-50']++;
            else if (pred < 60) predictionRanges['51-60']++;
            else predictionRanges['61+']++;
        });
        
        console.log('\nPrediction Distribution:');
        Object.entries(predictionRanges).forEach(([range, count]) => {
            console.log(`${range} wins:`, count, 'teams');
        });
    }

    runTest() {
        this.loadTestData();
        this.testModel();
    }
}

// Run the test
const tester = new ModelTester();
tester.runTest(); 
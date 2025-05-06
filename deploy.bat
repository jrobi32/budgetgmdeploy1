@echo off
REM Create directories
mkdir frontend
mkdir backend

REM Copy backend files
copy app.py backend\
copy requirements.txt backend\
copy render.yaml backend\
copy best_model.joblib backend\
copy scaler.joblib backend\

REM Copy frontend files
copy index.html frontend\
copy styles.css frontend\
copy game.js frontend\
copy nba_players_final_updated.csv frontend\
copy netlify.toml frontend\

REM Initialize and push backend
cd backend
git init
git add .
git commit -m "Initial backend deployment"
git remote add origin https://github.com/jrobi32/budgetbackenddeploy1.git
git push -f origin master
cd ..

REM Initialize and push frontend
cd frontend
git init
git add .
git commit -m "Initial frontend deployment"
git remote add origin https://github.com/jrobi32/budgetgmdeploy1.git
git push -f origin master
cd .. 
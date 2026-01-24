@echo off
echo ==========================================
echo Starting Michela Application
echo ==========================================

echo.
echo [1/2] Launching Backend Server...
start "Michela Backend" cmd /k "cd backend && call venv\Scripts\activate && echo Installing dependencies... && pip install -r requirements.txt && echo Starting Flask Server... && python src\app\logic\api.py"

echo.
echo [2/2] Launching Frontend Application...
echo Starting in development mode...
start "Michela Frontend" cmd /k "cd frontend && echo Installing dependencies... && call npm install && echo Starting Next.js Dev Server... && call npm run dev"

echo.
echo Success! Both windows have been launched.
echo Backend URL: http://localhost:5000
echo Frontend URL: http://localhost:3000
echo.
pause

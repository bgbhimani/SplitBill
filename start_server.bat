@echo off
echo Starting Splitwise with ML Services...

REM Start Backend Server
start cmd /k "cd /d E:\Projects\Splitwise\backend && npm run dev"

REM Start ML Model Server with dependencies check
@REM start cmd /k "cd /d E:\Projects\Splitwise\ml-model && start_ml_service.bat"
start cmd /k "cd /d E:\Projects\Splitwise\ml-model && python app.py"

REM Start Frontend Server
start cmd /k "cd /d E:\Projects\Splitwise\frontend && npm run dev"

echo All services starting...
echo - Backend: http://localhost:5000
echo - ML Service: http://localhost:5001  
echo - Frontend: http://localhost:5173

exit

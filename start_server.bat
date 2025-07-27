@echo off

REM Start Backend Server
start cmd /k "cd /d E:\Projects\Splitwise\backend && npm run dev"

REM Start ML Model Server
start cmd /k "cd /d E:\Projects\Splitwise\ml-model && python app.py"

REM Start Frontend Server
start cmd /k "cd /d E:\Projects\Splitwise\frontend && npm run dev"

exit

$workDir = "E:\Nasa Space Apps Resources\AstroVitals"
$pyExe = "C:\Users\tanvi\AppData\Local\Programs\Python\Python311\python.exe"

# Kill existing instances on ports 8080 and 5173
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Start-Sleep -Milliseconds 500

# Start backend with correct working directory
Start-Process $pyExe -ArgumentList "-m uvicorn backend.main:app --host 0.0.0.0 --port 8080" -WorkingDirectory $workDir -WindowStyle Hidden

# Start frontend with correct working directory
Start-Process cmd -ArgumentList "/c cd frontend && npm run dev -- --host 0.0.0.0 --port 5173" -WorkingDirectory $workDir -WindowStyle Hidden

Start-Sleep -Seconds 4
Write-Output "Services started with working directory $workDir."

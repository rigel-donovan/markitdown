# MarkItDown Web Studio Launcher for PowerShell
Set-Location -Path $PSScriptRoot

if (-Not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "[ERROR] Virtual environment .venv tidak ditemukan!" -ForegroundColor Red
    exit 1
}

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "       Menjalankan MarkItDown Web Studio...        " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Buka browser di: http://localhost:5050" -ForegroundColor Yellow

Start-Process "http://localhost:5050"
& ".venv\Scripts\python.exe" app.py

@echo off
title MarkItDown Studio
cd /d "%~dp0"
echo ===================================================
echo        Menjalankan MarkItDown Web Studio...
echo ===================================================
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment .venv tidak ditemukan!
    echo Silakan jalankan instalasi terlebih dahulu.
    pause
    exit /b 1
)

start "" "http://localhost:5050"
.venv\Scripts\python.exe app.py
pause

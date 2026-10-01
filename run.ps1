$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$pythonPath = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $pythonPath)) {
    throw ".venv not found. Create it using: python -m venv .venv"
}

Write-Host "Starting Smart Chatbot: http://127.0.0.1:8000"
Write-Host "Keep this terminal open. Press Ctrl+C to stop."

& $pythonPath -m uvicorn backend.app.main:app --reload

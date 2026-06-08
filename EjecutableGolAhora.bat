@echo off
title Ejecutable GolAhora

echo Iniciando HistoryService en puerto 5071...
start cmd /k "cd /d %~dp0Api && dotnet run --launch-profile https"

echo Iniciando Frontend en puerto 5173...
start cmd /k "cd /d %~dp0frontend && pnpm run dev"

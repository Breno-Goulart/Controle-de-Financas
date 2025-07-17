@echo off
cd /d %~dp0

echo ===============================
echo  INICIANDO DEPLOY PARA GITHUB
echo ===============================

REM 1. Mostra status do repositório
git status
echo -------------------------------
echo.

REM 2. Adiciona todas as mudanças
git add .

REM 3. Pede comentário do commit
set /p commitMsg=Digite a mensagem do commit: 

git commit -m "%commitMsg%"

REM 4. Faz o push para o GitHub
git push

echo.
echo ===============================
echo  DEPLOY FINALIZADO COM SUCESSO!
echo ===============================
pause

@echo off
cd /d %~dp0
echo.
echo === Verificando alterações...
git status
echo.
echo === Adicionando todos os arquivos modificados, criados e renomeados...
git add -A
echo.
set /p msg="Digite a mensagem do commit: "
git commit -m "%msg%"
echo.
echo === Enviando para o GitHub...
git push origin main
echo.
pause

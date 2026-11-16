@echo off
REM Publie le projet DragonFit sur GitHub en un double-clic
cd /d "%~dp0"
echo.
echo === Publication de DragonFit sur GitHub ===
echo.
set /p PSEUDO=Ton nom d'utilisateur GitHub :
echo.
git add .
git commit -m "README portfolio et illustrations"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/%PSEUDO%/dragonfit.git
git push -u origin main
echo.
echo Termine ! Ouvre https://github.com/%PSEUDO%/dragonfit pour voir ton projet.
echo.
pause

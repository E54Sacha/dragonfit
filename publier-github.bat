@echo off
REM Publie / met a jour le projet DragonFit sur GitHub en un double-clic
cd /d "%~dp0"
echo.
echo === Publication de DragonFit sur GitHub ===
echo.
git add .
git commit -m "Mise a jour DragonFit"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/E54Sacha/dragonfit.git
git push -u origin main
echo.
echo Termine ! Ouvre https://github.com/E54Sacha/dragonfit pour voir ton projet.
echo.
pause

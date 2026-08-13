@echo off
setlocal
cd /d "%~dp0"
echo Installing dependencies...
call npm install
if errorlevel 1 goto :error
echo Building SIGNAL Wallpaper for Windows...
call npm run dist:win
if errorlevel 1 goto :error
echo.
echo Build complete. Check the dist folder.
pause
exit /b 0
:error
echo.
echo Build failed. Review the error above.
pause
exit /b 1

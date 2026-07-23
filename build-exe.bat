@echo off
echo ========================================
echo  Restaurante POS - Build EXE
echo ========================================
echo.

echo [1/3] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Fallo npm install
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Compilando con electron-vite...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo electron-vite build
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Generando .exe con electron-builder...
call npm run dist:win
if %errorlevel% neq 0 (
    echo ERROR: Fallo electron-builder
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo  EXE generado exitosamente
echo  Revisa la carpeta: release\
echo ========================================
pause

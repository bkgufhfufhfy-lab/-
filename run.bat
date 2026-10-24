@echo off
chcp 65001 >nul
title 时光胶囊 Time Capsule · 藏书阁

echo ===================================================
echo   ⏳ 时光胶囊 (Time Capsule) - 个人本地藏书阁
echo ===================================================
echo.

cd /d "%~dp0"

:: Check node_modules
if not exist "node_modules" (
    echo [1/3] 正在检测并安装依赖包...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败，请检查网络或 Node.js 环境。
        pause
        exit /b 1
    )
)

:: Check dist production build
if not exist "dist" (
    echo [2/3] 正在生成本地静态界面...
    call npm run build
    if errorlevel 1 (
        echo [错误] 构建失败。
        pause
        exit /b 1
    )
)

echo [3/3] 正在启动本地服务...
echo 本地服务地址: http://127.0.0.1:3000
echo.
echo 提示: 正在为你自动打开浏览器，保持此窗口运行即可。
echo 按 Ctrl + C 可退出程序。
echo.

:: Open default browser after 1.5 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:3000"

:: Start Node Express server
node server/index.js
pause

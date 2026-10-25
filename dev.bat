@echo off
chcp 65001 >nul
setlocal
title 写给自己 · 开发模式
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [错误] 没有找到 Node.js，请先安装：https://nodejs.org/
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\react\package.json" (
  echo.
  echo  首次运行，正在安装依赖，请稍候……
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo  [错误] 依赖安装失败，请检查网络后重试。
    echo.
    pause
    exit /b 1
  )
)

echo.
echo  开发服务器启动后会自动打开 http://localhost:4174/
echo  修改代码会立即刷新页面；关闭这个窗口即停止服务。
echo.
call npm run dev -- %*
if errorlevel 1 pause
endlocal

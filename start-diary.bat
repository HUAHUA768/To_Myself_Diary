@echo off
chcp 65001 >nul
setlocal
title 写给自己 · 启动中
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [错误] 没有找到 Node.js。
  echo  请先安装 Node.js 22.12 或更新版本：https://nodejs.org/
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
node "scripts\serve-dist.mjs" %*
if errorlevel 1 pause
endlocal

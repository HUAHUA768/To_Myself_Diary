@echo off
chcp 65001 >nul
setlocal
title 写给自己 · 构建
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
  echo  首次构建，正在安装依赖，请稍候……
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo  [错误] 依赖安装失败，请检查网络后重试。
    echo.
    pause
    exit /b 1
  )
)

call npm run build
if errorlevel 1 (
  echo.
  echo  [错误] 构建失败，请把上面的错误信息发给开发者。
  echo.
  pause
  exit /b 1
)

echo.
echo  构建完成。产物在 dist 目录。
echo  以后直接双击 start-diary.bat 就能写作了。
echo.
pause
endlocal

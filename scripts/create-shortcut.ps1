<#
  为「写给自己」创建 Windows 快捷方式。

  用法：
    powershell -ExecutionPolicy Bypass -File scripts\create-shortcut.ps1
    powershell -ExecutionPolicy Bypass -File scripts\create-shortcut.ps1 -Desktop

  项目换位置、或想重建图标与快捷方式时，重新运行一次即可。
#>
param(
  [switch]$Desktop
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$launcher = Join-Path $root "start-diary.bat"
$icon = Join-Path $root "docs\app-icon.ico"
$name = "写给自己.lnk"

if (-not (Test-Path -LiteralPath $launcher)) {
  throw "找不到启动脚本：$launcher"
}

$shell = New-Object -ComObject WScript.Shell

function New-DiaryShortcut([string]$Path) {
  $link = $shell.CreateShortcut($Path)
  $link.TargetPath = $launcher
  $link.WorkingDirectory = $root
  $link.WindowStyle = 7   # 最小化：任务栏里留一个可关闭的窗口，关掉即停止服务
  $link.Description = "写给自己 · 打开本地日记"
  if (Test-Path -LiteralPath $icon) {
    $link.IconLocation = "$icon,0"
  }
  $link.Save()
  Write-Host "已创建：$Path"
}

$localShortcut = Join-Path $root $name
New-DiaryShortcut $localShortcut

if ($Desktop) {
  $desktopDir = [Environment]::GetFolderPath("Desktop")
  if ($desktopDir -and (Test-Path -LiteralPath $desktopDir)) {
    $target = Join-Path $desktopDir $name
    Copy-Item -LiteralPath $localShortcut -Destination $target -Force
    Write-Host "已放到桌面：$target"
  }
}

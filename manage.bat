@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动 星风 管理工具...
node scripts/start-manage.js
pause

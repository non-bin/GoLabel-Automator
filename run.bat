@echo off
title Golabel Automator
node -v > NUL || echo [91mERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/en/download/[0m && pause && exit
node src\server.js %* || pause

#!/bin/bash
export NVM_DIR="/home/led-dreams/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /home/led-dreams/interactive-pumpkin/
git pull origin master
npm install
npm start

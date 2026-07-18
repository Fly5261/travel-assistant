#!/bin/bash

echo "开始部署智能旅游助手后端..."

if ! command -v node &> /dev/null; then
    echo "安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    echo "安装 PM2..."
    sudo npm install -g pm2
fi

echo "安装项目依赖..."
npm install --production

echo "启动服务..."
pm2 start ecosystem.config.js

echo "部署完成！"
echo "服务状态: pm2 status"
echo "服务日志: pm2 logs travel-server"
#!/bin/bash

# Docker 运行脚本
# 使用方法: ./docker-run.sh

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

# 构建 Docker 镜像
echo "Building Docker image..."
docker build -t ai-voice-compare .

# 停止并删除旧容器（如果存在）
echo "Stopping old container..."
docker stop ai-voice-compare 2>/dev/null
docker rm ai-voice-compare 2>/dev/null

# 运行新容器
echo "Starting new container..."
docker run -d \
    --name ai-voice-compare \
    -p 3001:3001 \
    --env-file .env \
    --restart unless-stopped \
    ai-voice-compare

echo "Container started successfully!"
echo "Access the application at http://localhost:3001"
echo ""
echo "To view logs: docker logs -f ai-voice-compare"
echo "To stop: docker stop ai-voice-compare"
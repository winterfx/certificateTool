#!/bin/bash

# 设置颜色输出
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # 重置颜色

# 保存初始目录
INITIAL_DIR=$(pwd)

# 定义错误处理函数
handle_error() {
    echo -e "${RED}错误: $1${NC}"
    cd "$INITIAL_DIR"
    exit 1
}

# 定义清理函数
cleanup() {
    echo -e "\n${YELLOW}正在关闭所有服务...${NC}"
    kill $(jobs -p) 2>/dev/null
    wait
    echo -e "${GREEN}所有服务已停止${NC}"
    cd "$INITIAL_DIR"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 检查目录是否存在
[ ! -d "frontend" ] && handle_error "前端目录不存在"
[ ! -d "backend" ] && handle_error "后端目录不存在"

# 检查并安装前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}正在安装前端依赖...${NC}"
    cd frontend || handle_error "无法进入前端目录"
    npm install || handle_error "前端依赖安装失败"
    cd "$INITIAL_DIR" || handle_error "无法返回初始目录"
fi

# 启动前端服务
echo -e "${GREEN}启动前端服务...${NC}"
cd frontend || handle_error "无法进入前端目录"
npm run dev &
cd "$INITIAL_DIR" || handle_error "无法返回初始目录"

# 启动后端服务
echo -e "${GREEN}启动后端服务...${NC}"
cd backend || handle_error "无法进入后端目录"
go run . &
cd "$INITIAL_DIR" || handle_error "无法返回初始目录"

# 等待所有后台进程
wait
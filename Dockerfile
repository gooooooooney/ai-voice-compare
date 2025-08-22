# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 运行阶段
FROM node:18-alpine

WORKDIR /app

# 安装生产依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制构建的前端文件
COPY --from=builder /app/dist ./dist

# 复制后端服务器文件
COPY server.cjs ./
COPY .env* ./

# 暴露端口
EXPOSE 3001

# 启动后端服务器（将静态文件服务集成到后端）
CMD ["node", "server.cjs"]
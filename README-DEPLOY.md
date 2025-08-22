# 部署指南

## 本地 Docker 部署

### 1. 准备环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，填入你的 API 密钥
```

### 2. 使用 Docker 运行脚本

```bash
# 给脚本执行权限
chmod +x docker-run.sh

# 运行应用
./docker-run.sh
```

### 3. 手动 Docker 命令

```bash
# 构建镜像
docker build -t ai-voice-compare .

# 运行容器（使用 --env-file 传递环境变量）
docker run -d \
  --name ai-voice-compare \
  -p 3001:3001 \
  --env-file .env \
  --restart unless-stopped \
  ai-voice-compare
```

## Coolify 部署指南

## 部署步骤

### 1. 在 Coolify 中创建新应用

1. 登录 Coolify 面板
2. 点击 "New Resource" -> "Application"
3. 选择你的 Git 仓库
4. 选择分支（通常是 main 或 master）

### 2. 配置构建设置

在 Coolify 应用设置中：

- **Build Pack**: 选择 "Dockerfile"
- **Port**: 设置为 `3001`
- **Health Check Path**: `/health`

### 3. 配置环境变量

在 Coolify 的 "Environment Variables" 部分添加以下变量：

```bash
# API Keys（必需）
VITE_OPENAI_API_KEY=你的_OpenAI_API_密钥
VITE_DEEPGRAM_API_KEY=你的_Deepgram_API_密钥
VITE_ASSEMBLYAI_API_KEY=你的_AssemblyAI_API_密钥

# 服务器配置
NODE_ENV=production
PORT=3001

# CORS 配置（替换为你的域名）
CORS_ORIGIN=https://你的域名.com
```

### 4. 部署配置

Coolify 会自动检测到项目中的 `Dockerfile` 和 `docker-compose.yml` 文件。

如果需要自定义，可以在 Coolify 中设置：
- **Custom Docker Compose**: 使用项目中的 docker-compose.yml
- **Custom Dockerfile**: 使用项目中的 Dockerfile

### 5. 启动部署

1. 保存所有配置
2. 点击 "Deploy" 按钮
3. 等待构建和部署完成

### 6. 验证部署

部署成功后：
1. 访问分配的域名
2. 检查健康检查端点：`https://你的域名.com/health`
3. 测试语音转录功能

## 故障排查

### 常见问题

1. **API 密钥错误**
   - 确保所有 API 密钥都正确设置在环境变量中
   - 检查 API 密钥是否有效且未过期

2. **CORS 错误**
   - 确保 `CORS_ORIGIN` 环境变量设置为你的前端域名
   - 包含协议（https://）

3. **构建失败**
   - 检查 Coolify 的构建日志
   - 确保所有依赖都在 package.json 中

4. **连接问题**
   - 确保端口 3001 正确暴露
   - 检查防火墙设置

## 更新部署

当需要更新应用时：
1. 推送代码到 Git 仓库
2. 在 Coolify 中点击 "Redeploy"
3. 或设置自动部署（webhook）

## 安全建议

1. 使用 HTTPS（Coolify 通常会自动配置）
2. 定期更新 API 密钥
3. 监控应用日志和性能
4. 设置适当的资源限制
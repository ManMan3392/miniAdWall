FROM node:18-bullseye-slim

WORKDIR /app

# 安装系统依赖（ffmpeg 用于视频处理）
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# 拷贝 package.json 并安装生产依赖
COPY apps/api/package.json ./
COPY apps/api/package-lock.json* ./
RUN npm ci --production --no-audit --no-fund

# 复制应用代码
COPY apps/api ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/app.js"]

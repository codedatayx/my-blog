# 杨轩的博客

在线访问：https://codedatayx.github.io/my-blog/

管理后台：https://codedatayx.github.io/my-blog/admin.html

## 项目结构

```
demo/
├── index.html              # 首页
├── post.html               # 文章详情
├── admin.html              # 管理后台
├── tags.html               # 标签页
├── about.html              # 关于我
├── static/
│   ├── css/style.css       # 主样式
│   ├── css/chat.css        # 聊天样式
│   └── js/chat.js          # 聊天前端
├── data/
│   └── posts.json          # 文章数据
├── backend/                # 后端 + 大模型
│   ├── main.py             # FastAPI 入口
│   ├── chat.py             # 聊天核心逻辑
│   ├── config.py           # 配置
│   ├── soul.md             # AI 人格定义
│   ├── .env                # API 密钥（不上传）
│   ├── docker-compose.yml  # Docker 配置
│   ├── Dockerfile
│   ├── requirements.txt
│   └── memory/             # 三层记忆系统
│       ├── redis_memory.py # Redis 短期记忆
│       ├── sqlite_memory.py# SQLite 长期记忆
│       └── compressor.py   # 对话压缩
└── .nojekyll
```

## 启动后端（记忆系统）

```bash
cd backend
docker compose up -d
```

启动后聊天功能通过后端 API 运行，支持三层记忆：
- 浏览器临时记忆（页面内）
- Redis 短期记忆（2小时）
- SQLite 长期记忆（压缩存储）

## 暴露到公网（可选）

```bash
~/bin/cloudflared tunnel --url http://localhost:8000
```

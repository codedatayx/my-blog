# 杨轩的博客

在线访问：https://codedatayx.github.io/my-blog/

管理后台：https://codedatayx.github.io/my-blog/admin.html

## 启动记忆系统（本地）

```bash
docker-compose up -d
```

启动后聊天功能通过后端 API 运行，支持三层记忆：
- 浏览器临时记忆（页面内）
- Redis 短期记忆（2小时）
- SQLite 长期记忆（压缩存储）

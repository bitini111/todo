# Todo 待办系统

一个全栈待办事项管理应用，支持拖拽看板、周报导出（Excel/CSV）、任务优先级管理。

![React](https://img.shields.io/badge/React-19-blue)
![Go](https://img.shields.io/badge/Go-1.24-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ 功能特性

- **三列看板**：待办（蓝）、进行中（橙）、已完成（绿）
- **拖拽操作**：拖拽任务卡片切换状态或调整顺序
- **任务管理**：新增、编辑、删除任务，支持标题、描述、状态、优先级
- **优先级系统**：高（红）、中（橙）、低（灰）三级优先级
- **周报导出**：支持 Excel 和 CSV 格式，可上传自定义模板
- **本周筛选**：默认只显示本周完成的的任务，可切换显示全部
- **用户认证**：JWT Token 认证，支持注册/登录
- **响应式设计**：适配桌面和移动设备

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + Vite 8 + Tailwind CSS |
| 拖拽 | @dnd-kit/core + sortable |
| 后端 | Go 1.24 + chi 路由 |
| 数据库 | MySQL 8.0 |
| 认证 | JWT (golang-jwt) |
| Excel | excelize |

## 📋 环境要求

- Go 1.24+
- MySQL 8.0+
- Node.js 18+
- npm 或 pnpm

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/todo-kanban.git
cd todo-kanban
```

### 2. 配置数据库

创建 MySQL 数据库：

```sql
CREATE DATABASE todo_db DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置后端

复制环境变量模板并修改：

```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=todo_db
JWT_SECRET=your-random-secret-key
SERVER_PORT=8080
UPLOADS_DIR=uploads
```

启动后端：

```bash
cd server
go mod download
go run main.go
```

后端将在 `http://localhost:8080` 启动。

### 4. 配置前端

```bash
cd ..
npm install
npm run dev
```

前端将在 `http://localhost:5173` 启动，并自动代理 `/api` 请求到后端。

### 5. 构建生产版本

```bash
# 前端构建
npm run build

# 后端构建
cd server
go build -o todo-server .
```

## 📖 API 接口

### 认证接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/register` | 用户注册 |
| POST | `/api/login` | 用户登录 |

### 任务接口（需认证）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/tasks` | 获取任务列表 |
| POST | `/api/tasks` | 创建任务 |
| PUT | `/api/tasks/{id}` | 更新任务 |
| DELETE | `/api/tasks/{id}` | 删除任务 |

### 报告接口（需认证）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/report` | 导出周报 |
| POST | `/api/template` | 上传模板 |
| GET | `/api/template` | 下载模板 |

### 请求示例

```bash
# 登录
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 获取任务
curl http://localhost:8080/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"

# 导出周报
curl http://localhost:8080/api/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output report.xlsx
```

## 📁 项目结构

```
todo-kanban/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   │   ├── KanbanColumn.jsx    # 看板列
│   │   ├── SortableTaskCard.jsx # 可拖拽任务卡片
│   │   ├── TaskForm.jsx        # 任务表单
│   │   ├── WeeklyReport.jsx    # 周报组件
│   │   └── ...
│   ├── hooks/              # 自定义 Hooks
│   │   └── useTodos.js       # 任务状态管理
│   ├── context/            # React Context
│   │   └── AuthContext.jsx   # 认证上下文
│   ├── api/                # API 客户端
│   │   ├── client.js         # 通用请求封装
│   │   └── tasks.js          # 任务 API
│   ├── utils/              # 工具函数
│   │   └── week.js           # 日期工具
│   ├── App.jsx             # 主应用
│   └── main.jsx            # 入口文件
├── server/                 # 后端源码
│   ├── main.go             # 入口文件
│   ├── config/             # 配置加载
│   ├── db/                 # 数据库连接与迁移
│   ├── handlers/           # HTTP 处理器
│   ├── middleware/         # 中间件（JWT、CORS）
│   ├── models/             # 数据模型
│   └── services/           # 业务逻辑（周报生成）
├── package.json            # 前端依赖
├── go.mod                  # Go 依赖
└── README.md
```

## 🔐 默认账号

项目首次启动后，可以通过注册接口创建账号：

```bash
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 🎨 自定义周报模板

系统支持上传自定义 Excel 模板，模板需要包含以下标识：

- `{{week_start}}` - 本周开始日期
- `{{week_end}}` - 本周结束日期
- `{{username}}` - 用户名
- `{{total}}` - 任务总数
- `{{completed}}` - 已完成数
- `{{rate}}` - 完成率
- `执行人` 列标题 - 用于定位数据区域

## 📝 开发指南

### 添加新功能

1. 后端新增接口：在 `server/handlers/` 添加处理器，在 `server/main.go` 注册路由
2. 前端新增组件：在 `src/components/` 创建组件，在 `src/App.jsx` 中使用

### 数据库迁移

应用启动时会自动执行以下建表操作：

```sql
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  status ENUM('pending','in_progress','completed') DEFAULT 'pending',
  priority ENUM('high','medium','low') DEFAULT 'medium',
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 License

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Go](https://go.dev/)
- [dnd-kit](https://dndkit.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [excelize](https://github.com/xuri/excelize)

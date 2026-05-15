
---

## 项目基准文档（可放入 Cursor 作为长期记忆）

### 1. 技术选型

| 层级 | 选型 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | Next.js | 15+ | App Router，TypeScript |
| UI 组件 | shadcn/ui | 最新 | 与 Next.js 15 兼容，可定制 |
| 样式 | Tailwind CSS | 4+ | 配合 shadcn/ui |
| 后端框架 | Nest.js | 10+ | TypeScript，模块化 |
| 数据库 | PostgreSQL | 16+ | 主数据库 |
| 向量扩展 | pgvector | 0.7+ | 词向量存储 |
| ORM | Prisma | 5+ | 类型安全，schema 管理 |
| 身份认证 | JWT | - | 手机号+验证码（MVP 阶段写死测试码） |
| AI 接入 | 通义千问 / DeepSeek | - | 规则引擎兜底使用 |
| 日志 | NestLogger + Winston | - | 结构化日志 |
| 测试 | Jest (后端) + Vitest (前端) | - | 单元测试 + 集成测试 |

### 2. 编程规范

**命名规范**：
- 文件名：PascalCase（组件/类） `UserService.ts`，kebab-case（工具/配置） `api-client.ts`
- 变量/函数：camelCase
- 常量：UPPER_SNAKE_CASE
- 数据库表：snake_case
- Prisma model：PascalCase，字段 camelCase

**目录结构规范**：
- 后端每个功能模块独立文件夹，内部包含 `controller`、`service`、`dto`、`entity`（Prisma 类型）
- 前端按页面组织，共用的组件放 `components/ui`，业务组件放 `components/feature`

**代码风格**：
- 使用 ESLint + Prettier
- 函数优先使用 `async/await`，避免 `.then()`
- 显式声明返回类型（函数和变量都要有 TypeScript 类型）
- 禁止使用 `any`（特殊情况用 `unknown` + 类型守卫）

**注释规范**：
- 公共函数/接口必须有 JSDoc 注释
- 复杂业务逻辑必须有行内注释说明“为什么这样写”，而不是“做了什么”

### 3. 功能模块化说明

- 每个模块独立，模块间通过 Nest.js 的 `Module` 进行依赖注入
- 模块内部结构：
  - `controller`：只处理请求/响应，调用 service
  - `service`：业务逻辑，调用 repository 和外部服务
  - `repository`：通过 Prisma 操作数据库
  - `dto`：定义请求和响应的数据结构
  - `entity`：Prisma 生成的类型，不单独写

**核心模块**：
- `auth`：登录/注册
- `user`：用户管理
- `assignment`：作业管理
- `submission`：提交批改
- `correction`：规则引擎（核心）
- `word`：词向量管理
- `llm`：大模型调用（兜底）

### 4. 数据库实体

```prisma
// prisma/schema.prisma

model User {
  id        String   @id @default(cuid())
  phone     String   @unique
  name      String?
  role      Role     @default(STUDENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  student   Student?
  teacher   Teacher?
  submissions Submission[]
  correctionLogs CorrectionLog[]
}

model Student {
  userId String @id
  grade  String // 三年级、四年级
  level  String // A1, A2
  user   User   @relation(fields: [userId], references: [id])
}

model Teacher {
  userId String @id
  school String?
  user   User   @relation(fields: [userId], references: [id])
}

model Assignment {
  id        String   @id @default(cuid())
  teacherId String
  title     String
  content   Json     // 题目列表 JSON
  deadline  DateTime
  createdAt DateTime @default(now())
  
  teacher    Teacher      @relation(fields: [teacherId], references: [userId])
  submissions Submission[]
}

model Submission {
  id           String   @id @default(cuid())
  assignmentId String
  studentId    String
  content      Json     // 学生答案
  score        Float?
  status       SubmissionStatus @default(PENDING)
  submittedAt  DateTime @default(now())
  gradedAt     DateTime?
  
  assignment Assignment @relation(fields: [assignmentId], references: [id])
  student    User       @relation(fields: [studentId], references: [id])
}

model CorrectionLog {
  id           String   @id @default(cuid())
  userId       String
  inputSentence String
  outputJson   Json     // 完整批改结果
  errorType    String?  // E01, E02...
  durationMs   Int?
  createdAt    DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
}

model GrammarRule {
  id          String   @id // E01, E02...
  name        String
  description String?
  priority    Int      @default(0)
  isActive    Boolean  @default(true)
}

model WordVector {
  id         String   @id @default(cuid())
  word       String   @unique
  pos        String   // 词性
  inflections Json     // 形态变化
  semanticTags Json    // 语义标签
  embedding  Vector?  // pgvector 类型，维度待定
  createdAt  DateTime @default(now())
}

enum Role {
  STUDENT
  TEACHER
  ADMIN
}

enum SubmissionStatus {
  PENDING
  GRADED
}
```

### 5. API 列表

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/auth/send-code | 发送验证码 | 公开 |
| POST | /api/auth/login | 登录 | 公开 |
| GET | /api/assignments | 获取作业列表 | student |
| POST | /api/assignments | 创建作业 | teacher |
| POST | /api/submissions | 提交作业 | student |
| GET | /api/submissions/:id | 获取提交详情 | student/teacher |
| POST | /api/correction/sentence | 批改单个句子 | student |
| GET | /api/words/:word | 查询单词向量 | student |
| GET | /api/stats/my-errors | 个人错题统计 | student |
| GET | /api/stats/class-errors | 班级错题统计 | teacher |

### 6. 开发流程规则（Cursor Rules）

将此文件保存为项目根目录的 `.cursorrules`，Cursor 会自动遵循：

```markdown
## 开发流程

实现任何功能时，必须严格按以下顺序执行，每步完成后等待 review 确认再进入下一步：

### Step 1: 后端实现
- 在 `backend/src/modules/[feature]/` 下创建/修改：
  - `dto/` - 定义请求和响应的 DTO 类
  - `entity/` - 确认 Prisma 类型（不需要单独写）
  - `repository/` - 封装数据库操作
  - `service/` - 业务逻辑（核心）
  - `controller/` - 路由和请求处理
- 在 `backend/src/app.module.ts` 中注册新模块
- 在 `prisma/schema.prisma` 中定义/修改模型后，运行 `npx prisma migrate dev`
- 编写单元测试（`*.spec.ts`），覆盖主要 service 方法和 controller 边界情况

### Step 2: 前端实现
- 在 `frontend/app/` 下创建页面路由
- 在 `frontend/components/` 下创建页面组件和业务组件
- 在 `frontend/lib/api/` 下创建 API 调用函数（类型安全，复用后端的 DTO 定义）
- 对接 Step 1 实现的后端接口

### Step 3: 日志输出
- 后端：Nest.js 内置 Logger，关键操作（错误、性能、外部调用）必须记录
- 前端：console.log 仅用于开发调试，生产环境需移除；错误需上报

### Step 4: 单元测试
- 后端：每个 API 至少有一个集成测试（`e2e/*.spec.ts`），覆盖成功和失败场景
- 前端：关键业务逻辑（如有）需写 Vitest 测试
```

---

### 如何使用这套文档

1. **创建 `.cursorrules`**：把上述“开发流程规则”部分复制进项目根目录的 `.cursorrules` 文件。
2. **创建 `AGENTS.md`**：把整个文档保存为 `AGENTS.md`，放在项目根目录，Cursor 或 Windsurf 的 Agent 模式会自动读取。
3. **开始对话**：在 Cursor 里告诉它：“根据 AGENTS.md 中的规范，帮我实现用户登录功能，从 Step 1 开始。”

你现在有了一个**可执行的、AI 可遵循的、你自己可审查的**开发框架。到了电脑前，第一步就是建好项目文件夹和这个文档，然后对 Cursor 说出第一个需求。
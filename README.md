**Mini Ad Wall**

本文件为项目的开发文档，包含技术选型、架构说明、关键实现细节、运行/部署与排错指导。

---

## 项目概述

- Mini Ad Wall 是一个极简版广告管理平台示例，包含后端 API（广告类型、动态表单配置、文件上传、广告 CRUD）与前端管理面板（广告列表、创建/编辑表单、素材上传等）。前端在广告更新与渲染方面做了性能优化以减少无谓重渲染。

**线上演示**： https://mini-ad-wall-web.vercel.app/

## 仓库结构

- `apps/api` — 后端服务（Node.js + Express + MySQL）
- `apps/web` — 前端应用（Vite + React + TypeScript + Ant Design + zustand + axios）

## 技术选型

- 后端：Node.js + Express + mysql2/promise
- 前端：Vite + React + TypeScript + Ant Design + zmycli（基于vite自研的脚手架，提供了项目模板与提交规范创建（husky + commitlint））
- 状态管理：zustand（轻量、selector 支持）
- 包管理：pnpm（适合 monorepo）
- 部署：pm2；CI 建议 GitHub Actions

理由：选择以开发效率、类型安全、运行性能与个人熟悉度为主。

## 架构概览

- 前后端分离：后端提供 REST API；前端消费 API 并负责页面渲染与交互。
- 动态表单：后端将表单配置以 JSON 存入 `form_config`；前端根据该配置动态生成表单并映射校验规则。
- 列表与排序：后端返回按业务公式计算的排序结果，前端可做乐观更新并通过定期或静默刷新与后端对齐。

## 关键实现说明

### 动态表单与校验

- 后端脚本：`apps/api/scripts/update_form_config.js` — 定义默认的表单配置并写入 DB。
- 前端：`apps/web/src/components/addForm/index.tsx` — `buildRules(field)` 将后端的 `validation` 元数据转换为 AntD 的 `rules`（支持数字、长度、URL、自定义正则等）。
- 由 AntD 负责展示校验；URL 校验使用 `validator` 库以兼容缺省协议输入。

### 视频上传

- 前端：上传前校验文件大小/后缀（不同广告类型限制不同），使用 `customRequest` 上传。
- 后端：`apps/api/src/routes/videos.js` 做二次校验与存储，返回 `videoId/URL`。

### 广告列表合并与性能优化

- 问题：全量替换列表会导致大量不必要的渲染。
- 解决：
  - `mergeAdLists(current, incoming)`（`apps/web/src/store/index.ts`）：以 `incoming` 为主序列，和 `current` 按 id 做浅比较关键字段（`price/heat/title/content/landing_url/video_ids/publisher`），未变化时复用 `prev` 引用，变化时使用 `next` 替换；
  - 静默刷新（`silent`）：后台周期或轮询时仅更新 `adList`，不更改分页/loading 等 UI 状态，避免闪烁；
  - 对排序敏感字段采用 `markDirty` + `runDeferredResort` 在空闲期合并并更新，避免频繁排序。

### Optimistic Update 与最终一致性

- 出价更新使用乐观更新：本地立即更新 UI，随后调用后端 API；若后端与本地数据冲突，前端通过静默重试或完整刷新恢复一致性。

## 本地开发与运行

1. 安装依赖（workspace 根）

```bash
cd /d/bytedancead/adProject
pnpm install
```

2. 启动后端

```bash
cd apps/api
pnpm install
# 请先参考下文准备 apps/api/.env
pnpm run start
```

3. 启动前端

```bash
cd apps/web
pnpm install
pnpm run dev
```

## 数据库与脚本

- 初始化 / 写入默认 `form_config`：

```bash
cd apps/api
node scripts/update_form_config.js
```

参考 `apps/api/db/schema.sql`初始化表结构。

## 简要 API 一览（示例）

- `GET /api/ad-types`
- `GET /api/form-config/:type_code`
- `POST /api/videos` (上传)
- `GET /api/ads` (列表)
- `POST/PUT/DELETE /api/ads`

## 质量与提交流程

- 代码风格：TypeScript + ESLint + Stylelint + Prettier。仓库包含 husky + lint-staged 用于 pre-commit 检查。
- 推荐使用 Conventional Commits：`feat:`, `fix:`, `docs:`, `chore:` 等。

## CI / 部署注意事项

- 切勿在 CI 部署脚本中盲目删除或覆盖远程 `.env`、`uploads` 目录。生产部署之前请先备份关键文件。
- pm2 管理生产进程，确保 `ecosystem.config.js` 中的环境变量来源正确。

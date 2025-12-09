# Mini Ad Wall

## 项目概述

- Mini Ad Wall 是一个极简版广告管理平台，包含后端 API（广告类型、动态表单配置、文件上传、广告 CRUD）与前端管理面板（广告列表、创建/编辑表单、素材上传等文档全部内容）。
  另外：
  前端在广告更新与渲染方面做了部分性能优化以减少无用重渲染。
  添加了管理员编辑广告类型的功能。

- 线上地址： https://mini-ad-wall-web.vercel.app/
- 仓库地址：https://github.com/ManMan3392/miniAdWall.git

## 仓库结构(monorepo)

- `apps/api` — 后端服务（Node.js + Express + MySQL）
- `apps/web` — 前端应用（Vite + React + TypeScript + Ant Design + zustand + axios）

## 技术选型

- 后端：Node.js + Express + mysql2/promise
- 前端：Vite + React + TypeScript + Ant Design + zmycli（基于vite自研的脚手架，提供了项目模板与提交规范创建（husky + commitlint））
- 状态管理：zustand（轻量、selector 支持）
- 包管理：pnpm（适合 monorepo）
- 部署：pm2；CI：GitHub Actions

理由：选择以开发效率、类型安全、运行性能与个人熟悉度为主。尽量选择了比较经典、高效、易用的工具，有丰富的生态圈，不会遇到小众难以解决的问题。不会因为第三方包的厚重影响项目效率，不会因为api复杂影响开发。

## 架构概览

- 前后端分离：后端提供 REST API；前端消费 API 并负责页面渲染与交互。
- 动态表单：后端将前端新建的表单配置以 JSON 存入 `form_config`；前端根据该配置动态生成表单并映射校验规则。
- 列表与排序：后端返回按业务公式计算的排序结果，前端乐观更新并延时静默刷新与后端对齐。

## 关键实现说明(文档要求内容)

### 动态表单与校验

- 后端脚本：`apps/api/scripts/update_form_config.js` — 将动态表单配置以 JSON 写入 DB（分为必须字段和扩展字段两部分，必须字段所有广告都有，扩展字段根据广告类型变化）。

- 前端渲染与初始化：根据所选广告类型（`type_code`）的 `formConfig.fields` 在运行时动态生成 `AntD Form.Item`。
  - 进入表单时：组件会先检查全局 `adTypes`（来自 `useAdStore()`），若为空会调用 `fetchAdTypes()` 拉取类型列表；选择/初始化 `typeCode` 后，组件会调用 `getFormConfig(typeCode)` 获取对应的 `formConfig`，加载时用 `Spin` 展示 loading 状态。
  - 编辑模式（`editMode`）：组件会把 `initialTypeCode`/`editData` 写入表单字段（`form.setFieldsValue`），并解析 `editData.ext_info`（兼容字符串或对象形式）与顶层字段，分别填充到表单控件、`imageFileLists`、`fileList` 与 `videoIds`，以便 Upload 控件显示已存在的素材和在提交时复用资源 id。

- 字段渲染：根据 `field.type` 动态选择组件
  - `video-upload`：使用 `handleUpload`完成文件校验与上载，后端返回 `videoId`/`url`，前端把 `videoId` 收集到 `videoIds` 上传表单时一同提交。
  - 枚举字段：渲染为 `Select` 并将 `field.enums` 映射为选项；数字字段渲染为 `Input`（或数字输入），内容字段渲染为 `TextArea` 等。

- 校验规则：
  - 根据后端校验数据数据解析为 AntD 的 `rules`
  - 校验数据包含必填，格式，提示等信息，会在用户填写错误时给予提示。

- 提交逻辑：
  表单提交时，组件会把一组约定的“顶层字段”（例如 `publisher`、`title`、`content`、`price`、`landing_url`）直接放到 `payload` 的顶层属性，其他动态字段归入 `ext_info`（对象）以保证表结构扩展性。

### 视频上传

- 前端流程
  - 触发点：上传由自定义函数处理而非默认 `action`。
  - 本地校验：根据当前组件状态调用内部规则表，对文件做以下校验：
    - 文件大小上限；
    - 后缀/格式 `.mp4`。
    - 校验不通过时：使用 `message.error` 给出友好提示并通过 `onError` 回调停止上传流程。
  - 上传打包：校验通过后把文件放入 `FormData`（字段名为 `video`），同时附带 `type_id` 等必要参数，上传到后端。
  - 上传结果处理：后端返回响应，前端在成功时：
    - 把返回的 `videoId` 推入本地 `videoIds` 状态数组；
    - 调用回调函数通知控件；
    - 把 `fileList` 中对应项的 `status` 更新为 `done`，并把 `url` 更新为 `previewUrl || url`（用于预览和回填）。
  - 失败/异常处理：使用 `onError` 回调并显示错误信息，避免把未成功的文件加入 `videoIds`。

- 后端流程
  后端对上传的文件做二次校验，校验成功后把文件存储并返回响应。

## 关键实现说明(自行拓展部分)

### 创建广告类型

（开发中发现如果要修改广告类型需要操作数据库非常麻烦，思考了一下在真实业务场景中应该是会在登陆的时候判定不同的账号，管理员账号应该是可以修改广告类型的，又考虑到登录鉴权不属于本次考核的重点，所以着重写了编辑广告类型的表单页面传递json动态渲染，做了一个简单的拦截，密码admin）

在管理面板中新增/编辑/删除广告类型。

- 前端流程（管理面板）：
  1. 打开“类型管理”弹窗，密码**admin**,点击“新增类型”填写 `type_name` 与 `type_code`；
  2. 提交时调用 `POST /api/ad-types`，成功后刷新类型列表（`GET /api/ad-types`）；
  3. 编辑使用 `PUT /api/ad-types/:id`，删除在弹窗中使用确认对话框后调用 `DELETE /api/ad-types/:id`，成功后刷新列表。

在“类型管理”界面，当用户为某广告类型添加或编辑字段时，前端会根据字段属性（字段名、类型、是否必填、占位符、枚举选项、以及校验规则等）动态渲染相应的配置控件与校验规则预览。用户确认配置后，前端会将这些字段定义序列化为标准的表单配置对象（包括 `fields` 列表与元信息如 `formTitle`），并随 `type_code` / `type_name` 一并提交到后端（通过 `POST /api/ad-types` 或 `PUT /api/ad-types/:id`）。

后端接收后会把广告类型元信息写入 `ad_type` 表，同时把表单配置写入 `form_config` 表，后续创建或编辑广告时，前端可根据 `type_code` 调用 `GET /api/form-config?type_code=...` 载入对应配置并动态生成 Ant Design 表单控件。

### 广告列表合并与性能优化

（阅读大作业附上的广告架构文档后，我认为本项目在真实广告业务场景中面对的是高并发、大数据、频繁竞价，所以尝试了一下进行性能优化。）

- 问题背景：更新后直接请求新列表全量替换前端数据会导致对每一项的 React 重渲染（尤其当列表较长或更新频繁时），并且当数据量大时等待后端返回数据再更新需要时间会让用户有等待感，同时屏幕还会在替换时“闪烁”
- 当前实现（关键点）
  - 乐观更新：
    - 当用户修改单个广告（例如改价）时，UI 立即反映新价，修改仓库数据让界面即时响应。
    - 同时将变更记录到更新队列（一个以 id 为 key 的队列），后续同 id 更新会覆盖之前的值。

  - 批量触发（150ms）：
    - 变更操作合并：在 150ms 内的多次改价被合并到同一队列，150ms 不再收到新操作则触发。

  - 批量发送改价请求：
    - 会把当前队列读出并清空，然后为每个更新调用仓库里的更新action。
    - 更新action内部再做一次局部乐观更新并标记该条需要重新排序/合并，并告知浏览器在空闲时实现排序（排序时如果数据占比较大或全部数据量比较多时使用双指针排序提高效率，否则就使用普通的排序算法）随后调用后端接口实现真正的更新。
    - 后端修改成功时返回更新的广告，前端在收到广告时把这个广告替换合并原来的广告。
    - 若后端未返回广告（代表修改可能有误），就发送全量拉取请求，以保证最终一致性。在全量拉取的结果里实现了一个合并的优化,会对比原有广告和新广告，如果在广告墙里展示的内容未发生变化就复用原来的广告减少重新渲染。

  - 成功/失败提示与回滚：
    - 单条更新成功会展示“出价更新成功”的提示。
    - 如果报错显示改价失败，如果存在这个广告就回滚这个广告，不存在就回滚整个列表。

## 本地开发与运行

1. 安装依赖（workspace 根）

```bash
cd /adProject
pnpm install
```

2. 启动后端

```bash
cd apps/api
pnpm install
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

## 简要 API

- `GET /api/ad-types`
- `GET /api/form-config?type_code=...`（可选 `config_key`）
- `POST /api/videos` (上传)
- `GET /api/ads` (列表)
- `POST/PUT/DELETE /api/ads`
  详见/apps/api/readme.md

## 质量与提交流程

- 代码风格：TypeScript + ESLint + Stylelint + Prettier。仓库包含 husky + lint-staged 用于 pre-commit 检查。
- 务必遵守 Conventional Commits规范，否则无法提交：`feat:`, `fix:`, `docs:`, `chore:` 等。

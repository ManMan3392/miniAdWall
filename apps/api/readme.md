```markdown
# mini-adwall-backend (最简实现)

说明：

- 这是一个尽可能简单、可运行的后端实现示例，满足项目计划书中的核心能力：广告类型接口、差异化表单配置接口、视频上传（FFmpeg 校验）、广告 CRUD 与基于类型的出价排序（最小变动返回）。
- 使用 Node.js + Express + MySQL（生产可替换为其他数据库）。

快速开始：

1. 安装依赖
   npm install

2. 准备 MySQL 数据库
   - 按需修改 `.env` 中的 DB\_\* 配置（未提供，可在根目录创建）
   - 执行 `db/schema.sql` 中的 SQL 来创建数据库和表，并插入示例 ad_type

3. 安装 FFmpeg
   - 本地开发环境需安装 ffmpeg 可执行文件（用于 ffprobe 与截图）。
   - 在 Linux/Mac 可通过包管理器安装：eg. `sudo apt install ffmpeg` 或 `brew install ffmpeg`

4. 启动服务
   npm start
   默认端口 3000

主要接口：

- GET /api/ad-types
- GET /api/form-config?type_code=short_video&config_key=ad_create_form
- POST /api/videos/upload (FormData, 字段名 video, 可带 type_id)
- POST /api/ads (JSON body: type_id, title, price, video_ids (array))
- GET /api/ads?page=1&size=10
- PUT /api/ads/:id/price (JSON body: price)
- PUT /api/ads/:id (部分更新)
- POST /api/ads/:id/copy
- DELETE /api/ads/:id

实现要点（简化说明）：

- 视频上传先保存到本地并用 ffprobe 获取时长/分辨率，依据简单类型规则做基本校验（放在代码内的 rulesByType）。
- 创建广告时假定前端先上传视频并传回 video ids（也可扩展为 multipart 创建并同时上传）。
- 出价更新后仅基于类型排序规则重新查询同类型广告列表并对比旧/新索引，返回 minimal movement（受影响的相邻广告 id）。
- 表单配置从 form_config 表读取；若无配置，返回一个最小默认配置。

扩展与生产注意：

- 推荐在 form_config 存储更完整的 JSON 配置并使用 AJV 在后端做严格验证（示例中未完整实现）。
- 生产环境请把媒体上传替换为对象存储（OSS/COS/S3），并实现签名访问与生命周期管理。
- 视频大文件建议实现分片/断点上传（示例中为说明保留点）。
- 增加鉴权、更完善的错误/日志、事务处理、单元/集成测试。
```

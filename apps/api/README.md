# 后端接口文档

统一结构如下：

- 成功示例：`{ code: 200, message: 'OK', data: ... }`
- 失败示例：`{ code: 4xx/5xx, message: '错误信息' }`

---

## 广告列表 & 单条

- GET /api/ads
  - 描述：分页查询广告列表
  - Query 参数：`page` (number, 可选, 默认 1), `size` (number, 可选, 默认 5)
  - 返回 data 示例：
    {
    list: [ { id, type_id, title, content, price, heat, video_ids, video_urls, ext_info, created_at, updated_at, ... } ],
    total: number,
    page: number,
    size: number
    }

- GET /api/ads/:id
  - 描述：获取单条广告的权威数据
  - Path 参数：`id`（广告 id）
  - 返回 data 示例：单个广告对象

- POST /api/ads
  - 描述：创建广告
  - 请求体（JSON）示例：
    {
    type_id: number,
    publisher: string,
    title: string,
    content: string,
    heat: number,
    price: number,
    landing_url: string,
    video_ids?: string | string[],
    ext_info?: any
    }
  - 返回：创建后的广告对象（建议返回完整实体以便前端直接合并）

- PUT /api/ads/:id
  - 描述：更新广告（部分字段）
  - 请求体（JSON）：允许传入要更新的字段（price、title、ext_info 等）
  - 返回：建议返回更新后的完整广告对象（若仅返回部分字段，前端需要做单条 GET 回补）

- DELETE /api/ads/:id
  - 描述：删除广告

- POST /api/ads/:id/increment-heat
  - 描述：增加广告热度（示例专用接口）

---

## 类型与表单配置

- GET /api/ad-types
  - 描述：获取广告类型列表

- GET /api/form-config
  - 描述：获取动态表单配置
  - Query 参数：`type_code` (string), `config_key` (string, 可选, 默认 `ad_create_form`)

### 广告类型管理（ad-types）

- POST /api/ad-types
  - 描述：创建广告类型
  - 请求体（JSON）：`{ type_code: string, type_name: string }`
  - 返回示例：`{ code: 200, message: '创建成功', data: { id, type_code, type_name } }`
  - 常见错误：`400` 参数不完整、`400` 类型编码已存在（重复键）

- PUT /api/ad-types/:id
  - 描述：更新广告类型
  - Path 参数：`id`（类型 id）
  - 请求体（JSON）：`{ type_code: string, type_name: string }`
  - 返回示例：`{ code: 200, message: '更新成功' }`

- DELETE /api/ad-types/:id
  - 描述：删除广告类型（为硬删除）。此操作同时清理 `form_config` 表中关联的配置。
  - Path 参数：`id`（类型 id）
  - 返回示例：`{ code: 200, message: '删除成功' }` 或 `404`（类型不存在）

### 表单配置（form-config）

- POST /api/form-config
  - 描述：为指定 `type_code` 写入表单配置（会以 `type_id` 关联并写入 `form_config` 表）
  - 请求体（JSON）示例：
    ```json
    {
      "type_code": "splash",
      "config_key": "ad_create_form",
      "config_value": {
        "formTitle": "创建开屏广告",
        "fields": [{ "name": "title", "type": "input", "required": true }]
      }
    }
    ```
  - 注意：后端会把 `config_value` 以字符串形式保存（如果传入对象，会被序列化）。
  - 返回示例：`{ code: 200, message: 'Configuration updated successfully' }`

---

## 视频上传

- POST /api/videos/upload
  - 描述：上传视频文件，使用 `multipart/form-data`
  - 常用字段：`file`（文件）
  - 返回 data 示例：
    {
    videoId: string, // 后端记录的 id
    url: string, // 可直接播放的地址
    previewUrl?: string // 可选的预览图地址
    }
  - 前端注意：上传成功后应使用返回的 `videoId` 作为后端记录标识，fileList 中可用 `uid` ↔ `videoId` 建立映射以便删除/管理。

---

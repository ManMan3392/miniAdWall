export interface FormField {
  name: string;
  type: string; // e.g. 'input' | 'video-upload' | 'select' | 'number' | ...
  label?: string;
  placeholder?: string;
  required?: boolean;
  // 可扩展：枚举/范围等
  enums?: Array<string | number>;
  min?: number;
  max?: number;
}

export interface FormConfig {
  formTitle?: string;
  fields?: FormField[];
}

export interface CreateAdInput {
  type_id: number;
  publisher: string;
  title: string;
  content: string;
  heat: number;
  price: number;
  landing_url: string;
  video_ids?: string | string[];
  ext_info?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isEmpty(val: any) {
  return (
    val === undefined ||
    val === null ||
    (typeof val === 'string' && val.trim() === '')
  );
}

function normalizeVideoIds(video_ids?: string | string[]): string[] {
  if (Array.isArray(video_ids)) return video_ids.filter(Boolean);
  if (typeof video_ids === 'string') {
    const list = video_ids
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return list;
  }
  return [];
}

export function validateCreateAdPayload(
  data: CreateAdInput,
  formConfig?: FormConfig,
): ValidationResult {
  const errors: string[] = [];

  // 基础字段校验（与后端一致）
  const baseRequired: Array<keyof CreateAdInput> = [
    'publisher',
    'title',
    'content',
    'heat',
    'price',
    'landing_url',
    'type_id',
  ];
  baseRequired.forEach((k) => {
    const v = data[k];
    if (isEmpty(v as any)) errors.push(`${String(k)} 为必填`);
  });

  // 简单数值校验（可按需增强）
  if (typeof data.heat !== 'number') errors.push('heat 必须为数字');
  if (typeof data.price !== 'number') errors.push('price 必须为数字');

  // URL 粗略校验（可替换更严格方案）
  if (!isEmpty(data.landing_url)) {
    try {
      new URL(data.landing_url);
    } catch {
      errors.push('landing_url 不是有效的 URL');
    }
  }

  // 表单配置驱动的校验
  const fields = formConfig?.fields ?? [];
  const ext = data.ext_info ?? {};

  fields.forEach((f) => {
    if (!f) return;
    if (f.required) {
      const fromExt = Object.prototype.hasOwnProperty.call(ext, f.name)
        ? ext[f.name]
        : undefined;
      const fromBody = (data as any)[f.name];
      const value = fromExt !== undefined ? fromExt : fromBody;

      if (f.type === 'video-upload') {
        const vids = normalizeVideoIds(data.video_ids);
        if (!vids.length)
          errors.push(`字段 ${f.name} 必填（至少上传一个视频）`);
      } else if (isEmpty(value)) {
        errors.push(`字段 ${f.name} 为必填`);
      }

      // 选填扩展：枚举/范围
      if (!isEmpty(value)) {
        if (
          Array.isArray(f.enums) &&
          f.enums.length &&
          !f.enums.includes(value)
        ) {
          errors.push(`字段 ${f.name} 的值不在允许范围内`);
        }
        if (typeof value === 'number') {
          if (typeof f.min === 'number' && value < f.min)
            errors.push(`字段 ${f.name} 不得小于 ${f.min}`);
          if (typeof f.max === 'number' && value > f.max)
            errors.push(`字段 ${f.name} 不得大于 ${f.max}`);
        }
      }
    } else if (f.type === 'video-upload') {
      // 如果存在 video-upload 字段，即便未标 required，做一次兜底：
      const vids = normalizeVideoIds(data.video_ids);
      if (!vids.length) errors.push('请上传至少一个视频（与表单配置一致）');
    }
  });

  return { valid: errors.length === 0, errors };
}

export function assertCreateAdValid(
  data: CreateAdInput,
  formConfig?: FormConfig,
): void {
  const ret = validateCreateAdPayload(data, formConfig);
  if (!ret.valid) {
    throw new Error(ret.errors.join('; '));
  }
}

import isURL from 'validator/lib/isURL';

export const buildRules = (field: any) => {
  const rulesArr: any[] = [];
  if (field.required) {
    rulesArr.push({
      required: true,
      message: `${field.label || field.name}为必填项`,
    });
  }
  const v = field.validation || {};
  if (v.type === 'number') {
    if (v.required && !rulesArr.some((r) => r && r.required)) {
      rulesArr.push({
        required: true,
        message: v.message || `${field.label || field.name}为必填项`,
      });
    }
    rulesArr.push({
      validator: (_: any, value: any) => {
        if (value === null || typeof value === 'undefined' || value === '') {
          if (v.required)
            return Promise.reject(
              new Error(v.message || `${field.label || field.name}为必填项`),
            );
          return Promise.resolve();
        }
        const num = typeof value === 'number' ? value : Number(value);
        if (!Number.isNaN(num)) {
          if (typeof v.min !== 'undefined' && num < v.min) {
            return Promise.reject(
              new Error(
                v.message || `${field.label || field.name}最小为 ${v.min}`,
              ),
            );
          }
          if (typeof v.max !== 'undefined' && num > v.max) {
            return Promise.reject(
              new Error(
                v.message || `${field.label || field.name}最大为 ${v.max}`,
              ),
            );
          }
          return Promise.resolve();
        }
        return Promise.reject(
          new Error(v.message || `${field.label || field.name}必须为数字`),
        );
      },
    });
  }
  if (v.max && v.type !== 'number') {
    rulesArr.push({
      max: v.max,
      message: `${field.label || field.name}最多 ${v.max} 个字`,
    });
  }
  if (v.min && v.type !== 'number') {
    rulesArr.push({
      min: v.min,
      message: `${field.label || field.name}至少 ${v.min} 个字`,
    });
  }
  if (v.type === 'url' || v.pattern === 'url') {
    rulesArr.push({
      validator: (_: any, value: any) => {
        if (!value) return Promise.resolve();
        const s = String(value).trim();

        try {
          const ok = isURL(s, {
            protocols: ['http', 'https'],
            require_protocol: true,
          });
          if (ok) return Promise.resolve();
          return Promise.reject(new Error('请输入合法的 URL'));
        } catch {
          return Promise.reject(new Error('请输入合法的 URL'));
        }
      },
    });
  } else if (v.pattern) {
    try {
      const re = new RegExp(v.pattern);
      rulesArr.push({
        pattern: re,
        message: v.message || `${field.label || field.name}格式不正确`,
      });
    } catch {
      // ignore bad pattern
    }
  }
  return rulesArr;
};

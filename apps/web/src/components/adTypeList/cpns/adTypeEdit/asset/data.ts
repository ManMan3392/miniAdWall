import type { FieldConfig } from './type';

export const DEFAULT_FIELDS: FieldConfig[] = [
  {
    name: 'publisher',
    type: 'input',
    label: '发布者',
    required: true,
    placeholder: '请输入发布者名称',
  },
  {
    name: 'title',
    type: 'input',
    label: '广告标题',
    required: true,
    placeholder: '请输入广告标题',
    validation: { max: 30 },
  },
  {
    name: 'content',
    type: 'input',
    label: '广告内容',
    required: true,
    placeholder: '请输入广告详细内容',
    validation: { max: 500 },
  },
  {
    name: 'landing_url',
    type: 'input',
    label: '落地页URL',
    required: true,
    placeholder: '请输入落地页链接',
    validation: { type: 'url' },
  },
  {
    name: 'price',
    type: 'number',
    label: '初始出价（元/千次曝光）',
    required: true,
    placeholder: '请输入出价',
    validation: {
      required: true,
      type: 'number',
      message: '初始出价必须为数字',
      min: 0.5,
    },
  },
];

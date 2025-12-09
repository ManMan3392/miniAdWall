import { Form, Input, Select } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import type { ReactNode, FC } from 'react';
import { memo } from 'react';

interface Iprops {
  children?: ReactNode;
  f: {
    name: string;
    label?: string;
    required?: boolean;
    placeholder?: string;
    type?: string;
    validation?: {
      max?: number;
      type?: string;
    };
    enums?: any[];
  };
  buildRules: (f: Iprops['f']) => any[];
}
const FormItems: FC<Iprops> = ({ f, buildRules }) => {
  return (
    <Form.Item
      key={f.name}
      label={
        <>
          {f.label || f.name}
          {f.required && (
            <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
          )}
        </>
      }
      name={f.name}
      rules={buildRules(f)}
      validateFirst
    >
      {Array.isArray((f as any).enums) && (f as any).enums.length ? (
        <Select
          placeholder={f.placeholder || `请选择${f.label || f.name}`}
          options={(f as any).enums.map((v: any) => ({
            label: String(v),
            value: v,
          }))}
        />
      ) : f.type === 'number' ? (
        <Input
          style={{ width: '100%' }}
          placeholder={f.placeholder || `请输入${f.label || f.name}`}
        />
      ) : f.name === 'content' ? (
        <TextArea
          rows={4}
          placeholder={f.placeholder || `请输入${f.label || f.name}`}
          maxLength={
            (f as any).validation?.maxLength ?? (f as any).validation?.max
          }
          showCount={
            !!((f as any).validation?.maxLength ?? (f as any).validation?.max)
          }
        />
      ) : (
        <Input
          placeholder={f.placeholder || `请输入${f.label || f.name}`}
          type={(f as any).validation?.type === 'url' ? 'text' : undefined}
        />
      )}
    </Form.Item>
  );
};
export default memo(FormItems);

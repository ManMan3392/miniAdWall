import { Form, Select } from 'antd';
import type { ReactNode, FC } from 'react';
import { memo } from 'react';

interface Iprops {
  children?: ReactNode;
  adTypes?: { type_name: string; type_code: string }[];
  initialTypeCode?: string;
  setTypeCode: (code: string) => void;
}
const FormHeader: FC<Iprops> = ({ adTypes, initialTypeCode, setTypeCode }) => {
  return (
    <Form.Item
      label="广告类型"
      name="type_code"
      rules={[{ required: true, message: '请选择广告类型' }]}
      validateFirst
    >
      <Select
        placeholder="请选择类型"
        options={(adTypes || []).map((t) => ({
          label: t.type_name,
          value: t.type_code,
        }))}
        onChange={(v) => setTypeCode(v)}
        allowClear
        disabled={!!initialTypeCode}
      />
    </Form.Item>
  );
};
export default memo(FormHeader);

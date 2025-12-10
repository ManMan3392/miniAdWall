import { Form, Input } from 'antd';
import type { ReactNode, FC } from 'react';
import { memo } from 'react';

interface Iprops {
  children?: ReactNode;
}
const SpecialItems: FC<Iprops> = () => {
  return (
    <>
      <Form.Item
        noStyle
        shouldUpdate={(prev, current) => prev.type !== current.type}
      >
        {({ getFieldValue }) => {
          const t = getFieldValue('type');
          const uploadTypes = ['video-upload', 'image-upload', 'file-upload'];
          const hidePlaceholder = uploadTypes.includes(t);
          return hidePlaceholder ? null : (
            <Form.Item name="placeholder" label="占位提示 (Placeholder)">
              <Input placeholder="请输入..." />
            </Form.Item>
          );
        }}
      </Form.Item>

      <Form.Item
        noStyle
        shouldUpdate={(prev, current) => prev.type !== current.type}
      >
        {({ getFieldValue }) =>
          getFieldValue('type') === 'select' ? (
            <Form.Item
              name="enums"
              label="选项列表 (逗号分隔)"
              rules={[{ required: true, message: '请输入选项' }]}
            >
              <Input placeholder="例如: App下载, 表单提交, 商品购买" />
            </Form.Item>
          ) : null
        }
      </Form.Item>
    </>
  );
};
export default memo(SpecialItems);

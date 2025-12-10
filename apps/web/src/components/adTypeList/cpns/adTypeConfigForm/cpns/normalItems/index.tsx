import { Form, Input, Select, Space, Switch } from 'antd';
import type { ReactNode, FC } from 'react';
import { memo } from 'react';

interface Iprops {
  children?: ReactNode;
}
const NormalItems: FC<Iprops> = () => {
  return (
    <>
      <Space style={{ display: 'flex', marginBottom: 8 }} align="start">
        <Form.Item
          name="name"
          label="字段名 (Key)"
          rules={[{ required: true, message: '请输入字段名' }]}
          style={{ width: 260 }}
        >
          <Input placeholder="例如: price" />
        </Form.Item>
        <Form.Item
          name="label"
          label="显示名 (Label)"
          rules={[{ required: true, message: '请输入显示名' }]}
          style={{ width: 260 }}
        >
          <Input placeholder="例如: 初始出价" />
        </Form.Item>
      </Space>

      <Space style={{ display: 'flex', marginBottom: 8 }} align="start">
        <Form.Item
          name="type"
          label="字段类型"
          rules={[{ required: true }]}
          style={{ width: 260 }}
          initialValue="input"
        >
          <Select>
            <Select.Option value="input">文本输入 (input)</Select.Option>
            <Select.Option value="number">数字输入 (number)</Select.Option>
            <Select.Option value="select">下拉选择 (select)</Select.Option>
            <Select.Option value="video-upload">
              视频上传 (video-upload)
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="required"
          label="是否必填"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch />
        </Form.Item>
      </Space>
    </>
  );
};
export default memo(NormalItems);

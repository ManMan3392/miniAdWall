import { Form, Input, InputNumber, Space } from 'antd';
import type { ReactNode, FC } from 'react';
import { memo } from 'react';

interface Iprops {
  children?: ReactNode;
}
const CheckRules: FC<Iprops> = () => {
  return (
    <Form.Item
      noStyle
      shouldUpdate={(prev, current) => prev.type !== current.type}
    >
      {({ getFieldValue }) => {
        const t = getFieldValue('type');
        const forbiddenValidationTypes = [
          'video-upload',
          'image-upload',
          'file-upload',
          'select',
        ];
        const isForbidden = forbiddenValidationTypes.includes(t);
        if (isForbidden) {
          return (
            <div style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
              上传或下拉类型不支持配置校验规则
            </div>
          );
        }

        return (
          <Form.Item label="验证规则 (Validation)" style={{ marginBottom: 0 }}>
            <Space align="start" wrap>
              {t === 'input' ? (
                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item
                    name="minLength"
                    label="最小长度"
                    style={{ width: 220 }}
                  >
                    <InputNumber
                      placeholder="Min length"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="maxLength"
                    label="最大长度"
                    style={{ width: 220 }}
                  >
                    <InputNumber
                      placeholder="Max length"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </div>
              ) : null}

              {t === 'number' ? (
                <>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Form.Item
                      name="minValue"
                      label="最小值 (数值范围)"
                      style={{ width: 220 }}
                    >
                      <InputNumber
                        placeholder="Min value"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item
                      name="maxValue"
                      label="最大值 (数值范围)"
                      style={{ width: 220 }}
                    >
                      <InputNumber
                        placeholder="Max value"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <Form.Item
                      name="minLength"
                      label="最小长度 (位数)"
                      style={{ width: 220 }}
                    >
                      <InputNumber
                        placeholder="Min digits"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item
                      name="maxLength"
                      label="最大长度 (位数)"
                      style={{ width: 220 }}
                    >
                      <InputNumber
                        placeholder="Max digits"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </div>
                </>
              ) : null}
            </Space>
            <Form.Item name="pattern" label="正则校验 (Pattern)">
              <Input placeholder="例如: ^[a-zA-Z0-9]+$" />
            </Form.Item>
            <Form.Item name="validationMessage" label="错误提示信息">
              <Input placeholder="例如: 初始出价必须为数字" />
            </Form.Item>
          </Form.Item>
        );
      }}
    </Form.Item>
  );
};
export default memo(CheckRules);

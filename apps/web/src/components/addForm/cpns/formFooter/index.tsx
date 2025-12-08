import { Button, Form } from 'antd';
import type { ReactNode, FC } from 'react';
import { memo } from 'react';

interface Iprops {
  children?: ReactNode;
  onCancel?: () => void;
  submitting: boolean;
  editMode: boolean;
}
const FormFooter: FC<Iprops> = ({ onCancel, submitting, editMode }) => {
  return (
    <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        {onCancel && (
          <Button onClick={onCancel} disabled={submitting}>
            取消
          </Button>
        )}
        <Button type="primary" htmlType="submit" loading={submitting}>
          {editMode ? '更新广告' : '创建广告'}
        </Button>
      </div>
    </Form.Item>
  );
};
export default memo(FormFooter);

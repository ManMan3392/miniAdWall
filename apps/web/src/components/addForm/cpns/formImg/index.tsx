import { PlusOutlined } from '@ant-design/icons';
import { Form, Upload, type UploadFile } from 'antd';
import type { ReactNode, FC } from 'react';
import { memo } from 'react';

interface Iprops {
  children?: ReactNode;
  buildRules: (field: any) => any[];
  imageFileLists: Record<string, UploadFile[]>;
  setImageFileLists: React.Dispatch<
    React.SetStateAction<Record<string, UploadFile[]>>
  >;
  f: any;
}
const FormImg: FC<Iprops> = ({
  buildRules,
  imageFileLists,
  setImageFileLists,
  f,
}) => {
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
      <Upload
        listType="picture-card"
        fileList={imageFileLists[f.name] || []}
        onChange={({ fileList }) =>
          setImageFileLists((prev) => ({
            ...prev,
            [f.name]: fileList,
          }))
        }
        accept="image/*"
        multiple={false}
        action={(f as any).uploadUrl || undefined}
        name="file"
      >
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传</div>
        </div>
      </Upload>
    </Form.Item>
  );
};
export default memo(FormImg);

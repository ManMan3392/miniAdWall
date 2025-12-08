import { uploadVideo } from '@/service/ad';
import { PlusOutlined } from '@ant-design/icons';
import { Form, message, Upload, type UploadFile } from 'antd';
import type { ReactNode, FC } from 'react';
import { memo } from 'react';

interface Iprops {
  children?: ReactNode;
  dynamicFields: any[];
  videoIds: string[];
  setVideoIds: any;
  fileList: UploadFile[];
  setFileList: any;
  typeCode?: string;
  typeId?: number;
}
const FormVideo: FC<Iprops> = ({
  dynamicFields,
  videoIds,
  setVideoIds,
  fileList,
  setFileList,
  typeCode,
  typeId,
}) => {
  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      const getVideoRules = (code?: string) => {
        return {
          short_video: { maxSize: 100 * 1024 * 1024, allowed: ['.mp4'] },
          brand: { maxSize: 200 * 1024 * 1024, allowed: ['.mp4', '.avi'] },
          effect: { maxSize: 150 * 1024 * 1024, allowed: ['.mp4'] },
        }[code || ''];
      };

      const rules = getVideoRules(typeCode);
      if (rules) {
        if (file.size > rules.maxSize) {
          const mb = Math.round(rules.maxSize / (1024 * 1024));
          const errMsg = `文件过大，最大允许 ${mb} MB`;
          message.error(errMsg);
          onError?.(new Error(errMsg));
          return;
        }
        const ext =
          (file.name &&
            file.name.includes('.') &&
            file.name.slice(file.name.lastIndexOf('.')).toLowerCase()) ||
          '';
        if (!rules.allowed.includes(ext)) {
          const errMsg = `不支持的文件格式 ${ext}`;
          message.error(errMsg);
          onError?.(new Error(errMsg));
          return;
        }
      }

      const fd = new FormData();
      fd.append('video', file);
      fd.append('type_id', String(typeId));
      const resp = await uploadVideo(fd);
      if (resp.code === 200) {
        const { videoId, url, previewUrl } = resp.data || {};
        setVideoIds((prev: string[]) => [...prev, videoId as string]);
        onSuccess?.(resp, file);
        setFileList((prev: any[]) =>
          prev.map((f) =>
            f.uid === file.uid
              ? { ...f, status: 'done', url: previewUrl || url }
              : f,
          ),
        );
      } else {
        onError?.(new Error(resp.message || '上传失败'));
      }
    } catch (e: any) {
      onError?.(e);
    }
  };

  const handleRemove = (file: UploadFile) => {
    const idx = fileList.findIndex((f) => f.uid === file.uid);
    if (idx >= 0) {
      setVideoIds((prev: any[]) => prev.filter((_, i) => i !== idx));
      setFileList((prev: any[]) => prev.filter((_, i) => i !== idx));
    }
    return true;
  };
  return (
    <Form.Item
      label={
        <>
          上传视频
          {dynamicFields.find((f) => f.type === 'video-upload')?.required && (
            <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
          )}
        </>
      }
      required={dynamicFields.find((f) => f.type === 'video-upload')?.required}
      validateStatus={
        videoIds.length === 0 &&
        dynamicFields.find((f) => f.type === 'video-upload')?.required
          ? 'error'
          : ''
      }
      help={
        videoIds.length === 0 &&
        dynamicFields.find((f) => f.type === 'video-upload')?.required ? (
          <span style={{ color: '#ff4d4f' }}>请上传至少一个视频</span>
        ) : (
          ''
        )
      }
    >
      <Upload
        listType="picture-card"
        customRequest={handleUpload}
        fileList={fileList}
        onChange={({ fileList }) => setFileList(fileList)}
        onRemove={handleRemove}
      >
        <button
          style={{
            color: 'inherit',
            cursor: 'inherit',
            border: 0,
            background: 'none',
          }}
          type="button"
        >
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传</div>
        </button>
      </Upload>
    </Form.Item>
  );
};
export default memo(FormVideo);

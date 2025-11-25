import { PlusOutlined } from '@ant-design/icons';
import {
  Form,
  Upload,
  Input,
  InputNumber,
  Select,
  Button,
  message,
  Spin,
} from 'antd';
const { TextArea } = Input;
import type { ReactNode, FC } from 'react';
import { memo, useEffect, useMemo, useState } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';
import { useAdStore, type Ad } from '@/store';
import styles from './style.module.less';
import {
  getFormConfig,
  uploadVideo,
  createAd,
  updateAd,
  type FormConfig,
} from '@/service/ad';

interface AddFormProps {
  children?: ReactNode;
  initialTypeCode: string;
  visible?: boolean;
  onCancel: () => void;
  onCreated: () => void;
  editMode?: boolean;
  editData?: Ad;
}
const AddForm: FC<AddFormProps> = ({
  initialTypeCode,
  visible = true,
  onCancel,
  onCreated,
  editMode = false,
  editData,
}) => {
  const [form] = Form.useForm();
  const { adTypes, fetchAdTypes } = useAdStore();
  const [typeCode, setTypeCode] = useState<string | undefined>(initialTypeCode);
  const [typeId, setTypeId] = useState<number | undefined>(undefined);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [loadingCfg, setLoadingCfg] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [videoIds, setVideoIds] = useState<string[]>([]);

  useEffect(() => {
    if (!adTypes || adTypes.length === 0) {
      fetchAdTypes();
    }
  }, [adTypes, fetchAdTypes]);

  useEffect(() => {
    if (!typeCode) {
      setTypeId(undefined);
      setFormConfig(null);
      return;
    }
    const matched = adTypes?.find((t) => t.type_code === typeCode);
    setTypeId(matched?.id);
    (async () => {
      setLoadingCfg(true);
      try {
        const resp = await getFormConfig(typeCode);
        if (resp.code === 200) {
          setFormConfig(resp.data || null);
        } else {
          setFormConfig(null);
        }
      } catch {
        setFormConfig(null);
      } finally {
        setLoadingCfg(false);
      }
    })();
  }, [typeCode, adTypes]);

  useEffect(() => {
    setTypeCode(initialTypeCode);
    form.setFieldsValue({ type_code: initialTypeCode });

    if (editData) {
      const formValues: any = {
        type_code: editData.type_code || initialTypeCode,
      };

      if (formConfig?.fields) {
        formConfig.fields.forEach((field) => {
          if (
            field.type !== 'video-upload' &&
            editData[field.name as keyof Ad] !== undefined
          ) {
            formValues[field.name] = editData[field.name as keyof Ad];
          }
        });
      }

      form.setFieldsValue(formValues);

      setTypeCode(formValues.type_code);

      if (editData.video_urls && editData.video_urls.length > 0) {
        const videoFiles: UploadFile[] = editData.video_urls.map(
          (url, index) => ({
            uid: `-${index}`,
            name: `video_${index}.mp4`,
            status: 'done',
            url: `http://localhost:3000${url}`,
          }),
        );
        setFileList(videoFiles);

        if (editData.video_ids && typeof editData.video_ids === 'string') {
          const ids = editData.video_ids
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          setVideoIds(ids);
        }
      }
    }
  }, [initialTypeCode, form, editData, formConfig]);

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      const fd = new FormData();
      fd.append('video', file);
      fd.append('type_id', String(typeId));
      const resp = await uploadVideo(fd);
      if (resp.code === 200) {
        const { videoId, url, previewUrl } = resp.data || {};
        setVideoIds((prev) => [...prev, videoId]);
        onSuccess?.(resp, file);
        setFileList((prev) =>
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
      setVideoIds((prev) => prev.filter((_, i) => i !== idx));
      setFileList((prev) => prev.filter((_, i) => i !== idx));
    }
    return true;
  };

  const dynamicFields = useMemo(() => formConfig?.fields || [], [formConfig]);

  const onFinish = async (values: any) => {
    if (!editMode) {
      const videoField = dynamicFields.find((f) => f.type === 'video-upload');
      if (videoField?.required && videoIds.length === 0) {
        message.error('请先上传视频');
        return;
      }
    }

    // 完全基于后端 formConfig 动态构建 payload
    const payload: any = {
      type_id: typeId!,
      video_ids: videoIds,
    };

    // 遍历 formConfig.fields，将表单值映射到 payload
    dynamicFields.forEach((field) => {
      if (field.type === 'video-upload') {
        // video-upload 已通过 videoIds 处理
        return;
      }
      const value = values[field.name];
      if (value !== undefined && value !== null && value !== '') {
        payload[field.name] = field.type === 'number' ? Number(value) : value;
      }
    });

    console.log('表单提交 - 最终payload:', payload);

    setSubmitting(true);
    try {
      let resp;
      if (editMode && editData) {
        // 编辑模式
        resp = await updateAd(editData.id, payload);
      } else {
        // 创建或复制模式
        resp = await createAd(payload);
      }

      console.log('操作响应:', resp);
      if (resp.code === 200) {
        message.success(editMode ? '更新成功' : '创建成功');
        form.resetFields();
        setVideoIds([]);
        setFileList([]);
        onCreated(); // 通知父组件操作成功，触发列表刷新和模态框关闭
      } else {
        message.error(resp.message || (editMode ? '更新失败' : '创建失败'));
      }
    } catch (e: any) {
      console.error('操作错误:', e);
      message.error(e.message || (editMode ? '更新失败' : '创建失败'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;
  return (
    <div className={styles['form-container']}>
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        onFinish={onFinish}
      >
        <Form.Item
          label="广告类型"
          name="type_code"
          rules={[{ required: true, message: '请选择广告类型' }]}
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

        {loadingCfg ? (
          <Spin />
        ) : (
          <>
            {dynamicFields
              .filter((f) => f.type !== 'video-upload')
              .map((f) => (
                <Form.Item
                  key={f.name}
                  label={
                    <>
                      {f.label || f.name}
                      {f.required && (
                        <span style={{ color: '#ff4d4f', marginLeft: 4 }}>
                          *
                        </span>
                      )}
                    </>
                  }
                  name={f.name}
                  rules={
                    f.required
                      ? [
                          {
                            required: true,
                            message: `${f.label || f.name}为必填项`,
                          },
                        ]
                      : []
                  }
                >
                  {Array.isArray((f as any).enums) &&
                  (f as any).enums.length ? (
                    <Select
                      placeholder={
                        f.placeholder || `请选择${f.label || f.name}`
                      }
                      options={(f as any).enums.map((v: any) => ({
                        label: String(v),
                        value: v,
                      }))}
                    />
                  ) : f.type === 'number' ? (
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder={
                        f.placeholder || `请输入${f.label || f.name}`
                      }
                    />
                  ) : f.name === 'content' ? (
                    <TextArea
                      rows={4}
                      placeholder={
                        f.placeholder || `请输入${f.label || f.name}`
                      }
                    />
                  ) : (
                    <Input
                      placeholder={
                        f.placeholder || `请输入${f.label || f.name}`
                      }
                    />
                  )}
                </Form.Item>
              ))}

            {dynamicFields.some((f) => f.type === 'video-upload') && (
              <Form.Item
                label={
                  <>
                    上传视频
                    {dynamicFields.find((f) => f.type === 'video-upload')
                      ?.required && (
                      <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                    )}
                  </>
                }
                required={
                  dynamicFields.find((f) => f.type === 'video-upload')?.required
                }
                validateStatus={
                  videoIds.length === 0 &&
                  dynamicFields.find((f) => f.type === 'video-upload')?.required
                    ? 'error'
                    : ''
                }
                help={
                  videoIds.length === 0 &&
                  dynamicFields.find((f) => f.type === 'video-upload')
                    ?.required ? (
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
            )}

            <Form.Item wrapperCol={{ offset: 4, span: 20 }}>
              <div
                style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}
              >
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
          </>
        )}
      </Form>
    </div>
  );
};
export default memo(AddForm);

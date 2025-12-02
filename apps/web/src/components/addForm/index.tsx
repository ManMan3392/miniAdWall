import { PlusOutlined } from '@ant-design/icons';
import { Form, Upload, Input, Select, Button, message, Spin } from 'antd';
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
  type FormConfig,
} from '@/service/ad';
import { buildRules } from './utils/buildRules';

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
  const { adTypes, fetchAdTypes, updateAdData } = useAdStore();
  const [typeCode, setTypeCode] = useState<string | undefined>(initialTypeCode);
  const [typeId, setTypeId] = useState<number | undefined>(undefined);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [loadingCfg, setLoadingCfg] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageFileLists, setImageFileLists] = useState<
    Record<string, UploadFile[]>
  >({});
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
      setTypeId(editData.type_id);
      const formValues: any = {
        type_code: editData.type_code || initialTypeCode,
      };

      let extObj: any = {};
      try {
        if (editData.ext_info) {
          extObj =
            typeof editData.ext_info === 'string'
              ? JSON.parse(editData.ext_info)
              : editData.ext_info;
        }
      } catch {
        extObj = {};
      }

      if (formConfig?.fields) {
        formConfig.fields.forEach((field) => {
          if (field.type === 'video-upload') return;

          const topVal = (editData as any)[field.name];
          if (typeof topVal !== 'undefined') {
            formValues[field.name] = topVal;
            return;
          }
          if (Object.prototype.hasOwnProperty.call(extObj, field.name)) {
            formValues[field.name] = extObj[field.name];
          }
        });
      }

      form.setFieldsValue(formValues);

      setTypeCode(formValues.type_code);

      if (editData.video_urls && editData.video_urls.length > 0) {
        const videoFiles: UploadFile[] = editData.video_urls.map(
          (url, index) => {
            let finalUrl = '';
            try {
              if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
                finalUrl = url;
              } else if (typeof window !== 'undefined' && url) {
                finalUrl = `${window.location.origin}${url.startsWith('/') ? url : '/' + url}`;
              } else {
                finalUrl = String(url || '');
              }
            } catch {
              finalUrl = String(url || '');
            }

            return {
              uid: `-${index}`,
              name: `video_${index}.mp4`,
              status: 'done',
              url: finalUrl,
            } as UploadFile;
          },
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
    const videoField = dynamicFields.find((f) => f.type === 'video-upload');
    if (videoField?.required && videoIds.length === 0) {
      message.error('请先上传视频');
      return;
    }

    const payload: any = {
      type_id: typeId!,
      video_ids: videoIds,
    };

    const extInfo: Record<string, any> = {};
    const topFields = new Set([
      'publisher',
      'title',
      'content',
      'price',
      'landing_url',
    ]);

    dynamicFields.forEach((field) => {
      if (field.type === 'video-upload') return;

      let value = values[field.name];

      if (
        (field.type === 'image-upload' || field.type === 'file-upload') &&
        (!value || value === '')
      ) {
        const imgs = imageFileLists[field.name];
        if (imgs && imgs.length > 0) {
          const first = imgs[0];
          if (first && first.url) value = first.url as string;
        }
      }

      if (typeof value !== 'undefined' && value !== null && value !== '') {
        if (topFields.has(field.name)) {
          payload[field.name] = field.type === 'number' ? Number(value) : value;
        } else {
          extInfo[field.name] = value;
        }
      }
    });

    if (Object.keys(extInfo).length > 0) payload.ext_info = extInfo;

    setSubmitting(true);
    try {
      let resp;
      if (editMode && editData) {
        resp = await updateAdData(editData.id, payload);
      } else {
        resp = await createAd(payload);
      }

      if (resp.code === 200) {
        message.success(editMode ? '更新成功' : '创建成功');
        form.resetFields();
        setVideoIds([]);
        setFileList([]);
        onCreated();
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
              .map((f) => {
                if (f.type === 'image-upload') {
                  return (
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
                      rules={buildRules(f)}
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
                }

                return (
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
                    rules={buildRules(f)}
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
                      <Input
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
                        maxLength={(f as any).validation?.max}
                        showCount={!!(f as any).validation?.max}
                      />
                    ) : (
                      <Input
                        placeholder={
                          f.placeholder || `请输入${f.label || f.name}`
                        }
                        type={
                          (f as any).validation?.type === 'url'
                            ? 'text'
                            : undefined
                        }
                      />
                    )}
                  </Form.Item>
                );
              })}

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

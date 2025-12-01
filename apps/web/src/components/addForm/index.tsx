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
      const formValues: any = {
        type_code: editData.type_code || initialTypeCode,
      };

      // 解析 ext_info（可能为字符串或对象），用于回填自定义字段（如 brand_slogan）
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

          // 优先取 editData 顶层字段，其次尝试 ext_info
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
                // 回填 image-upload 类型字段（例如 brand_logo）
                if (formConfig?.fields) {
                  formConfig.fields.forEach((field) => {
                    if (field.type === 'image-upload') {
                      // 优先使用 editData 顶层字段，其次尝试 ext_info
                      const topVal = (editData as any)[field.name];
                      const extVal = Object.prototype.hasOwnProperty.call(
                        extObj,
                        field.name,
                      )
                        ? extObj[field.name]
                        : undefined;
                      const src =
                        typeof topVal !== 'undefined' && topVal
                          ? topVal
                          : extVal;
                      if (src) {
                        let finalUrl = '';
                        try {
                          if (
                            typeof src === 'string' &&
                            /^https?:\/\//i.test(src)
                          ) {
                            finalUrl = src;
                          } else if (typeof window !== 'undefined' && src) {
                            finalUrl = `${window.location.origin}${String(src).startsWith('/') ? String(src) : '/' + String(src)}`;
                          } else {
                            finalUrl = String(src || '');
                          }
                        } catch {
                          finalUrl = String(src || '');
                        }
                        const fileObj: UploadFile = {
                          uid: `img-${field.name}`,
                          name: `image_${field.name}`,
                          status: 'done',
                          url: finalUrl,
                        };
                        setImageFileLists((prev) => ({
                          ...prev,
                          [field.name]: [fileObj],
                        }));
                      }
                    }
                  });
                }
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
      // 前端校验：与后端保持一致的大小与格式限制，避免不必要的网络传输
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

    // 将动态字段分流：基础列放顶层，其余放入 ext_info（后端 ad.ext_info 字段）
    const extInfo: Record<string, any> = {};
    const topFields = new Set([
      'publisher',
      'title',
      'content',
      'price',
      'landing_url',
    ]);

    dynamicFields.forEach((field) => {
      if (field.type === 'video-upload') return; // 视频单独处理

      let value = values[field.name];

      // 对于 image-upload，如果表单没有新值，尝试从回填的 imageFileLists 中取 URL
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
              .map((f) => {
                // Render image-upload as Upload component to show previews (e.g., brand_logo)
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
                        // 使用 field.uploadUrl 如果存在，否则不设置 action（可能需后续完善）
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

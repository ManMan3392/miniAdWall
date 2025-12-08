import { message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Ad } from '@/store';

interface HandleParams {
  values: any;
  dynamicFields: any[];
  videoIds: string[];
  imageFileLists: Record<string, UploadFile[]>;
  typeId?: number;
  editMode?: boolean;
  editData?: Ad | null;
  updateAdData: (id: any, payload: any) => Promise<any>;
  createAd: (payload: any) => Promise<any>;
  setSubmitting: (b: boolean) => void;
  form: any;
  setVideoIds: (ids: string[]) => void;
  setFileList: (files: UploadFile[]) => void;
  onCreated: () => void;
}

export async function handleSubmit(params: HandleParams) {
  const {
    values,
    dynamicFields,
    videoIds,
    imageFileLists,
    typeId,
    editMode,
    editData,
    updateAdData,
    createAd,
    setSubmitting,
    form,
    setVideoIds,
    setFileList,
    onCreated,
  } = params;

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
    let resp: any;
    if (editMode && editData) {
      resp = await updateAdData(editData.id, payload);
    } else {
      resp = await createAd(payload);
    }

    if (resp && resp.code === 200) {
      message.success(editMode ? '更新成功' : '创建成功');
      form.resetFields();
      setVideoIds([]);
      setFileList([]);
      onCreated();
    } else {
      message.error(resp?.message || (editMode ? '更新失败' : '创建失败'));
    }
  } catch (e: any) {
    console.error('操作错误:', e);
    message.error(e?.message || (editMode ? '更新失败' : '创建失败'));
  } finally {
    setSubmitting(false);
  }
}

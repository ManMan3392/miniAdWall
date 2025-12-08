import type { UploadFile } from 'antd/es/upload/interface';
import type { Ad } from '@/store';
import type { FormConfig } from '@/service/ad';

interface InitParams {
  initialTypeCode: string;
  form: any;
  editData?: Ad | null;
  formConfig?: FormConfig | null;
  setTypeCode: (s?: string) => void;
  setTypeId: (id?: number) => void;
  setFileList: (files: UploadFile[]) => void;
  setVideoIds: (ids: string[]) => void;
}

export function initFormForEdit({
  initialTypeCode,
  form,
  editData,
  formConfig,
  setTypeCode,
  setTypeId,
  setFileList,
  setVideoIds,
}: InitParams) {
  setTypeCode(initialTypeCode);
  form.setFieldsValue({ type_code: initialTypeCode });

  if (!editData) return;

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
    const videoFiles: UploadFile[] = editData.video_urls.map((url, index) => {
      let finalUrl = '';
      try {
        if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
          finalUrl = url as string;
        } else if (typeof window !== 'undefined' && url) {
          finalUrl = `${window.location.origin}${(url as string).startsWith('/') ? url : '/' + (url as string)}`;
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
    });
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

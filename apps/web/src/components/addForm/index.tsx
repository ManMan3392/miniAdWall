import { Form, Spin } from 'antd';
import type { ReactNode, FC } from 'react';
import { memo, useEffect, useMemo, useState } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';
import { useAdStore, type Ad } from '@/store';
import styles from './style.module.less';
import { getFormConfig, createAd, type FormConfig } from '@/service/ad';
import { buildRules } from './utils/buildRules';
import { initFormForEdit } from './utils/initEditForm';
import { handleSubmit } from './utils/handleSubmit';
import FormHeader from './cpns/formHeader';
import FormItems from './cpns/formItems';
import FormVideo from './cpns/formVideo';
import FormFooter from './cpns/formFooter';
import FormImg from './cpns/formImg';

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
    initFormForEdit({
      initialTypeCode,
      form,
      editData: editData || null,
      formConfig,
      setTypeCode,
      setTypeId,
      setFileList,
      setVideoIds,
    });
  }, [initialTypeCode, form, editData, formConfig]);

  const dynamicFields = useMemo(() => formConfig?.fields || [], [formConfig]);

  const onFinish = async (values: any) => {
    await handleSubmit({
      values,
      dynamicFields,
      videoIds,
      imageFileLists,
      typeId,
      editMode,
      editData: editData || null,
      updateAdData,
      createAd,
      setSubmitting,
      form,
      setVideoIds,
      setFileList,
      onCreated,
    });
  };

  if (!visible) return null;
  return (
    <div className={styles['form-container']}>
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        labelWrap
        onFinish={onFinish}
      >
        <FormHeader
          adTypes={adTypes}
          initialTypeCode={initialTypeCode}
          setTypeCode={setTypeCode}
        />

        {loadingCfg ? (
          <Spin />
        ) : (
          <>
            {dynamicFields
              .filter((f) => f.type !== 'video-upload')
              .map((f, i) => {
                if (f.type === 'image-upload') {
                  return (
                    <FormImg
                      key={f.name ?? `image-${i}`}
                      buildRules={buildRules}
                      imageFileLists={imageFileLists}
                      setImageFileLists={setImageFileLists}
                      f={f}
                    />
                  );
                }

                return (
                  <FormItems
                    key={f.name ?? `field-${i}`}
                    f={f}
                    buildRules={buildRules}
                  />
                );
              })}

            {dynamicFields.some((f) => f.type === 'video-upload') && (
              <FormVideo
                dynamicFields={dynamicFields}
                videoIds={videoIds}
                setVideoIds={setVideoIds}
                fileList={fileList}
                setFileList={setFileList}
                typeCode={typeCode}
                typeId={typeId}
              />
            )}

            <FormFooter
              submitting={submitting}
              onCancel={onCancel}
              editMode={editMode}
            />
          </>
        )}
      </Form>
    </div>
  );
};
export default memo(AddForm);

import React, { useEffect, useState } from 'react';
import { Modal, Input, message, Button, Form } from 'antd';
import { getFormConfig, updateFormConfig } from '@/service/ad';
import { PlusOutlined } from '@ant-design/icons';
import { DEFAULT_FIELDS } from './asset/data';
import type { FieldConfig, FormConfigModalProps } from './asset/type';
import AdTypeConfigForm from '../adTypeConfigForm';
import AdTypeEditTable from './cpns/adTypeEditTable';

const FormConfigModal: React.FC<FormConfigModalProps> = ({
  visible,
  onClose,
  typeCode,
  typeName,
}) => {
  const [loading, setLoading] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [fields, setFields] = useState<FieldConfig[]>([]);

  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<FieldConfig | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [fieldForm] = Form.useForm();

  useEffect(() => {
    if (visible && typeCode) {
      setLoading(true);
      getFormConfig(typeCode)
        .then((res: any) => {
          if (res.code === 200) {
            const data = res.data || {};
            setFormTitle(data.formTitle || `创建${typeName}`);
            const loadedFields = data.fields || [];
            if (loadedFields.length === 0) {
              setFields(DEFAULT_FIELDS);
            } else {
              setFields(loadedFields);
            }
          } else {
            message.error(res.message || '获取配置失败');
          }
        })
        .catch((err: any) => {
          message.error('获取配置出错');
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [visible, typeCode, typeName]);

  const isDefaultField = (name?: string) =>
    DEFAULT_FIELDS.some((f) => f.name === name);

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      const uploadTypes = ['video-upload', 'file-upload'];
      const sanitizedFields = fields.map((f) => {
        const isDefault = isDefaultField(f.name);
        if (!isDefault) return f;
        const original = DEFAULT_FIELDS.find((df) => df.name === f.name)!;
        const isUpload = uploadTypes.includes(f.type);
        return {
          ...original,
          label: original.label,
          placeholder: isUpload ? original.placeholder : f.placeholder,
        } as FieldConfig;
      });

      const config = { formTitle, fields: sanitizedFields };
      const res: any = await updateFormConfig(typeCode, config);
      if (res.code === 200) {
        message.success('配置更新成功');
        onClose();
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (e) {
      message.error('保存失败');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    setEditingField(null);
    setEditingIndex(-1);
    fieldForm.resetFields();
    setFieldModalVisible(true);
  };

  const handleEditField = (record: FieldConfig, index: number) => {
    if (isDefaultField(record.name)) return;
    setEditingField(record);
    setEditingIndex(index);
    fieldForm.setFieldsValue({
      ...record,
      enums: record.enums?.join(','),
      minValue: record.validation?.min,
      maxValue: record.validation?.max,
      minLength: record.validation?.minLength,
      maxLength: record.validation?.maxLength,
      validationType: record.validation?.type,
      pattern: record.validation?.pattern,
      validationMessage: record.validation?.message,
    });
    setFieldModalVisible(true);
  };

  const handleDeleteField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleFieldChange = (
    index: number,
    key: keyof FieldConfig,
    value: any,
  ) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  return (
    <>
      <Modal
        title={`配置表单: ${typeName}`}
        open={visible}
        onCancel={onClose}
        onOk={handleSaveConfig}
        confirmLoading={loading}
        width={900}
        maskClosable={false}
      >
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>表单标题:</span>
          <Input
            style={{ width: 300 }}
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="请输入表单标题"
          />
        </div>

        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddField}
            disabled={false}
          >
            添加字段
          </Button>
        </div>
        <AdTypeEditTable
          handleEditField={handleEditField}
          handleDeleteField={handleDeleteField}
          isDefaultField={isDefaultField}
          handleFieldChange={handleFieldChange}
          fields={fields}
        />
      </Modal>

      <AdTypeConfigForm
        fieldForm={fieldForm}
        fieldModalVisible={fieldModalVisible}
        setFieldModalVisible={setFieldModalVisible}
        editingField={editingField}
        editingIndex={editingIndex}
        fields={fields}
        setFields={setFields}
      />
    </>
  );
};

export default FormConfigModal;

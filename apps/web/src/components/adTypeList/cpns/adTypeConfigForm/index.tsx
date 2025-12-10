import type { ReactNode, FC } from 'react';
import React, { memo } from 'react';
import type { FieldConfig } from '../adTypeEdit/asset/type';
import { Form, Modal } from 'antd';
import CheckRules from './cpns/checkRules';
import NormalItems from './cpns/normalItems';
import SpecialItems from './cpns/specialItems';

interface Iprops {
  children?: ReactNode;
  fieldForm: any;
  fieldModalVisible: boolean;
  setFieldModalVisible: (visible: boolean) => void;
  editingField: any;
  editingIndex: number;
  fields: FieldConfig[];
  setFields: React.Dispatch<React.SetStateAction<FieldConfig[]>>;
}
const Home: FC<Iprops> = ({
  fieldForm,
  fieldModalVisible,
  setFieldModalVisible,
  editingField,
  editingIndex,
  fields,
  setFields,
}) => {
  const handleSaveField = async () => {
    try {
      const values = await fieldForm.validateFields();
      const uploadTypes = ['video-upload', 'file-upload'];
      const isUploadType = uploadTypes.includes(values.type);

      const newField: FieldConfig =
        editingIndex > -1 ? { ...fields[editingIndex] } : ({} as FieldConfig);

      if (editingIndex > -1) {
        // update existing (non-default) field
        newField.name = values.name ?? newField.name;
        newField.label = values.label;
        newField.type = values.type;
        newField.placeholder = isUploadType ? undefined : values.placeholder;
        newField.required = values.required;

        if (values.type === 'select' && values.enums) {
          newField.enums = values.enums
            .split(/[,，]/)
            .map((s: string) => s.trim())
            .filter(Boolean);
        }

        // validation (skip for upload/select)
        const forbiddenValidationTypes = [
          'video-upload',
          'file-upload',
          'select',
        ];
        if (!forbiddenValidationTypes.includes(values.type)) {
          const validation: any = {};
          if (values.required) validation.required = true;
          if (values.validationType) validation.type = values.validationType;
          else if (values.type === 'number') validation.type = 'number';
          else if (values.type === 'input') validation.type = 'string';

          // 数值范围（number 类型）
          if (
            values.minValue !== undefined &&
            values.minValue !== null &&
            values.minValue !== ''
          )
            validation.min = values.minValue;
          if (
            values.maxValue !== undefined &&
            values.maxValue !== null &&
            values.maxValue !== ''
          )
            validation.max = values.maxValue;

          // 长度校验（input 或 number 的位数校验）
          if (typeof values.minLength !== 'undefined')
            validation.minLength = values.minLength;
          if (typeof values.maxLength !== 'undefined')
            validation.maxLength = values.maxLength;

          if (values.pattern) validation.pattern = values.pattern;
          if (values.validationMessage)
            validation.message = values.validationMessage;
          if (Object.keys(validation).length > 0)
            newField.validation = validation;
        }

        const newFields = [...fields];
        newFields[editingIndex] = newField;
        setFields(newFields);
      } else {
        // add new field
        const f: FieldConfig = {
          name: values.name,
          label: values.label,
          type: values.type,
          placeholder: isUploadType ? undefined : values.placeholder,
          required: values.required,
        } as FieldConfig;
        if (values.type === 'select' && values.enums) {
          f.enums = values.enums
            .split(/[,，]/)
            .map((s: string) => s.trim())
            .filter(Boolean);
        }
        // 构造 validation（若有）
        if (!['video-upload', 'file-upload', 'select'].includes(values.type)) {
          const validation: any = {};
          if (values.required) validation.required = true;
          if (values.validationType) validation.type = values.validationType;
          else if (values.type === 'number') validation.type = 'number';
          else if (values.type === 'input') validation.type = 'string';

          if (
            values.minValue !== undefined &&
            values.minValue !== null &&
            values.minValue !== ''
          )
            validation.min = values.minValue;
          if (
            values.maxValue !== undefined &&
            values.maxValue !== null &&
            values.maxValue !== ''
          )
            validation.max = values.maxValue;
          if (typeof values.minLength !== 'undefined')
            validation.minLength = values.minLength;
          if (typeof values.maxLength !== 'undefined')
            validation.maxLength = values.maxLength;
          if (values.pattern) validation.pattern = values.pattern;
          if (values.validationMessage)
            validation.message = values.validationMessage;
          if (Object.keys(validation).length > 0) f.validation = validation;
        }
        setFields((prev: FieldConfig[]) => [...prev, f]);
      }

      setFieldModalVisible(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Modal
      title={editingField ? '编辑字段' : '添加字段'}
      open={fieldModalVisible}
      onOk={handleSaveField}
      onCancel={() => setFieldModalVisible(false)}
      destroyOnHidden
      width={600}
    >
      <Form form={fieldForm} layout="vertical">
        <NormalItems />
        <SpecialItems />
        <CheckRules />
      </Form>
    </Modal>
  );
};
export default memo(Home);

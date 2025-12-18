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
const AdTypeConfigForm: FC<Iprops> = ({
  fieldForm,
  fieldModalVisible,
  setFieldModalVisible,
  editingField,
  editingIndex,
  fields,
  setFields,
}) => {
  function buildValidation(values: any) {
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
    if (values.validationMessage) validation.message = values.validationMessage;

    return Object.keys(validation).length > 0 ? validation : undefined;
  }

  const uploadTypes = ['video-upload'];
  const forbiddenValidationTypes = ['video-upload', 'select'];

  function parseEnums(enumsStr?: string) {
    return enumsStr
      ? enumsStr
          .split(/[,，]/)
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined;
  }

  function makeField(values: any, existing?: FieldConfig): FieldConfig {
    const isUploadType = uploadTypes.includes(values.type);
    const field: FieldConfig = existing ? { ...existing } : ({} as FieldConfig);

    if (existing) field.name = values.name ?? field.name;
    else field.name = values.name;

    field.label = values.label;
    field.type = values.type;
    field.placeholder = isUploadType ? undefined : values.placeholder;
    field.required = values.required;

    if (values.type === 'select' && values.enums) {
      field.enums = parseEnums(values.enums);
    }

    if (!forbiddenValidationTypes.includes(values.type)) {
      const validation = buildValidation(values);
      if (validation) field.validation = validation;
      else delete field.validation;
    } else {
      delete field.validation;
    }

    return field;
  }

  const handleSaveField = async () => {
    try {
      const values = await fieldForm.validateFields();
      const newField =
        editingIndex > -1
          ? makeField(values, fields[editingIndex])
          : makeField(values);

      if (editingIndex > -1) {
        const newFields = [...fields];
        newFields[editingIndex] = newField;
        setFields(newFields);
      } else {
        setFields((prev: FieldConfig[]) => [...prev, newField]);
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
export default memo(AdTypeConfigForm);

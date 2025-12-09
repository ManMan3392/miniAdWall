import React, { useEffect, useState } from 'react';
import {
  Modal,
  Input,
  message,
  Table,
  Button,
  Form,
  Select,
  Switch,
  Space,
  InputNumber,
  Popconfirm,
} from 'antd';
import { getFormConfig, updateFormConfig } from '@/service/ad';
import {
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';

interface FormConfigModalProps {
  visible: boolean;
  onClose: () => void;
  typeCode: string;
  typeName: string;
}

interface FieldConfig {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  enums?: string[];
  validation?: {
    required?: boolean;
    type?: string;
    message?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

const DEFAULT_FIELDS: FieldConfig[] = [
  {
    name: 'publisher',
    type: 'input',
    label: '发布者',
    required: true,
    placeholder: '请输入发布者名称',
  },
  {
    name: 'title',
    type: 'input',
    label: '广告标题',
    required: true,
    placeholder: '请输入广告标题',
    validation: { max: 30 },
  },
  {
    name: 'content',
    type: 'input',
    label: '广告内容',
    required: true,
    placeholder: '请输入广告详细内容',
    validation: { max: 500 },
  },
  {
    name: 'landing_url',
    type: 'input',
    label: '落地页URL',
    required: true,
    placeholder: '请输入落地页链接',
    validation: { type: 'url' },
  },
  {
    name: 'price',
    type: 'number',
    label: '初始出价（元/千次曝光）',
    required: true,
    placeholder: '请输入出价',
    validation: {
      required: true,
      type: 'number',
      message: '初始出价必须为数字',
      min: 0.5,
    },
  },
];

const FormConfigModal: React.FC<FormConfigModalProps> = ({
  visible,
  onClose,
  typeCode,
  typeName,
}) => {
  const [loading, setLoading] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [fields, setFields] = useState<FieldConfig[]>([]);

  // Field Edit Modal State (modal is only for non-default fields)
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
      // Sanitize fields: for DEFAULT_FIELDS keep original props except placeholder
      // (and do NOT persist placeholder for upload types). Also do NOT persist label changes for default fields.
      const uploadTypes = ['video-upload', 'file-upload'];
      const sanitizedFields = fields.map((f) => {
        const isDefault = isDefaultField(f.name);
        if (!isDefault) return f;
        const original = DEFAULT_FIELDS.find((df) => df.name === f.name)!;
        const isUpload = uploadTypes.includes(f.type);
        return {
          ...original,
          label: original.label, // do not persist label changes for default fields
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

  // Field Operations
  const handleAddField = () => {
    setEditingField(null);
    setEditingIndex(-1);
    fieldForm.resetFields();
    setFieldModalVisible(true);
  };

  const handleEditField = (record: FieldConfig, index: number) => {
    // Do not open modal for default fields
    if (isDefaultField(record.name)) return;
    setEditingField(record);
    setEditingIndex(index);
    fieldForm.setFieldsValue({
      ...record,
      enums: record.enums?.join(','),
      // 支持数字/长度分开存储
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
          if (typeof values.minValue !== 'undefined')
            validation.min = values.minValue;
          if (typeof values.maxValue !== 'undefined')
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

          if (typeof values.minValue !== 'undefined')
            validation.min = values.minValue;
          if (typeof values.maxValue !== 'undefined')
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
        setFields((prev) => [...prev, f]);
      }

      setFieldModalVisible(false);
    } catch (err) {
      console.log(err);
    }
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

  const columns = [
    {
      title: '字段名 (name)',
      dataIndex: 'name',
      render: (text: string, _: FieldConfig, index: number) => {
        const isDefault = isDefaultField(fields[index]?.name);
        return (
          <Input
            value={text}
            disabled={isDefault}
            style={{ width: '100%' }}
            onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
          />
        );
      },
    },
    {
      title: '显示名 (label)',
      dataIndex: 'label',
      render: (text: string, _: FieldConfig, index: number) => (
        <Input
          value={text}
          style={{ width: '100%' }}
          onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
        />
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (text: string, _: FieldConfig, index: number) => {
        const isDefault = isDefaultField(fields[index]?.name);
        return isDefault ? (
          <span>{text}</span>
        ) : (
          <Select
            value={text}
            style={{ width: '100%' }}
            onChange={(val) => handleFieldChange(index, 'type', val)}
          >
            <Select.Option value="input">文本</Select.Option>
            <Select.Option value="number">数字</Select.Option>
            <Select.Option value="select">下拉</Select.Option>
            <Select.Option value="video-upload">视频</Select.Option>
            <Select.Option value="image-upload">图片</Select.Option>
            <Select.Option value="file-upload">文件</Select.Option>
          </Select>
        );
      },
    },
    {
      title: '必填',
      dataIndex: 'required',
      render: (val: boolean, _: FieldConfig, index: number) => {
        const isDefault = isDefaultField(fields[index]?.name);
        return (
          <Switch
            checked={val}
            disabled={isDefault}
            onChange={(checked) =>
              handleFieldChange(index, 'required', checked)
            }
          />
        );
      },
    },
    {
      title: '占位符',
      dataIndex: 'placeholder',
      render: (text: string, _: FieldConfig, index: number) => (
        <Input
          value={text}
          style={{ width: '100%' }}
          onChange={(e) =>
            handleFieldChange(index, 'placeholder', e.target.value)
          }
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FieldConfig, index: number) => {
        const isDefault = isDefaultField(record.name);
        if (isDefault) return null;
        return (
          <Space>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => handleEditField(record, index)}
              title="高级设置"
            />
            <Popconfirm
              title="确定删除该字段吗？"
              onConfirm={() => handleDeleteField(index)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

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

        <Table
          dataSource={fields}
          columns={columns}
          rowKey={(r) => r.name}
          pagination={false}
          size="small"
          scroll={{ y: 400 }}
          bordered
          style={{ tableLayout: 'fixed' }}
        />
      </Modal>

      <Modal
        title={editingField ? '编辑字段' : '添加字段'}
        open={fieldModalVisible}
        onOk={handleSaveField}
        onCancel={() => setFieldModalVisible(false)}
        destroyOnClose
        width={600}
      >
        <Form form={fieldForm} layout="vertical">
          <Space style={{ display: 'flex', marginBottom: 8 }} align="start">
            <Form.Item
              name="name"
              label="字段名 (Key)"
              rules={[{ required: true, message: '请输入字段名' }]}
              style={{ width: 260 }}
            >
              <Input placeholder="例如: price" />
            </Form.Item>
            <Form.Item
              name="label"
              label="显示名 (Label)"
              rules={[{ required: true, message: '请输入显示名' }]}
              style={{ width: 260 }}
            >
              <Input placeholder="例如: 初始出价" />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex', marginBottom: 8 }} align="start">
            <Form.Item
              name="type"
              label="字段类型"
              rules={[{ required: true }]}
              style={{ width: 260 }}
              initialValue="input"
            >
              <Select>
                <Select.Option value="input">文本输入 (input)</Select.Option>
                <Select.Option value="number">数字输入 (number)</Select.Option>
                <Select.Option value="select">下拉选择 (select)</Select.Option>
                <Select.Option value="video-upload">
                  视频上传 (video-upload)
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="required"
              label="是否必填"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item
            noStyle
            shouldUpdate={(prev, current) => prev.type !== current.type}
          >
            {({ getFieldValue }) => {
              const t = getFieldValue('type');
              const uploadTypes = [
                'video-upload',
                'image-upload',
                'file-upload',
              ];
              const hidePlaceholder = uploadTypes.includes(t);
              return hidePlaceholder ? null : (
                <Form.Item name="placeholder" label="占位提示 (Placeholder)">
                  <Input placeholder="请输入..." />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, current) => prev.type !== current.type}
          >
            {({ getFieldValue }) =>
              getFieldValue('type') === 'select' ? (
                <Form.Item
                  name="enums"
                  label="选项列表 (逗号分隔)"
                  rules={[{ required: true, message: '请输入选项' }]}
                >
                  <Input placeholder="例如: App下载, 表单提交, 商品购买" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, current) => prev.type !== current.type}
          >
            {({ getFieldValue }) => {
              const t = getFieldValue('type');
              const forbiddenValidationTypes = [
                'video-upload',
                'image-upload',
                'file-upload',
                'select',
              ];
              const isForbidden = forbiddenValidationTypes.includes(t);
              if (isForbidden) {
                return (
                  <div style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
                    上传或下拉类型不支持配置校验规则
                  </div>
                );
              }

              return (
                <Form.Item
                  label="验证规则 (Validation)"
                  style={{ marginBottom: 0 }}
                >
                  <Space align="start" wrap>
                    {t === 'input' ? (
                      <div style={{ display: 'flex', gap: 12 }}>
                        <Form.Item
                          name="minLength"
                          label="最小长度"
                          style={{ width: 220 }}
                        >
                          <InputNumber
                            placeholder="Min length"
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                        <Form.Item
                          name="maxLength"
                          label="最大长度"
                          style={{ width: 220 }}
                        >
                          <InputNumber
                            placeholder="Max length"
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </div>
                    ) : null}

                    {t === 'number' ? (
                      <>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <Form.Item
                            name="minValue"
                            label="最小值 (数值范围)"
                            style={{ width: 220 }}
                          >
                            <InputNumber
                              placeholder="Min value"
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                          <Form.Item
                            name="maxValue"
                            label="最大值 (数值范围)"
                            style={{ width: 220 }}
                          >
                            <InputNumber
                              placeholder="Max value"
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                          <Form.Item
                            name="minLength"
                            label="最小长度 (位数)"
                            style={{ width: 220 }}
                          >
                            <InputNumber
                              placeholder="Min digits"
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                          <Form.Item
                            name="maxLength"
                            label="最大长度 (位数)"
                            style={{ width: 220 }}
                          >
                            <InputNumber
                              placeholder="Max digits"
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </div>
                      </>
                    ) : null}
                  </Space>
                  <Form.Item name="pattern" label="正则校验 (Pattern)">
                    <Input placeholder="例如: ^[a-zA-Z0-9]+$" />
                  </Form.Item>
                  <Form.Item name="validationMessage" label="错误提示信息">
                    <Input placeholder="例如: 初始出价必须为数字" />
                  </Form.Item>
                </Form.Item>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default FormConfigModal;

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
  const [defaultMode, setDefaultMode] = useState<boolean>(false);

  // Field Edit Modal State
  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<FieldConfig | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [editingIsDefault, setEditingIsDefault] = useState<boolean>(false);
  const [fieldForm] = Form.useForm();

  useEffect(() => {
    if (visible && typeCode) {
      setLoading(true);
      getFormConfig(typeCode)
        .then((res: any) => {
          if (res.code === 200) {
            const data = res.data || {};
            setFormTitle(data.formTitle || `创建${typeName}`);
            // If fields are empty, use default fields
            const loadedFields = data.fields || [];
            if (loadedFields.length === 0) {
              setFields(DEFAULT_FIELDS);
              setDefaultMode(true);
            } else {
              setFields(loadedFields);
              setDefaultMode(false);
            }
          } else {
            message.error(res.message || '获取配置失败');
          }
        })
        .catch((err: any) => {
          message.error('获取配置出错');
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [visible, typeCode, typeName]);

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      const config = {
        formTitle,
        fields,
      };
      const res: any = await updateFormConfig(typeCode, config);
      if (res.code === 200) {
        message.success('配置更新成功');
        onClose();
      } else {
        message.error(res.message || '更新失败');
      }
    } catch {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // Field Operations
  const handleAddField = () => {
    setEditingField(null);
    setEditingIndex(-1);
    setEditingIsDefault(false);
    fieldForm.resetFields();
    setFieldModalVisible(true);
  };

  const handleEditField = (record: FieldConfig, index: number) => {
    const isDefault =
      defaultMode && DEFAULT_FIELDS.some((f) => f.name === record.name);
    setEditingIsDefault(!!isDefault);
    setEditingField(record);
    setEditingIndex(index);
    // Flatten data for form
    fieldForm.setFieldsValue({
      ...record,
      enums: record.enums?.join(','),
      min: record.validation?.min,
      max: record.validation?.max,
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
      // If editing a default field, only allow changing label and placeholder
      let newField: FieldConfig;
      const isEditingDefault = editingIsDefault;
      const uploadTypes = ['video-upload', 'image-upload', 'file-upload'];
      const isUploadType = uploadTypes.includes(values.type);

      if (isEditingDefault) {
        const original = fields[editingIndex];
        // For default fields keep original props, only update label and placeholder
        newField = {
          ...original,
          label: values.label,
          // only update placeholder if not an upload type
          placeholder: isUploadType ? original.placeholder : values.placeholder,
        };
      } else {
        newField = {
          name: values.name,
          label: values.label,
          type: values.type,
          // do not persist placeholder for upload types
          placeholder: isUploadType ? undefined : values.placeholder,
          required: values.required,
        } as FieldConfig;
      }

      if (!isEditingDefault && values.type === 'select' && values.enums) {
        newField.enums = values.enums
          .split(/[,，]/)
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      // Construct validation object (skip for default fields and upload/select types)
      const forbiddenValidationTypes = [
        'video-upload',
        'image-upload',
        'file-upload',
        'select',
      ];
      const isUploadOrSelect = forbiddenValidationTypes.includes(values.type);
      if (!isEditingDefault && !isUploadOrSelect) {
        const validation: any = {};
        if (values.required) {
          validation.required = true;
        }

        // Handle validation type
        if (values.validationType) {
          validation.type = values.validationType;
        } else if (values.type === 'number') {
          validation.type = 'number';
        }

        if (values.min !== undefined) validation.min = values.min;
        if (values.max !== undefined) validation.max = values.max;
        if (values.pattern) validation.pattern = values.pattern;

        if (values.validationMessage) {
          validation.message = values.validationMessage;
        }

        if (Object.keys(validation).length > 0) {
          newField.validation = validation;
        }
      }

      const newFields = [...fields];
      if (editingIndex > -1) {
        newFields[editingIndex] = newField;
      } else {
        newFields.push(newField);
      }
      setFields(newFields);
      setFieldModalVisible(false);
    } catch {
      // validation failed
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
      width: 120,
      render: (text: string, _: FieldConfig, index: number) => {
        const isDefault =
          defaultMode &&
          DEFAULT_FIELDS.some((f) => f.name === fields[index]?.name);
        return (
          <Input
            value={text}
            disabled={!!isDefault}
            onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
          />
        );
      },
    },
    {
      title: '显示名 (label)',
      dataIndex: 'label',
      width: 150,
      render: (text: string, _: FieldConfig, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
        />
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (text: string, _: FieldConfig, index: number) => {
        const isDefault =
          defaultMode &&
          DEFAULT_FIELDS.some((f) => f.name === fields[index]?.name);
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
          </Select>
        );
      },
    },
    {
      title: '必填',
      dataIndex: 'required',
      width: 80,
      render: (val: boolean, _: FieldConfig, index: number) => {
        const isDefault =
          defaultMode &&
          DEFAULT_FIELDS.some((f) => f.name === fields[index]?.name);
        return (
          <Switch
            checked={val}
            disabled={!!isDefault}
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
      width: 150,
      render: (text: string, _: FieldConfig, index: number) => (
        <Input
          value={text}
          onChange={(e) =>
            handleFieldChange(index, 'placeholder', e.target.value)
          }
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: FieldConfig, index: number) => {
        const isDefault =
          defaultMode &&
          DEFAULT_FIELDS.some((f) => f.name === fields[index]?.name);
        return (
          <Space>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => handleEditField(record, index)}
              title="高级设置"
            />
            {!isDefault && (
              <Popconfirm
                title="确定删除该字段吗？"
                onConfirm={() => handleDeleteField(index)}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
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
          >
            添加字段
          </Button>
        </div>

        <Table
          dataSource={fields}
          columns={columns}
          rowKey="name"
          pagination={false}
          size="small"
          scroll={{ y: 400 }}
          bordered
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
              <Input placeholder="例如: price" disabled={editingIsDefault} />
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
              <Select disabled={editingIsDefault}>
                <Select.Option value="input">文本输入 (input)</Select.Option>
                <Select.Option value="number">数字输入 (number)</Select.Option>
                <Select.Option value="select">下拉选择 (select)</Select.Option>
                <Select.Option value="video-upload">
                  视频上传 (video-upload)
                </Select.Option>
                <Select.Option value="image-upload">
                  图片上传 (image-upload)
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="required"
              label="是否必填"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch disabled={editingIsDefault} />
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
                  <Input placeholder="请输入..." disabled={editingIsDefault} />
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
                  <Input
                    placeholder="例如: App下载, 表单提交, 商品购买"
                    disabled={editingIsDefault}
                  />
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
                    <Form.Item
                      name="validationType"
                      label="数据类型校验"
                      style={{ width: 160 }}
                    >
                      <Select
                        placeholder="选择类型"
                        allowClear
                        disabled={editingIsDefault}
                      >
                        <Select.Option value="string">
                          字符串 (string)
                        </Select.Option>
                        <Select.Option value="number">
                          数字 (number)
                        </Select.Option>
                        <Select.Option value="boolean">
                          布尔值 (boolean)
                        </Select.Option>
                        <Select.Option value="url">URL链接</Select.Option>
                        <Select.Option value="email">
                          邮箱 (email)
                        </Select.Option>
                        <Select.Option value="integer">
                          整数 (integer)
                        </Select.Option>
                        <Select.Option value="float">
                          浮点数 (float)
                        </Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="min" label="最小值/最小长度">
                      <InputNumber
                        placeholder="Min"
                        style={{ width: 120 }}
                        disabled={editingIsDefault}
                      />
                    </Form.Item>
                    <Form.Item name="max" label="最大值/最大长度">
                      <InputNumber
                        placeholder="Max"
                        style={{ width: 120 }}
                        disabled={editingIsDefault}
                      />
                    </Form.Item>
                  </Space>
                  <Form.Item name="pattern" label="正则校验 (Pattern)">
                    <Input
                      placeholder="例如: ^[a-zA-Z0-9]+$"
                      disabled={editingIsDefault}
                    />
                  </Form.Item>
                  <Form.Item name="validationMessage" label="错误提示信息">
                    <Input
                      placeholder="例如: 初始出价必须为数字"
                      disabled={editingIsDefault}
                    />
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

import { Button, Input, Popconfirm, Select, Space, Switch, Table } from 'antd';
import type { ReactNode, FC } from 'react';
import { memo } from 'react';
import type { FieldConfig } from '../../asset/type';
import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';

interface Iprops {
  children?: ReactNode;
  handleEditField: (field: FieldConfig, index: number) => void;
  handleDeleteField: (index: number) => void;
  isDefaultField: (name: string) => boolean;
  handleFieldChange: (
    index: number,
    key: keyof FieldConfig,
    value: any,
  ) => void;
  fields: FieldConfig[];
}
const AdTypeEditTable: FC<Iprops> = ({
  handleEditField,
  handleDeleteField,
  isDefaultField,
  handleFieldChange,
  fields,
}) => {
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
      render: (text: string, record: FieldConfig, index: number) => {
        const isDefault = isDefaultField(record.name);
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
          </Select>
        );
      },
    },
    {
      title: '必填',
      dataIndex: 'required',
      render: (val: boolean, record: FieldConfig, index: number) => {
        const isDefault = isDefaultField(record.name);
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
      render: (text: string, record: FieldConfig, index: number) => {
        const uploadTypes = ['video-upload', 'file-upload', 'select'];
        const isUpload = uploadTypes.includes(record.type);
        return (
          <Input
            value={text}
            style={{ width: '100%' }}
            disabled={isUpload}
            onChange={(e) =>
              handleFieldChange(index, 'placeholder', e.target.value)
            }
          />
        );
      },
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
  );
};
export default memo(AdTypeEditTable);

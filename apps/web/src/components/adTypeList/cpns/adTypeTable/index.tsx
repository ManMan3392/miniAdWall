import { deleteAdType } from '@/service/ad';
import { Button, message, Popconfirm, Space, Table } from 'antd';
import type { ReactNode, FC } from 'react';
import { memo } from 'react';

interface Iprops {
  children?: ReactNode;
  handleEdit: (record: any) => void;
  handleConfig: (record: any) => void;
  fetchAdTypes: () => void;
  adTypes: any[];
}
const AdTypeTable: FC<Iprops> = ({
  handleEdit,
  handleConfig,
  fetchAdTypes,
  adTypes,
}) => {
  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '类型名称', dataIndex: 'type_name' },
    { title: '类型编码', dataIndex: 'type_code' },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" onClick={() => handleConfig(record)}>
            配置表单
          </Button>
          <Popconfirm
            title={`确认删除 ${record.type_name} ?`}
            onConfirm={async () => {
              try {
                const res = await deleteAdType(record.id);
                if (res && res.code === 200) {
                  message.success('删除成功');
                  fetchAdTypes();
                } else {
                  message.error(res?.message || '删除失败');
                }
              } catch (err) {
                console.error('deleteAdType error', err);
                message.error('删除请求失败');
              }
            }}
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={adTypes}
      columns={columns}
      rowKey="id"
      pagination={false}
      size="small"
    />
  );
};
export default memo(AdTypeTable);

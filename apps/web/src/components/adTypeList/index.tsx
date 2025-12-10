import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, message } from 'antd';
import { useAdStore } from '@/store';
import { createAdType, updateAdType } from '@/service/ad';
import AdTypeTable from './cpns/adTypeTable';
import FormConfigModal from './cpns/adTypeEdit';

interface TypeManagerModalProps {
  visible: boolean;
  onCancel: () => void;
}

const TypeManagerModal: FC<TypeManagerModalProps> = ({ visible, onCancel }) => {
  const { adTypes, fetchAdTypes } = useAdStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [form] = Form.useForm();

  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectedTypeCode, setSelectedTypeCode] = useState('');
  const [selectedTypeName, setSelectedTypeName] = useState('');

  useEffect(() => {
    if (visible) {
      fetchAdTypes();
    }
  }, [visible, fetchAdTypes]);

  const handleAdd = () => {
    setEditingType(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingType(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleConfig = (record: any) => {
    setSelectedTypeCode(record.type_code);
    setSelectedTypeName(record.type_name);
    setConfigModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingType) {
        const res = await updateAdType(editingType.id, values);
        if (res.code === 200) {
          message.success('更新成功');
          setIsModalOpen(false);
          fetchAdTypes();
        } else {
          message.error(res.message || '更新失败');
        }
      } else {
        const res = await createAdType(values);
        if (res.code === 200) {
          message.success('创建成功');
          setIsModalOpen(false);
          fetchAdTypes();
        } else {
          message.error(res.message || '创建失败');
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Modal
        title="广告类型管理"
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={700}
      >
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button type="primary" onClick={handleAdd}>
            新增类型
          </Button>
        </div>
        <AdTypeTable
          handleEdit={handleEdit}
          handleConfig={handleConfig}
          fetchAdTypes={fetchAdTypes}
          adTypes={adTypes}
        />
      </Modal>

      <Modal
        title={editingType ? '编辑类型' : '新增类型'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="type_name"
            label="类型名称"
            rules={[{ required: true, message: '请输入类型名称' }]}
          >
            <Input placeholder="例如：开屏广告" />
          </Form.Item>
          <Form.Item
            name="type_code"
            label="类型编码"
            rules={[{ required: true, message: '请输入类型编码' }]}
          >
            <Input placeholder="例如：splash" />
          </Form.Item>
        </Form>
      </Modal>

      <FormConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
        typeCode={selectedTypeCode}
        typeName={selectedTypeName}
      />
    </>
  );
};

export default TypeManagerModal;

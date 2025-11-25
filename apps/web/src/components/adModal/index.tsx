import { Modal } from 'antd';
import type { ReactNode, FC } from 'react';
import { memo } from 'react';
import AddForm from '../addForm';
import type { Ad } from '@/store';

interface Iprops {
  children?: ReactNode;
  showModal: boolean;
  selectedTypeCode?: string;
  title: string;
  editingAd?: Ad;
  editMode: boolean;
  initialTypeCode?: string;
  onCreated: () => void;
  onCancel: () => void;
}
const AdModal: FC<Iprops> = ({
  showModal,
  title,
  editingAd = undefined,
  editMode,
  initialTypeCode,
  onCancel,
  onCreated,
}) => {
  return (
    <Modal
      open={showModal}
      title={title}
      footer={null}
      onCancel={onCancel}
      destroyOnHidden
      width={680}
    >
      {showModal && (
        <AddForm
          initialTypeCode={initialTypeCode || ''}
          visible={true}
          onCancel={onCancel}
          onCreated={onCreated}
          editMode={editMode}
          editData={editingAd}
        />
      )}
    </Modal>
  );
};
export default memo(AdModal);

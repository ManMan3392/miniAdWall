import { DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Modal, Space, type MenuProps } from 'antd';
import type { ReactNode, FC } from 'react';
import { memo, useState } from 'react';
import style from './style.module.less';
import type { Ad } from '@/store';

interface Iprops {
  children?: ReactNode;
  adTitle: string;
  ad: Ad;
  onEdit?: (ad: any) => void;
  onCopy?: (ad: any) => void;
  onDelete?: (adId: string) => Promise<void>;
  onInteractionChange?: (open: boolean) => void;
}
const AdDetailHead: FC<Iprops> = ({
  adTitle,
  ad,
  onEdit,
  onCopy,
  onDelete,
  onInteractionChange,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'edit':
        if (onEdit) {
          onEdit(ad);
        }
        break;
      case 'copy':
        if (onCopy) {
          onCopy(ad);
        }
        break;
      case 'delete':
        setShowDeleteModal(true);
        if (onInteractionChange) onInteractionChange(true);
        break;
      default:
        break;
    }
  };
  const menuProps: MenuProps = {
    items: [
      { label: '编辑广告', key: 'edit' },
      { label: '复制广告', key: 'copy' },
      { label: '删除广告', key: 'delete' },
    ],
    onClick: (info) => {
      handleMenuClick(info.key);
    },
  };
  return (
    <>
      <div className={style.header}>
        <div className={style['ad-title']}>{adTitle || '广告标题'}</div>
        <div className={style.actions} onClick={(e) => e.stopPropagation()}>
          <Dropdown menu={menuProps}>
            <Button
              size="large"
              autoInsertSpace={false}
              style={{
                borderRadius: '5px',
                fontSize: '17px',
                padding: '0px 23px',
                fontWeight: '500',
              }}
            >
              <Space>
                操作
                <DownOutlined style={{ fontSize: 13 }} />
              </Space>
            </Button>
          </Dropdown>
        </div>
      </div>
      <Modal
        open={showDeleteModal}
        title="确认删除"
        okText="确认删除"
        okType="danger"
        cancelText="取消"
        confirmLoading={deleting}
        onCancel={() => {
          setShowDeleteModal(false);
          if (onInteractionChange) onInteractionChange(false);
        }}
        onOk={async () => {
          if (!onDelete) {
            setShowDeleteModal(false);
            if (onInteractionChange) onInteractionChange(false);
            return;
          }
          try {
            setDeleting(true);
            await onDelete(ad.id);
          } catch (e) {
            console.error('删除失败:', e);
          } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            if (onInteractionChange) onInteractionChange(false);
          }
        }}
      >
        <p>确定要删除广告"{ad.title}"吗？此操作不可恢复。</p>
      </Modal>
    </>
  );
};
export default memo(AdDetailHead);

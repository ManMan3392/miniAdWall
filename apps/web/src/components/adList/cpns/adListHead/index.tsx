import type { ReactNode, FC } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import style from './style.module.less';
import { Button, Dropdown, type MenuProps, Modal, Input, message } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import AdModal from '@/components/adModal';
import TypeManagerModal from '../typeManagerModal';

interface Iprops {
  children?: ReactNode;
  fetchAdList: (
    page?: number,
    pageSize?: number,
    options?: { silent?: boolean },
  ) => Promise<void>;
  adTypes?: { type_name: string; type_code: string }[];
  setAlertMessage: (msg: string) => void;
  setAlertType: (type: 'success' | 'info' | 'warning' | 'error') => void;
  setAlertVisible: (visible: boolean) => void;
  alertTimerRef: React.MutableRefObject<number | null>;
  setShowEditModal: (show: boolean) => void;
  setEditingAd: (ad: any) => void;
  showEditModal: boolean;
  editingAd: any;
  isCopyMode: boolean;
}
const AdListHeader: FC<Iprops> = ({
  adTypes,
  fetchAdList,
  setAlertMessage,
  setAlertType,
  setAlertVisible,
  alertTimerRef,
  setShowEditModal,
  setEditingAd,
  showEditModal,
  editingAd,
  isCopyMode,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTypeCode, setSelectedTypeCode] = useState<string | undefined>(
    undefined,
  );
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [typeManagerVisible, setTypeManagerVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleAuth = () => {
    if (password === 'admin') {
      setAuthModalVisible(false);
      setPassword('');
      setAuthError('');
      setTypeManagerVisible(true);
      message.success('验证通过');
    } else {
      setAuthError('密码错误，验证失败');
    }
  };

  const menuItems = useMemo(
    () =>
      adTypes && adTypes.length
        ? adTypes.map((t) => ({ label: t.type_name, key: t.type_code }))
        : [{ label: '暂无类型', key: 'empty', disabled: true }],
    [adTypes],
  );

  const menuProps: MenuProps = useMemo(
    () => ({
      items: menuItems,
      onClick: (info) => {
        if (info.key === 'empty') return;
        setSelectedTypeCode(info.key as string);
        setShowModal(true);
      },
    }),
    [menuItems, setSelectedTypeCode, setShowModal],
  );
  const handleCreated = useCallback(() => {
    fetchAdList(undefined, undefined, { silent: true });
    setShowModal(false);
    setAlertMessage('创建成功');
    setAlertType('success');
    setAlertVisible(true);
    if (alertTimerRef.current) window.clearTimeout(alertTimerRef.current);
    alertTimerRef.current = window.setTimeout(
      () => setAlertVisible(false),
      3000,
    );
  }, [
    fetchAdList,
    setShowModal,
    setAlertMessage,
    setAlertType,
    setAlertVisible,
    alertTimerRef,
  ]);

  const handleEdited = useCallback(() => {
    fetchAdList(undefined, undefined, { silent: true });
    setShowEditModal(false);
    setEditingAd(null);
    setAlertMessage('编辑成功');
    setAlertType('success');
    setAlertVisible(true);
    if (alertTimerRef.current) window.clearTimeout(alertTimerRef.current);
    alertTimerRef.current = window.setTimeout(
      () => setAlertVisible(false),
      3000,
    );
  }, [
    fetchAdList,
    setShowEditModal,
    setEditingAd,
    setAlertMessage,
    setAlertType,
    setAlertVisible,
    alertTimerRef,
  ]);

  return (
    <>
      <div className={style.add}>
        <Button
          type="primary"
          size="large"
          icon={<SettingOutlined style={{ fontSize: 15 }} />}
          style={{
            backgroundColor: 'rgb(51, 138, 255)',
            borderRadius: '5px',
            fontSize: '18px',
            padding: '0px 23px',
            fontWeight: '500',
            marginRight: 12,
          }}
          onClick={() => setAuthModalVisible(true)}
        >
          类型管理
        </Button>
        <Dropdown menu={menuProps} trigger={['click']}>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined style={{ fontSize: 15 }} />}
            style={{
              backgroundColor: 'rgb(51, 138, 255)',
              borderRadius: '5px',
              fontSize: '18px',
              padding: '0px 23px',
              fontWeight: '500',
            }}
          >
            新增广告
          </Button>
        </Dropdown>
      </div>
      <AdModal
        showModal={showModal || showEditModal}
        title={showModal ? '创建广告' : isCopyMode ? '复制广告' : '编辑广告'}
        editingAd={editingAd || undefined}
        editMode={showEditModal && !isCopyMode}
        onCancel={
          showModal
            ? () => setShowModal(false)
            : () => {
                setShowEditModal(false);
                setEditingAd(null);
              }
        }
        onCreated={showModal ? handleCreated : handleEdited}
        initialTypeCode={showModal ? selectedTypeCode : editingAd?.type_code}
      />
      <Modal
        title="管理员验证"
        open={authModalVisible}
        onOk={handleAuth}
        onCancel={() => {
          setAuthModalVisible(false);
          setPassword('');
          setAuthError('');
        }}
      >
        <Input.Password
          placeholder="请输入管理员密码"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (authError) setAuthError('');
          }}
          onPressEnter={handleAuth}
          status={authError ? 'error' : ''}
        />
        {authError && (
          <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '5px' }}>
            {authError}
          </div>
        )}
      </Modal>
      <TypeManagerModal
        visible={typeManagerVisible}
        onCancel={() => setTypeManagerVisible(false)}
      />
    </>
  );
};
export default memo(AdListHeader);

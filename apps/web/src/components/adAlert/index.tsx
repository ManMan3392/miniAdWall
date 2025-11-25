import { Alert } from 'antd';
import type { ReactNode, FC } from 'react';
import { memo } from 'react';

interface Iprops {
  children?: ReactNode;
  alertMessage: string;
  alertType: 'success' | 'info' | 'warning' | 'error';
  onClose: () => void;
}
const AdAlert: FC<Iprops> = ({ alertMessage, alertType, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'min(720px, 90%)',
        padding: '0 12px',
      }}
    >
      <Alert
        message={alertMessage}
        type={alertType}
        closable
        onClose={onClose}
      />
    </div>
  );
};
export default memo(AdAlert);

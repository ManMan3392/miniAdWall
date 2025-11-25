import { Modal } from 'antd';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import style from './style.module.less';

interface VideoModalProps {
  visible: boolean;
  videoUrl: string;
  onClose: () => void;
  onVideoEnd: () => void;
  autoRedirect?: boolean;
}

const VideoModal: FC<VideoModalProps> = ({
  visible,
  videoUrl,
  onClose,
  onVideoEnd,
  autoRedirect = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [Close, setClose] = useState(false);

  useEffect(() => {
    if (visible && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error('视频播放失败:', err);
      });
    }
  }, [visible]);

  const handleVideoEnd = () => {
    setClose(true);
    if (autoRedirect) {
      onVideoEnd();
    }
  };

  const handleClose = (forced?: boolean) => {
    if (forced) {
      if (videoRef.current) videoRef.current.pause();
      setClose(false);
      onClose();
      return;
    }
    if (Close || !autoRedirect) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setClose(false);
      onClose();
    }
  };

  const handleCancel = () => {
    if (Close) {
      handleClose(true);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      centered
      closable={false}
      maskClosable={false}
      className={style['video-modal']}
    >
      <div className={style['video-container']}>
        <div
          className={style['close-btn']}
          onClick={() => handleClose(true)}
          role="button"
          aria-label="关闭视频"
        >
          ×
        </div>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className={style.video}
          onEnded={handleVideoEnd}
          controlsList="nodownload"
          preload="metadata"
        />
        {!Close && autoRedirect && (
          <div className={style.tip}>请观看完整视频后跳转</div>
        )}
      </div>
    </Modal>
  );
};

export default VideoModal;

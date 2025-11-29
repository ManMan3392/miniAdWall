import { memo, useState } from 'react';
import type { ReactNode, FC, MouseEvent } from 'react';
import style from './style.module.less';
import type { Ad } from '@/store';
import VideoModal from '../videoModal';
import { incrementAdHeat } from '@/service/ad';
import AdDetailHead from './cpns/adDetailHead';
import AdDetailFoot from './cpns/adDetailFoot';

interface Iprops {
  children?: ReactNode;
  ad: Ad;
  onPriceUpdate?: (adId: string, newPrice: number) => Promise<void>;
  onEdit?: (ad: Ad) => void;
  onCopy?: (ad: Ad) => void;
  onDelete?: (adId: string) => Promise<void>;
  onHeatIncrement?: () => void;
}

const AdDetail: FC<Iprops> = ({
  ad,
  onPriceUpdate,
  onEdit,
  onCopy,
  onDelete,
  onHeatIncrement,
}) => {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(false);

  const handleAdClick = (e?: MouseEvent) => {
    if (interactionOpen) {
      e?.stopPropagation();
      return;
    }

    const hasVideoUrls =
      Array.isArray(ad.video_urls) && ad.video_urls.length > 0;
    const hasVideoIdsString =
      typeof ad.video_ids === 'string' && ad.video_ids.trim() !== '';
    const hasVideoIdsArray =
      Array.isArray(ad.video_ids) && ad.video_ids.length > 0;
    const hasVideo = hasVideoUrls || hasVideoIdsString || hasVideoIdsArray;
    if (hasVideo) {
      setShowVideoModal(true);
    } else {
      redirectToLanding();
    }
  };

  const redirectToLanding = async () => {
    try {
      await incrementAdHeat(ad.id);
      if (onHeatIncrement) {
        onHeatIncrement();
      }
    } catch (error) {
      console.error('热度增加失败:', error);
    }

    const url =
      ad.landing_url && ad.landing_url.startsWith('http')
        ? ad.landing_url
        : `https://${ad.landing_url || ''}`;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVideoEnd = () => {
    setShowVideoModal(false);
    setTimeout(() => redirectToLanding(), 300);
  };

  const getVideoUrl = () => {
    const urls = ad.video_urls;
    if (Array.isArray(urls) && urls.length > 0) {
      const candidates = urls.filter(Boolean);
      if (candidates.length === 0) return '';
      const randomPath =
        candidates[Math.floor(Math.random() * candidates.length)];
      if (!randomPath) return '';
      return randomPath.includes('http')
        ? randomPath
        : `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}${randomPath.startsWith('/') ? '' : '/'}${randomPath}`;
    }
    return '';
  };

  return (
    <>
      <div className={style.container} onClick={handleAdClick}>
        <AdDetailHead
          adTitle={ad.title}
          onEdit={onEdit}
          onCopy={onCopy}
          onDelete={onDelete}
          onInteractionChange={(open: boolean) => setInteractionOpen(open)}
          ad={ad}
        />
        <div className={style['ad-content']}>
          <div style={{ marginBottom: 8, color: '#888' }}>
            发布人：{ad.publisher || '未知'}
          </div>
          {ad.content || '这里是广告的详细内容，描述广告的相关信息。'}
        </div>
        <AdDetailFoot ad={ad} onPriceUpdate={onPriceUpdate} />
      </div>

      {showVideoModal && (
        <VideoModal
          visible={showVideoModal}
          videoUrl={getVideoUrl()}
          onClose={() => setShowVideoModal(false)}
          onVideoEnd={handleVideoEnd}
          autoRedirect={true}
        />
      )}
    </>
  );
};

export default memo(AdDetail);

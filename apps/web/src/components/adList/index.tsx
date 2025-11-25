import type { ReactNode, FC } from 'react';
import { memo, useEffect, useState, useCallback, useRef } from 'react';

import style from './style.module.less';
import AdDetail from '../adDetail';
import AdDetailSkeleton from '../adDetailSkeleton';
import { useAdStore, type Ad } from '@/store/index';
import AdAlert from '../adAlert';
import AdListHeader from './cpns/adListHead';

interface Iprops {
  children?: ReactNode;
}

const AdList: FC<Iprops> = () => {
  const {
    adList,
    loading,
    fetchAdList,
    updatePrice,
    deleteAdData,
    adTypes,
    fetchAdTypes,
  } = useAdStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<
    'success' | 'info' | 'warning' | 'error'
  >('success');
  const alertTimerRef = useRef<number | null>(null);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);

  useEffect(() => {
    fetchAdList();
    if (!adTypes || adTypes.length === 0) fetchAdTypes();
  }, [fetchAdList, fetchAdTypes, adTypes]);

  const [flushTimer, setFlushTimer] = useState<number | null>(null);
  const pendingRef = useRef<Record<string, number>>({});

  const flushPrices = useCallback(async () => {
    const entries = Object.entries(pendingRef.current || {});
    console.log('[AdList] flushPrices', entries);
    pendingRef.current = {};
    setFlushTimer(null);
    for (const [id, val] of entries) {
      await updatePrice(id, val);
      setAlertMessage('出价更新成功');
      setAlertType('success');
      setAlertVisible(true);
      if (alertTimerRef.current) window.clearTimeout(alertTimerRef.current);
      alertTimerRef.current = window.setTimeout(
        () => setAlertVisible(false),
        3000,
      );
    }
  }, [updatePrice]);

  const queuePriceUpdate = useCallback(
    (adId: string, newPrice: number) => {
      useAdStore.getState().setLocalPrice(adId, newPrice);
      const next = { ...(pendingRef.current || {}), [adId]: newPrice };
      pendingRef.current = next;
      if (flushTimer) {
        window.clearTimeout(flushTimer);
      }
      const timer = window.setTimeout(() => {
        flushPrices();
      }, 150);
      setFlushTimer(timer);
    },
    [flushTimer, flushPrices],
  );

  const handlePriceUpdate = useCallback(
    async (adId: string, newPrice: number) => {
      queuePriceUpdate(adId, newPrice);
    },
    [queuePriceUpdate],
  );

  const handleEdit = useCallback((ad: Ad) => {
    setEditingAd(ad);
    setIsCopyMode(false);
    setShowEditModal(true);
  }, []);

  const handleCopy = useCallback((ad: Ad) => {
    setEditingAd(ad);
    setIsCopyMode(true);
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback(
    async (adId: string) => {
      try {
        await deleteAdData(adId);
        setAlertMessage('删除成功');
        setAlertType('success');
        setAlertVisible(true);
        if (alertTimerRef.current) window.clearTimeout(alertTimerRef.current);
        alertTimerRef.current = window.setTimeout(
          () => setAlertVisible(false),
          3000,
        );
      } catch (err) {
        setAlertMessage('删除失败');
        setAlertType('error');
        setAlertVisible(true);
        if (alertTimerRef.current) window.clearTimeout(alertTimerRef.current);
        alertTimerRef.current = window.setTimeout(
          () => setAlertVisible(false),
          3000,
        );
        throw err;
      }
    },
    [deleteAdData],
  );

  return (
    <div className={style.content}>
      <AdListHeader
        fetchAdList={fetchAdList}
        setShowEditModal={setShowEditModal}
        setEditingAd={setEditingAd}
        showEditModal={showEditModal}
        editingAd={editingAd}
        isCopyMode={isCopyMode}
        adTypes={adTypes}
        setAlertMessage={setAlertMessage}
        setAlertType={setAlertType}
        setAlertVisible={setAlertVisible}
        alertTimerRef={alertTimerRef}
      />
      <div className={style['ad-list']}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <AdDetailSkeleton key={i} />)
        ) : adList.length > 0 ? (
          adList.map((ad) => (
            <AdDetail
              key={ad.id}
              ad={ad}
              onPriceUpdate={handlePriceUpdate}
              onEdit={handleEdit}
              onCopy={handleCopy}
              onDelete={handleDelete}
              onHeatIncrement={() =>
                fetchAdList(undefined, undefined, { silent: true })
              }
            />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无广告数据
          </div>
        )}
      </div>

      {alertVisible && (
        <AdAlert
          alertMessage={alertMessage}
          alertType={alertType}
          onClose={() => {
            setAlertVisible(false);
            if (alertTimerRef.current) {
              window.clearTimeout(alertTimerRef.current);
              alertTimerRef.current = null;
            }
          }}
        />
      )}
    </div>
  );
};

export default memo(AdList);

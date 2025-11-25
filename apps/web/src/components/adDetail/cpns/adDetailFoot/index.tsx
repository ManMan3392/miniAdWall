import type { ReactNode, FC } from 'react';
import { memo, useEffect, useState } from 'react';
import style from './style.module.less';
import { InputNumber } from 'antd';
import type { Ad } from '@/store';

interface Iprops {
  children?: ReactNode;
  ad: Ad;
  onPriceUpdate?: (adId: string, newPrice: number) => Promise<void>;
}
const AdDetailFooter: FC<Iprops> = ({ ad, onPriceUpdate }) => {
  const [priceInput, setPriceInput] = useState<number>(ad.price);

  useEffect(() => {
    setPriceInput(ad.price);
  }, [ad.price]);

  const handlePriceUpdate = async (newPrice: number | null) => {
    if (!ad || newPrice === null) return;

    try {
      if (onPriceUpdate) {
        await onPriceUpdate(ad.id, newPrice);
      }
    } catch (error) {
      console.error('Failed to update price:', error);
    }
  };

  return (
    <div className={style.footer}>
      <div className={style['footer-item'] + ' ' + style.hot}>
        <div className="hotTitle">热度：</div>
        <div className="hotNumber">{ad.heat ?? 0}</div>
      </div>
      <div
        className={style['footer-item'] + ' ' + style.price}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={style.priceTitle}>出价：</div>
        <InputNumber
          className={style.priceNumber}
          value={priceInput}
          min={0}
          step={0.01}
          precision={2}
          onChange={(val) => {
            if (typeof val === 'number') setPriceInput(val);
          }}
          onBlur={() => {
            // 仅在值改变且有效时提交，减少不必要请求
            if (!isNaN(priceInput) && priceInput !== ad.price) {
              handlePriceUpdate(priceInput);
            }
          }}
          style={{ width: 100 }}
        />
      </div>
    </div>
  );
};
export default memo(AdDetailFooter);

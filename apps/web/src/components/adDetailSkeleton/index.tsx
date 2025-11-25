import { Skeleton } from 'antd';
import style from './style.module.less';

const AdDetailSkeleton = () => {
  return (
    <div className={style['skeleton-container']}>
      <Skeleton.Button active style={{ width: 120, height: 32 }} />
      <Skeleton active paragraph={{ rows: 3 }} />
      <div className={style['skeleton-footer']}>
        <Skeleton.Button active style={{ width: 80 }} />
        <Skeleton.Button active style={{ width: 100 }} />
      </div>
    </div>
  );
};

export default AdDetailSkeleton;

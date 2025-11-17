import { memo } from 'react';
import type { ReactNode, FC } from 'react';
import style from './style.module.less';
import { DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';

interface Iprops {
  children?: ReactNode;
}
const AdDetail: FC<Iprops> = () => {
  const menuProps: MenuProps = {
    items: [
      { label: '操作一', key: '1' },
      { label: '操作二', key: '2' },
      { label: '操作三', key: '3' },
    ],
    onClick: (info) => {
      console.log('menu click', info);
    },
  };

  return (
    <div className={style.container}>
      <div className={style.header}>
        <div className={style['ad-title']}>广告标题</div>
        <div className={style.actions}>
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
      <div className={style['ad-content']}>
        这里是广告的详细内容，描述广告的相关信息。
      </div>
      <div className={style.footer}>
        <div className={style['footer-item'] + ' ' + style.hot}>
          <div className="hotTitle">热度：</div>
          <div className="hotNumber">0</div>
        </div>
        <div className={style['footer-item'] + ' ' + style.price}>
          <div className={style.priceTitle}>出价：</div>
          <div className={style.priceNumber}>123</div>
        </div>
      </div>
    </div>
  );
};
export default memo(AdDetail);

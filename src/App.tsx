import { PlusOutlined } from '@ant-design/icons';
import AdDetail from './components/adDetail';
import style from './style.module.less';
import { Button } from 'antd';

function App() {
  return (
    <div className={style.bg}>
      <div className={style.title}>Mini广告墙</div>
      <div className={style.content}>
        <div className={style.add}>
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
        </div>
        <div className={style['ad-list']}>
          <AdDetail />
        </div>
      </div>
    </div>
  );
}

export default App;

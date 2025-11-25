import style from './style.module.less';
import AdList from './components/adList';

function App() {
  return (
    <div className={style.bg}>
      <div className={style.title}>Mini广告墙</div>
      <AdList />
    </div>
  );
}

export default App;

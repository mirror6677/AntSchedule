import dva from 'dva';
import './css/index.css';

const app = dva();
app.router(require('./router').default);
app.start('#root');

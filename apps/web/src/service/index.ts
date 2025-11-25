import { BASE_URL, TIME_OUT } from './config/index';
import MyRequest from './request/index';

const myRequest = new MyRequest({
  baseURL: BASE_URL,
  timeout: TIME_OUT,
  interceptors: {
    requestSuccessFn: (config) => {
      // 每一个请求都自动携带token

      return config;
    },
  },
});

export default myRequest;

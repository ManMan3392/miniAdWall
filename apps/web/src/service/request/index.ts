import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface MyInterceptors {
  requestSuccessFn?: (config: any) => any;
  requestFailureFn?: (err: any) => any;
  responseSuccessFn?: (res: AxiosResponse) => AxiosResponse;
  responseFailureFn?: (err: any) => any;
}

interface MyRequestConfig extends AxiosRequestConfig {
  interceptors?: MyInterceptors;
}

class MyRequest {
  instance: AxiosInstance;

  constructor(config: MyRequestConfig) {
    this.instance = axios.create(config);

    this.instance.interceptors.request.use(
      (config: any) => {
        return config;
      },
      (err: any) => {
        return err;
      },
    );

    this.instance.interceptors.response.use(
      (res: AxiosResponse) => {
        console.log(res.data);
        return res.data;
      },
      (err: any) => {
        return Promise.reject(err);
      },
    );
  }

  request(config: MyRequestConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      this.instance
        .request(config)
        .then((res: any) => {
          resolve(res);
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  }

  get(config: MyRequestConfig): Promise<any> {
    return this.request({ ...config, method: 'GET' } as MyRequestConfig);
  }

  post(config: MyRequestConfig): Promise<any> {
    return this.request({ ...config, method: 'POST' } as MyRequestConfig);
  }

  delete(config: MyRequestConfig): Promise<any> {
    return this.request({ ...config, method: 'DELETE' } as MyRequestConfig);
  }

  patch(config: MyRequestConfig): Promise<any> {
    return this.request({ ...config, method: 'PATCH' } as MyRequestConfig);
  }
}

export default MyRequest;

import axios from 'axios'
import type {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'
import { useAuthStore } from '@/stores/Auth';
import hash from 'object-hash';

interface AxiosApi extends AxiosInstance {
  cacheableRequest: (config: AxiosRequestConfig) => Promise<AxiosResponse>;
}
const auth = useAuthStore();
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
axios.defaults.baseURL = BACKEND_URL;
const axiosInstance = axios.create({
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json; charset=UTF-8',
    },
    validateStatus: () => { return false; },
}) as AxiosApi;
axiosInstance.interceptors.request.use(
  config => {
    config.headers.Authorization = `Bearer ${auth.getAccessToken}`;
    return config;
  },
);
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if(error.response.status === 401){
      auth.logout(true);
    }
  return error;
  }
);
axiosInstance.cacheableRequest = async (config: AxiosRequestConfig, storage: Storage = sessionStorage, 
valid_codes : number[] = [200]): Promise<AxiosResponse> => {
  const request_id = hash(config);
  let output = null;
  if(storage.getItem(request_id) != null){
    output = JSON.parse(storage.getItem(request_id) as string);
  }else{
    output = await axiosInstance.request(config);
    if(valid_codes.includes(output.status)){
      storage.setItem(request_id, JSON.stringify(output));
    }
  }
  return output;
}
export default axiosInstance;

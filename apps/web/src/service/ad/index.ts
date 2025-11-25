import myRequest from '../index';
export type { FormConfig, FormField, CreateAdInput } from './validator';
export { validateCreateAdPayload, assertCreateAdValid } from './validator';

export function getAdList(page = 1, size = 5) {
  return myRequest.request({
    url: '/api/ads',
    method: 'GET',
    params: { page, size },
  });
}

export function getAdTypes() {
  return myRequest.request({
    url: '/api/ad-types',
    method: 'GET',
  });
}

export function getFormConfig(typeCode: string, configKey = 'ad_create_form') {
  return myRequest.request({
    url: '/api/form-config',
    method: 'GET',
    params: { type_code: typeCode, config_key: configKey },
  });
}

export function createAd(data: {
  type_id: number;
  publisher: string;
  title: string;
  content: string;
  heat: number;
  price: number;
  landing_url: string;
  video_ids?: string | string[];
  ext_info?: any;
}) {
  return myRequest.request({
    url: '/api/ads',
    method: 'POST',
    data,
  });
}

export function updateAdPrice(adId: string, price: number) {
  return myRequest.request({
    url: `/api/ads/${adId}/price`,
    method: 'PUT',
    data: { price },
  });
}

export function updateAd(adId: string, data: any) {
  return myRequest.request({
    url: `/api/ads/${adId}`,
    method: 'PUT',
    data,
  });
}

export function copyAd(adId: string) {
  return myRequest.request({
    url: `/api/ads/${adId}/copy`,
    method: 'POST',
  });
}

export function deleteAd(adId: string) {
  return myRequest.request({
    url: `/api/ads/${adId}`,
    method: 'DELETE',
  });
}

export function incrementAdHeat(adId: string) {
  return myRequest.request({
    url: `/api/ads/${adId}/increment-heat`,
    method: 'POST',
  });
}

export function uploadVideo(formData: FormData) {
  return myRequest.request({
    url: '/api/videos/upload',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

import { apiRequest } from './client';
import type { FormSetting } from '../utils/types';

export function getFormSetting(): Promise<FormSetting> {
  return apiRequest<FormSetting>('/form-settings');
}

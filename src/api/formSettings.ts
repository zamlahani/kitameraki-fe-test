import { apiRequest } from './client';
import type { FormRow, FormSetting } from '../utils/types';

export function getFormSetting(): Promise<FormSetting> {
  return apiRequest<FormSetting>('/form-settings');
}

export function saveFormSetting(rows: FormRow[]): Promise<FormSetting> {
  return apiRequest<FormSetting>('/form-settings', {
    method: 'PUT',
    body: JSON.stringify({ rows }),
  });
}

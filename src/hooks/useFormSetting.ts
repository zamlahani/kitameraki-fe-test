import { useMemo } from 'react';
import useSWR from 'swr';
import { getFormSetting } from '../api/formSettings';
import { activeFields } from '../utils/customFields';
import type { FormField, FormSetting } from '../utils/types';

interface FormSettingState {
  fields: FormField[];
  formSettingError?: unknown;
  retryFormSetting: () => void;
}

export function useFormSetting(): FormSettingState {
  const { data, error, mutate } = useSWR<FormSetting>('form-settings', getFormSetting);

  const fields = useMemo(() => activeFields(data), [data]);

  return {
    fields,
    formSettingError: error && !data ? error : undefined,
    retryFormSetting: () => {
      void mutate();
    },
  };
}

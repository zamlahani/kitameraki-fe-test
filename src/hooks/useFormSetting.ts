import { useMemo } from 'react';
import useSWR from 'swr';
import { getFormSetting } from '../api/formSettings';
import type { FormField, FormRow, FormSetting } from '../utils/types';

interface FormSettingState {
  rows: FormRow[];
  fields: FormField[];
  formSettingError?: unknown;
  retryFormSetting: () => void;
}

export function useFormSetting(): FormSettingState {
  const { data, error, mutate } = useSWR<FormSetting>('form-settings', getFormSetting);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const fields = useMemo(() => rows.flatMap((row) => row.fields), [rows]);

  return {
    rows,
    fields,
    formSettingError: error && !data ? error : undefined,
    retryFormSetting: () => {
      void mutate();
    },
  };
}

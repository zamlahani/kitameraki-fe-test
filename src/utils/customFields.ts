import type { FormField } from './types';
import { dayjs } from './helpers';

export function toFieldValue(field: FormField, value: string | undefined): string {
  const raw = value ?? '';
  if (!raw || field.type !== 'datetime') {
    return raw;
  }
  const parsed = dayjs(raw);
  return parsed.isValid() ? parsed.format('YYYY-MM-DDTHH:mm') : raw;
}

export function toFieldApiValue(field: FormField, value: string | undefined): string {
  const raw = (value ?? '').trim();
  if (!raw) {
    return '';
  }
  if (field.type === 'datetime') {
    const parsed = dayjs(raw);
    return parsed.isValid() ? parsed.toISOString() : raw;
  }
  return raw;
}

export function formatFieldValue(field: FormField, value: string | undefined): string {
  if (!value) {
    return '-';
  }
  const parsed = dayjs(value);
  if (field.type === 'date') {
    return parsed.isValid() ? parsed.format('ll') : value;
  }
  if (field.type === 'datetime') {
    return parsed.isValid() ? parsed.format('lll') : value;
  }
  return value;
}

export function toCustomFieldValues(
  fields: FormField[],
  values: Record<string, string> | undefined,
): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field.id, toFieldValue(field, values?.[field.id])]));
}

export function buildCustomFields(fields: FormField[], values: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of fields) {
    if (field.disabled) {
      continue;
    }
    const value = toFieldApiValue(field, values[field.id]);
    if (value) {
      result[field.id] = value;
    }
  }
  return result;
}

export function missingRequiredFields(fields: FormField[], values: Record<string, string>): FormField[] {
  return fields.filter((field) => !field.disabled && field.required && !(values[field.id] ?? '').trim());
}

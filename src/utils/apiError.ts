import { ApiError } from '../api/client';
import { TASK_FIELD_LABELS } from './helpers';
import type { FormField } from './types';

export interface ErrorInfo {
  message: string;
  details: string[];
}

export function describeError(err: unknown, fallback: string, fields: FormField[] = []): ErrorInfo {
  if (!(err instanceof ApiError)) {
    return { message: fallback, details: [] };
  }

  const labels = new Map(Object.entries(TASK_FIELD_LABELS));
  for (const field of fields) {
    labels.set(field.id, field.label);
  }

  const details = (err.details ?? []).map((detail) => {
    return detail.replace(/[A-Za-z0-9_-]+/g, (token) => labels.get(token) ?? token)
  })

  return { message: err.message, details };
}

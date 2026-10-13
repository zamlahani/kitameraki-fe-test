import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import type { TaskPriority, TaskStatus } from "./types";

dayjs.extend(localizedFormat);
export { dayjs };

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  completed: 'Completed',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const TASK_FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  dueDate: 'Due date',
  priority: 'Priority',
  status: 'Status',
  tags: 'Tags',
  customFields: 'Custom fields',
};

export function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatTags(tags?: string[]): string {
  return tags && tags.length > 0 ? tags.join(', ') : '-';
}


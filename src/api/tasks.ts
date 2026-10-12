import { apiRequest } from './client';
import { buildTaskListParams } from '../utils/query';
import type { Task, TaskInput, TaskListQuery, TaskListResult } from '../utils/types';

export function listTasks(query: TaskListQuery, signal?: AbortSignal): Promise<TaskListResult> {
  return apiRequest<TaskListResult>(`/tasks?${buildTaskListParams(query).toString()}`, { signal });
}

export function createTask(input: TaskInput): Promise<Task> {
  return apiRequest<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTask(id: string, patch: Partial<TaskInput>): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

export function deleteTask(id: string): Promise<void> {
  return apiRequest<void>(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

export function bulkDeleteTasks(ids: string[]): Promise<{ deleted: number }> {
  return apiRequest<{ deleted: number }>('/tasks/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

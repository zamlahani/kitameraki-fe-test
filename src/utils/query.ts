import type { Task, TaskListQuery } from './types';

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function taskMatchesQuery(task: Task, query: TaskListQuery): boolean {
  if (query.status && task.status !== query.status) {
    return false;
  }
  if (query.priority && task.priority !== query.priority) {
    return false;
  }
  if (query.tag) {
    if (!(task.tags ?? []).includes(query.tag.trim())) {
      return false;
    }
  }
  if (query.q) {
    const q = query.q.trim().toLowerCase();
    const inText =
      task.title.toLowerCase().includes(q) || (task.description ?? '').toLowerCase().includes(q);
    const inTags = (task.tags ?? []).includes(q);
    if (!inText && !inTags) {
      return false;
    }
  }
  return true;
}

export function buildTaskListParams(query: TaskListQuery): URLSearchParams {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });

  if (query.q) {
    params.set('q', query.q);
  }
  if (query.status) {
    params.set('status', query.status);
  }
  if (query.priority) {
    params.set('priority', query.priority);
  }
  if (query.tag) {
    params.set('tag', query.tag);
  }

  return params;
}

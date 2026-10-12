import type { Task, TaskDraft, TaskInput, TaskStatus } from './types';
import { dayjs, parseTags } from './helpers';

export function toTaskDraft(task: Task): TaskDraft {
  const d = dayjs(task.dueDate);
  return {
    title: task.title,
    description: task.description ?? '',
    dueDate: !task.dueDate || !d.isValid() ? '' : d.format('YYYY-MM-DDTHH:mm'),
    priority: task.priority ?? 'medium',
    tags: (task.tags ?? []).join(', '),
  };
}

export function emptyTaskDraft(): TaskDraft {
  return { title: '', description: '', dueDate: '', priority: 'medium', tags: '' };
}

export function buildTaskInput(draft: TaskDraft, status: TaskStatus): TaskInput {
  const description = draft.description.trim();
  const d = dayjs(draft.dueDate);
  const dueDate = d.isValid() ? d.toISOString() : undefined;

  return {
    title: draft.title.trim(),
    status,
    priority: draft.priority,
    tags: parseTags(draft.tags),
    ...(description ? { description } : {}),
    ...(dueDate ? { dueDate } : {}),
  };
}

export function buildTaskUpdate(draft: TaskDraft): Partial<TaskInput> {
  const d = dayjs(draft.dueDate);
  const dueDate = d.isValid() ? d.toISOString() : undefined;

  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    priority: draft.priority,
    tags: parseTags(draft.tags),
    ...(dueDate ? { dueDate } : {}),
  };
}

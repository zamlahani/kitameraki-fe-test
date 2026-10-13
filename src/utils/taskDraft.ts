import type { FormField, Task, TaskDraft, TaskInput, TaskStatus } from './types';
import { dayjs, parseTags } from './helpers';
import { buildCustomFields, toCustomFieldValues } from './customFields';

export function toTaskDraft(task: Task, fields: FormField[] = []): TaskDraft {
  const d = dayjs(task.dueDate);
  return {
    title: task.title,
    description: task.description ?? '',
    dueDate: !task.dueDate || !d.isValid() ? '' : d.format('YYYY-MM-DDTHH:mm'),
    priority: task.priority ?? 'medium',
    tags: (task.tags ?? []).join(', '),
    customFields: toCustomFieldValues(fields, task.customFields),
  };
}

export function emptyTaskDraft(): TaskDraft {
  return { title: '', description: '', dueDate: '', priority: 'medium', tags: '', customFields: {} };
}

export function buildTaskInput(draft: TaskDraft, status: TaskStatus, fields: FormField[] = []): TaskInput {
  const description = draft.description.trim();
  const d = dayjs(draft.dueDate);
  const dueDate = d.isValid() ? d.toISOString() : undefined;
  const customFields = buildCustomFields(fields, draft.customFields);

  return {
    title: draft.title.trim(),
    status,
    priority: draft.priority,
    tags: parseTags(draft.tags),
    ...(description ? { description } : {}),
    ...(dueDate ? { dueDate } : {}),
    ...(Object.keys(customFields).length > 0 ? { customFields } : {}),
  };
}

export function buildTaskUpdate(task: Task, draft: TaskDraft, fields: FormField[] = []): Partial<TaskInput> {
  const patch: Partial<TaskInput> = {};

  const title = draft.title.trim();
  if (title !== task.title) {
    patch.title = title;
  }

  const description = draft.description.trim();
  if (description !== (task.description ?? '')) {
    patch.description = description;
  }

  if (draft.priority !== (task.priority ?? 'medium')) {
    patch.priority = draft.priority;
  }

  const tags = parseTags(draft.tags);
  if (!sameList(tags, task.tags ?? [])) {
    patch.tags = tags;
  }

  const dueDate = dayjs(draft.dueDate);
  if (dueDate.isValid()) {
    if (!task.dueDate || !dueDate.isSame(dayjs(task.dueDate), 'minute')) {
      patch.dueDate = dueDate.toISOString();
    }
  } else if (task.dueDate) {
    patch.dueDate = null;
  }

  const customFields = buildCustomFields(fields, draft.customFields);
  const currentCustomFields = buildCustomFields(fields, toCustomFieldValues(fields, task.customFields));
  if (!sameRecord(customFields, currentCustomFields)) {
    patch.customFields = customFields;
  }

  return patch;
}

function sameList(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameRecord(left: Record<string, string>, right: Record<string, string>): boolean {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => left[key] === right[key]);
}

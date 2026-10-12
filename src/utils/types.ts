export const TASK_STATUSES = ['todo', 'in-progress', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface TaskBaseFields {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
}

export interface TaskDraft extends TaskBaseFields {
  description: string;
  dueDate: string;
  priority: TaskPriority;
  tags: string;
}

export interface TaskInput extends TaskBaseFields {
  status: TaskStatus;
  tags?: string[];
}

export interface Task extends TaskInput {
  id: string;
  organizationId: string;
}

export interface TaskListQuery {
  q?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tag?: string;
  page: number;
  pageSize: number;
}

export interface TaskListResult {
  items: Task[];
  total: number;
}

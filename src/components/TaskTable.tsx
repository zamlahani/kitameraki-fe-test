import { Checkbox, Table, TableBody, TableHeader, TableHeaderCell, TableRow, makeStyles } from '@fluentui/react-components';
import type { Task, TaskInput, TaskStatus } from '../utils/types';
import { TaskRow } from './TaskRow';

interface TaskTableProps {
  tasks: Task[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onUpdate: (id: string, patch: Partial<TaskInput>) => Promise<void>;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
  onDelete: (task: Task) => void;
}

const useStyles = makeStyles({
  wrapper: {
    overflowX: 'auto',
  },
  select: {
    width: '40px',
  },
});

export function TaskTable({
  tasks,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onUpdate,
  onStatusChange,
  onDelete,
}: TaskTableProps) {
  const styles = useStyles();
  const allSelected = tasks.length > 0 && tasks.every((task) => selectedIds.includes(task.id));
  const someSelected = tasks.some((task) => selectedIds.includes(task.id));

  return (
    <div className={styles.wrapper}>
      <Table size="small">
        <TableHeader>
          <TableRow>
            <TableHeaderCell className={styles.select}>
              <Checkbox
                checked={allSelected ? true : someSelected ? 'mixed' : false}
                onChange={(_, data) => onToggleSelectAll(Boolean(data.checked))}
              />
            </TableHeaderCell>
            <TableHeaderCell>Title</TableHeaderCell>
            <TableHeaderCell>Description</TableHeaderCell>
            <TableHeaderCell>Due date</TableHeaderCell>
            <TableHeaderCell>Priority</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Tags</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              selected={selectedIds.includes(task.id)}
              onToggleSelect={onToggleSelect}
              onUpdate={onUpdate}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

import { useState } from 'react';
import {
  Button,
  Checkbox,
  Dropdown,
  Input,
  Option,
  TableCell,
  TableRow,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { DeleteRegular, DismissRegular, EditRegular, SaveRegular } from '@fluentui/react-icons';
import { TASK_PRIORITIES, TASK_STATUSES, type FormField, type Task, type TaskDraft, type TaskInput, type TaskPriority, type TaskStatus } from '../utils/types';
import { useErrorToast } from '../hooks/useErrorToast';
import { dayjs, formatTags, PRIORITY_LABELS, STATUS_LABELS } from '../utils/helpers';
import { buildTaskUpdate, toTaskDraft } from '../utils/taskDraft';
import { missingRequiredFields } from '../utils/customFields';
import { formatFieldValue } from '../utils/customFields';
import { CustomFieldInput } from './CustomFieldInput';

interface TaskRowProps {
  task: Task;
  fields: FormField[];
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<TaskInput>) => Promise<void>;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
  onDelete: (task: Task) => void;
}

const useStyles = makeStyles({
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  confirm: {
    color: tokens.colorBrandForeground1,
  },
  danger: {
    color: tokens.colorPaletteRedForeground1,
  },
  field: {
    minWidth: '0',
    width: '100%',
  },
  select: {
    width: '40px',
  },
});

export function TaskRow({ task, fields, selected, onToggleSelect, onUpdate, onStatusChange, onDelete }: TaskRowProps) {
  const styles = useStyles();
  const showError = useErrorToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>(() => toTaskDraft(task, fields));
  const [busy, setBusy] = useState(false);

  const startEditing = () => {
    setDraft(toTaskDraft(task, fields));
    setEditing(true);
  };

  const save = async () => {
    const missing = missingRequiredFields(fields, draft.customFields);
    if (missing.length > 0) {
      showError(
        `Save "${task.title}" failed`,
        undefined,
        `Required: ${missing.map((field) => field.label).join(', ')}`,
      );
      return;
    }

    setBusy(true);
    try {
      const patch = buildTaskUpdate(task, draft, fields);
      if (Object.keys(patch).length > 0) {
        await onUpdate(task.id, patch);
      }
      setEditing(false);
    } catch (err) {
      showError(`Save "${task.title}" failed`, err, 'Please try again.', fields);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status: TaskStatus) => {
    setBusy(true);
    try {
      await onStatusChange(task, status);
    } catch (err) {
      showError(`Update "${task.title}" failed`, err, 'Please try again.', fields);
    } finally {
      setBusy(false);
    }
  };

  const remove = () => onDelete(task);

  const d = dayjs(task.dueDate);
  const dueDateLabel = task.dueDate && d.isValid() ? d.format('lll') : '-';

  return (
    <TableRow>
      <TableCell className={styles.select}>
        <Checkbox checked={selected} onChange={() => onToggleSelect(task.id)} />
      </TableCell>
      <TableCell>
        {editing ? (
          <Input
            className={styles.field}
            value={draft.title}
            required
            disabled={busy}
            onChange={(_, data) => setDraft({ ...draft, title: data.value })}
          />
        ) : (
          task.title
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <Input
            className={styles.field}
            value={draft.description}
            disabled={busy}
            onChange={(_, data) => setDraft({ ...draft, description: data.value })}
          />
        ) : (
          (task.description ?? '-')
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <Input
            className={styles.field}
            type="datetime-local"
            value={draft.dueDate}
            disabled={busy}
            onChange={(_, data) => setDraft({ ...draft, dueDate: data.value })}
          />
        ) : (
          dueDateLabel
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <Dropdown
            className={styles.field}
            value={PRIORITY_LABELS[draft.priority]}
            selectedOptions={[draft.priority]}
            disabled={busy}
            onOptionSelect={(_, data) => {
              if (data.optionValue) {
                setDraft({ ...draft, priority: data.optionValue as TaskPriority });
              }
            }}
          >
            {TASK_PRIORITIES.map((priority) => (
              <Option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </Option>
            ))}
          </Dropdown>
        ) : task.priority ? (
          PRIORITY_LABELS[task.priority]
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell>
        <Dropdown
          className={styles.field}
          value={STATUS_LABELS[task.status]}
          selectedOptions={[task.status]}
          disabled={busy}
          onOptionSelect={(_, data) => {
            if (data.optionValue) {
              changeStatus(data.optionValue as TaskStatus);
            }
          }}
        >
          {TASK_STATUSES.map((status) => (
            <Option key={status} value={status}>
              {STATUS_LABELS[status]}
            </Option>
          ))}
        </Dropdown>
      </TableCell>
      <TableCell>
        {editing ? (
          <Input
            className={styles.field}
            value={draft.tags}
            disabled={busy}
            onChange={(_, data) => setDraft({ ...draft, tags: data.value })}
          />
        ) : (
          formatTags(task.tags)
        )}
      </TableCell>
      {fields.map((field) => (
        <TableCell key={field.id}>
          {editing && !field.disabled ? (
            <CustomFieldInput
              className={styles.field}
              field={field}
              value={draft.customFields[field.id] ?? ''}
              disabled={busy}
              onChange={(value) =>
                setDraft({ ...draft, customFields: { ...draft.customFields, [field.id]: value } })
              }
            />
          ) : (
            formatFieldValue(field, task.customFields?.[field.id])
          )}
        </TableCell>
      ))}
      <TableCell>
        <div className={styles.actions}>
          {editing ? (
            <>
              <Button
                appearance="subtle"
                shape="circular"
                className={styles.confirm}
                icon={<SaveRegular />}
                disabled={busy}
                onClick={save}
              />
              <Button
                appearance="subtle"
                shape="circular"
                icon={<DismissRegular />}
                disabled={busy}
                onClick={() => setEditing(false)}
              />
            </>
          ) : (
            <>
              <Button
                appearance="subtle"
                shape="circular"
                icon={<EditRegular />}
                disabled={busy}
                onClick={startEditing}
              />
              <Button
                appearance="subtle"
                shape="circular"
                className={styles.danger}
                icon={<DeleteRegular />}
                disabled={busy}
                onClick={remove}
              />
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}


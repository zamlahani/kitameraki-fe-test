import { useEffect, useState, type FormEvent } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Textarea,
  makeStyles,
} from '@fluentui/react-components';
import { ApiError } from '../api/client';
import { TASK_PRIORITIES, TASK_STATUSES, type TaskDraft, type TaskInput, type TaskPriority, type TaskStatus } from '../utils/types';
import { buildTaskInput, emptyTaskDraft } from '../utils/taskDraft';
import { PRIORITY_LABELS, STATUS_LABELS } from "../utils/helpers";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: TaskInput) => Promise<void>;
}

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
});

export function TaskFormDialog({ open, onOpenChange, onSubmit }: TaskFormDialogProps) {
  const styles = useStyles();
  const [draft, setDraft] = useState<TaskDraft>(emptyTaskDraft);
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(emptyTaskDraft());
      setStatus('todo');
      setSubmitting(false);
      setError(undefined);
      setShowValidation(false);
    }
  }, [open]);

  const titleInvalid = showValidation && !draft.title.trim();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      setShowValidation(true);
      return;
    }

    setSubmitting(true);
    setError(undefined);
    try {
      await onSubmit(buildTaskInput(draft, status));
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <form onSubmit={handleSubmit} noValidate>
          <DialogBody>
            <DialogTitle>New task</DialogTitle>
            <DialogContent className={styles.content}>
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}
              <Field
                label="Title"
                required
                validationState={titleInvalid ? 'error' : 'none'}
                validationMessage={titleInvalid ? 'Title is required' : undefined}
              >
                <Input
                  value={draft.title}
                  disabled={submitting}
                  onChange={(_, data) => setDraft({ ...draft, title: data.value })}
                />
              </Field>
              <Field label="Description">
                <Textarea
                  value={draft.description}
                  disabled={submitting}
                  onChange={(_, data) => setDraft({ ...draft, description: data.value })}
                />
              </Field>
              <Field label="Due date">
                <Input
                  type="datetime-local"
                  value={draft.dueDate}
                  disabled={submitting}
                  onChange={(_, data) => setDraft({ ...draft, dueDate: data.value })}
                />
              </Field>
              <Field label="Priority">
                <Dropdown
                  value={PRIORITY_LABELS[draft.priority]}
                  selectedOptions={[draft.priority]}
                  disabled={submitting}
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
              </Field>
              <Field label="Status">
                <Dropdown
                  value={STATUS_LABELS[status]}
                  selectedOptions={[status]}
                  disabled={submitting}
                  onOptionSelect={(_, data) => {
                    if (data.optionValue) {
                      setStatus(data.optionValue as TaskStatus);
                    }
                  }}
                >
                  {TASK_STATUSES.map((option) => (
                    <Option key={option} value={option}>
                      {STATUS_LABELS[option]}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Tags" hint="Separate tags with commas">
                <Input
                  value={draft.tags}
                  disabled={submitting}
                  onChange={(_, data) => setDraft({ ...draft, tags: data.value })}
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" type="button" disabled={submitting}>
                  Cancel
                </Button>
              </DialogTrigger>
              <Button appearance="primary" type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create task'}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
}

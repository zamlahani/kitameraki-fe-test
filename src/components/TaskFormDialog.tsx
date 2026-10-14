import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
  Option,
  Textarea,
  makeStyles,
} from '@fluentui/react-components';
import { TASK_PRIORITIES, TASK_STATUSES, type FormRow, type TaskDraft, type TaskInput, type TaskPriority, type TaskStatus } from '../utils/types';
import { buildTaskInput, emptyTaskDraft } from '../utils/taskDraft';
import { missingRequiredFields } from '../utils/customFields';
import { PRIORITY_LABELS, STATUS_LABELS, TASK_FIELD_LABELS } from "../utils/helpers";
import { useErrorToast } from '../hooks/useErrorToast';
import { CustomFieldInput } from './CustomFieldInput';

interface TaskFormDialogProps {
  open: boolean;
  rows: FormRow[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: TaskInput) => Promise<void>;
}

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  },
});

export function TaskFormDialog({ open, rows, onOpenChange, onSubmit }: TaskFormDialogProps) {
  const styles = useStyles();
  const showError = useErrorToast();
  const [draft, setDraft] = useState<TaskDraft>(emptyTaskDraft);
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [submitting, setSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const fields = useMemo(() => rows.flatMap((row) => row.fields), [rows]);

  useEffect(() => {
    if (open) {
      setDraft(emptyTaskDraft());
      setStatus('todo');
      setSubmitting(false);
      setShowValidation(false);
    }
  }, [open]);

  const titleInvalid = showValidation && !draft.title.trim();
  const missingFields = missingRequiredFields(fields, draft.customFields).map((field) => field.id);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || missingFields.length > 0) {
      setShowValidation(true);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(buildTaskInput(draft, status, fields));
      onOpenChange(false);
    } catch (err) {
      showError('Create task failed', err, 'Please try again.', fields);
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
              <Field
                label={TASK_FIELD_LABELS.title}
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
              <Field label={TASK_FIELD_LABELS.description}>
                <Textarea
                  value={draft.description}
                  disabled={submitting}
                  onChange={(_, data) => setDraft({ ...draft, description: data.value })}
                />
              </Field>
              <Field label={TASK_FIELD_LABELS.dueDate}>
                <Input
                  type="datetime-local"
                  value={draft.dueDate}
                  disabled={submitting}
                  onChange={(_, data) => setDraft({ ...draft, dueDate: data.value })}
                />
              </Field>
              <Field label={TASK_FIELD_LABELS.priority}>
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
              <Field label={TASK_FIELD_LABELS.status}>
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
              <Field label={TASK_FIELD_LABELS.tags} hint="Separate tags with commas">
                <Input
                  value={draft.tags}
                  disabled={submitting}
                  onChange={(_, data) => setDraft({ ...draft, tags: data.value })}
                />
              </Field>
              {rows.map((row) => (
                <div key={row.id} className={styles.row}>
                  {row.fields.map((field) => {
                    const invalid = showValidation && missingFields.includes(field.id);
                    return (
                      <Field
                        key={field.id}
                        label={field.label}
                        required={field.required}
                        validationState={invalid ? 'error' : 'none'}
                        validationMessage={invalid ? `${field.label} is required` : undefined}
                      >
                        <CustomFieldInput
                          field={field}
                          value={draft.customFields[field.id] ?? ''}
                          disabled={submitting}
                          onChange={(value) =>
                            setDraft({ ...draft, customFields: { ...draft.customFields, [field.id]: value } })
                          }
                        />
                      </Field>
                    );
                  })}
                </div>
              ))}
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

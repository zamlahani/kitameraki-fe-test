import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
} from '@fluentui/react-components';
import type { Task } from '../utils/types';
import { bulkDeleteTasks, deleteTask } from '../api/tasks';
import { useErrorToast } from '../hooks/useErrorToast';

type Props = {
  pendingDelete: Task[] | undefined;
  setPendingDelete: (deleteTasks: Task[] | undefined) => void;
  styles: Record<string, string>;
  setDeleting: (deleting: boolean) => void;
  setSelectedIds: (ids: string[]) => void;
  reload: () => void;
};

const DeleteDialog = (props: Props) => {
  const { pendingDelete, setPendingDelete, styles, setDeleting, setSelectedIds, reload } = props;
  const showError = useErrorToast();

  const confirmDelete = async () => {
    const targets = pendingDelete;
    if (!targets || targets.length === 0) {
      return;
    }
    const ids = targets.map((task) => task.id);
    setPendingDelete(undefined);
    setDeleting(true);
    try {
      if (ids.length === 1) {
        await deleteTask(ids[0]);
      } else {
        await bulkDeleteTasks(ids);
      }
      setSelectedIds([]);
      await reload();
    } catch (err) {
      const label =
        targets.length > 1 ? `Delete ${targets.length} tasks failed` : `Delete "${targets[0]?.title}" failed`;
      showError(label, err, 'Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const deleteCount = pendingDelete?.length ?? 0;

  return (
    <Dialog
      open={pendingDelete !== undefined}
      onOpenChange={(_, data) => {
        if (!data.open) {
          setPendingDelete(undefined);
        }
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{deleteCount > 1 ? `Delete ${deleteCount} tasks` : 'Delete task'}</DialogTitle>
          <DialogContent>
            {deleteCount > 1
              ? `Delete ${deleteCount} selected tasks? This action cannot be undone.`
              : `Delete "${pendingDelete?.[0]?.title}"? This action cannot be undone.`}
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button appearance="primary" className={styles.danger} onClick={confirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default DeleteDialog;

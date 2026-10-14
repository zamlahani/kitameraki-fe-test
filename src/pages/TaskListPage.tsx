import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ArrowSyncRegular, DeleteRegular, DismissRegular } from '@fluentui/react-icons';
import { DEFAULT_PAGE_SIZE, taskMatchesQuery } from '../utils/query';
import { createTask, updateTask } from '../api/tasks';
import type { Task, TaskInput, TaskListQuery, TaskStatus } from '../utils/types';
import { useTasks } from '../hooks/useTasks';
import { useFormSetting } from '../hooks/useFormSetting';
import { Pagination } from '../components/Pagination';
import { TaskFormDialog } from '../components/TaskFormDialog';
import { TaskTable } from '../components/TaskTable';
import { TaskToolbar } from '../components/TaskToolbar';
import DeleteDialog from '../components/DeleteDialog';

const useStyles = makeStyles({
  content: {
    position: 'relative',
    minHeight: '120px',
  },
  empty: {
    marginTop: '8px',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  selectionBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  danger: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': {
      backgroundColor: tokens.colorPaletteRedBackground2,
    },
  },
  details: {
    margin: 0,
    paddingLeft: '18px',
  },
});

export function TaskListPage() {
  const styles = useStyles();
  const [query, setQuery] = useState<TaskListQuery>({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Task[]>();
  const [deleting, setDeleting] = useState(false);
  const [updatesInFlight, setUpdatesInFlight] = useState(0);
  const [reloadNeeded, setReloadNeeded] = useState(false);
  const { data, loading, error, reload, cancelReload, replaceTask, removeUnmatchedTask, dismissError } = useTasks(query);
  const { fields, formSettingError, retryFormSetting } = useFormSetting();
  const items = data?.items ?? [];

  useEffect(() => {
    setSelectedIds([]);
  }, [query]);

  useEffect(() => {
    if (data && data.items.length === 0 && data.total > 0 && query.page > 1) {
      setQuery((previous) => ({ ...previous, page: previous.page - 1 }));
    }
  }, [data, query.page]);

  const changeQuery = useCallback((patch: Partial<TaskListQuery>) => {
    setQuery((previous) => ({ ...previous, ...patch, page: patch.page ?? 1 }));
  }, []);

  const handleCreate = async (input: TaskInput) => {
    await createTask(input);
    setQuery((previous) => (previous.page === 1 ? previous : { ...previous, page: 1 }));
    reload();
  };

  const applyTaskUpdate = (task: Task) => {
    if (taskMatchesQuery(task, query)) {
      replaceTask(task);
      return;
    }
    removeUnmatchedTask(task.id);
    setReloadNeeded(true);
  };

  const runUpdate = async (fn: () => Promise<void>) => {
    const ongoingFetchTasksCancelled = cancelReload();
    if (ongoingFetchTasksCancelled) {
      setReloadNeeded(true);
    }
    setUpdatesInFlight((count) => count + 1);
    try {
      await fn();
    } finally {
      setUpdatesInFlight((count) => count - 1);
    }
  };

  const handleUpdate = (id: string, patch: Partial<TaskInput>) =>
    runUpdate(async () => {
      applyTaskUpdate(await updateTask(id, patch));
    });

  const handleStatusChange = (task: Task, status: TaskStatus) =>
    runUpdate(async () => {
      applyTaskUpdate(await updateTask(task.id, { status }));
    });

  useEffect(() => {
    if (updatesInFlight === 0 && reloadNeeded) {
      setReloadNeeded(false);
      reload({ silent: true });
    }
  }, [updatesInFlight, reloadNeeded, reload]);

  const toggleSelect = (id: string) => {
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map((task) => task.id) : []);
  };

  const requestDelete = (task: Task) => {
    setPendingDelete([task]);
  };

  const requestBulkDelete = () => {
    setPendingDelete(items.filter((task) => selectedIds.includes(task.id)));
  };

  return (
    <div>
      <TaskToolbar query={query} onQueryChange={changeQuery} onAddTask={() => setDialogOpen(true)} />

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Something went wrong</MessageBarTitle>
            {error.message}
            {error.details.length > 0 && (
              <ul className={styles.details}>
                {error.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </MessageBarBody>
          <MessageBarActions
            containerAction={
              <Button appearance="transparent" aria-label="Dismiss" icon={<DismissRegular />} onClick={dismissError} />
            }
          >
            <Button appearance="transparent" icon={<ArrowSyncRegular />} onClick={() => reload()}>
              Retry
            </Button>
          </MessageBarActions>
        </MessageBar>
      )}

      {formSettingError !== undefined && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Form settings couldn&apos;t be loaded</MessageBarTitle>
            Custom fields are hidden and can&apos;t be edited until this loads. Everything else works as usual.
          </MessageBarBody>
          <MessageBarActions
            containerAction={
              <Button
                appearance="transparent"
                icon={<ArrowSyncRegular />}
                onClick={() => retryFormSetting()}
              >
                Retry
              </Button>
            }
          />
        </MessageBar>
      )}

      {selectedIds.length > 0 && (
        <div className={styles.selectionBar}>
          <Text>{selectedIds.length} selected</Text>
          <Button appearance="primary" className={styles.danger} icon={<DeleteRegular />} onClick={requestBulkDelete}>
            Delete selected
          </Button>
          <Button appearance="primary" onClick={() => setSelectedIds([])}>
            Clear
          </Button>
        </div>
      )}

      <div className={styles.content}>
        {items.length === 0 ? (
          data !== undefined && (
            <MessageBar className={styles.empty}>
              <MessageBarBody>No tasks match your filters.</MessageBarBody>
            </MessageBar>
          )
        ) : (
          <>
            <TaskTable
              tasks={items}
              fields={fields}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onUpdate={handleUpdate}
              onStatusChange={handleStatusChange}
              onDelete={requestDelete}
            />
            <Pagination
              page={query.page}
              pageSize={query.pageSize}
              total={data?.total ?? 0}
              onPageChange={(page) => changeQuery({ page })}
              onPageSizeChange={(pageSize) => changeQuery({ pageSize })}
            />
          </>
        )}

        {(loading || deleting) && (
          <div className={styles.overlay}>
            <Spinner label="Loading tasks..." />
          </div>
        )}
      </div>

      <TaskFormDialog open={dialogOpen} fields={fields} onOpenChange={setDialogOpen} onSubmit={handleCreate} />

      <DeleteDialog
        pendingDelete={pendingDelete}
        setPendingDelete={setPendingDelete}
        styles={styles}
        setDeleting={setDeleting}
        setSelectedIds={setSelectedIds}
        reload={reload}
      />
    </div>
  );
}

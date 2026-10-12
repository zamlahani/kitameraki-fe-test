import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import { listTasks } from '../api/tasks';
import type { Task, TaskListQuery, TaskListResult } from '../utils/types';

interface UseTasksResult {
  data?: TaskListResult;
  loading: boolean;
  error?: string;
  reload: (options?: { silent?: boolean }) => Promise<void>;
  /**
   * Cancels the current reload operation if one is in flight.
   * Returns **true** if there is an in-flight operation that was canceled, **false** otherwise.
   */
  cancelReload: () => boolean;
  replaceTask: (task: Task) => void;
  removeUnmatchedTask: (id: string) => void;
  dismissError: () => void;
}

export function useTasks(query: TaskListQuery): UseTasksResult {
  const [data, setData] = useState<TaskListResult>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const inFlightRef = useRef<AbortController>();

  const { q, status, priority, tag, page, pageSize } = query;

  const fetchTasks = useCallback(
    async (silent = false) => {
      inFlightRef.current?.abort();
      const controller = new AbortController();
      inFlightRef.current = controller;
      setLoading(!silent);
      setError(undefined);

      try {
        const result = await listTasks({ q, status, priority, tag, page, pageSize }, controller.signal);
        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load tasks');
        }
      } finally {
        if (inFlightRef.current === controller) {
          inFlightRef.current = undefined;
          setLoading(false);
        }
      }
    },
    [q, status, priority, tag, page, pageSize],
  );

  useEffect(() => {
    fetchTasks(false);
    return () => inFlightRef.current?.abort();
  }, [fetchTasks]);

  const reload = useCallback(
    (options?: { silent?: boolean }) => fetchTasks(options?.silent ?? false),
    [fetchTasks],
  );

  const cancelReload = () => {
    if (!inFlightRef.current) {
      return false;
    }
    inFlightRef.current.abort();
    inFlightRef.current = undefined;
    setLoading(false);
    return true;
  };

  const dismissError = () => setError(undefined);

  const replaceTask = (task: Task) => {
    setData((previous) =>
      previous
        ? { ...previous, items: previous.items.map((item) => (item.id === task.id ? task : item)) }
        : previous,
    );
  };

  const removeUnmatchedTask = (id: string) => {
    setData((previous) =>
      previous
        ? {
            ...previous,
            items: previous.items.filter((item) => item.id !== id),
            total: Math.max(0, previous.total - 1),
          }
        : previous,
    );
  };

  return { data, loading, error, reload, cancelReload, replaceTask, removeUnmatchedTask, dismissError };
}

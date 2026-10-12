import { useEffect, useState } from 'react';
import { Button, Dropdown, Input, Option, makeStyles } from '@fluentui/react-components';
import { AddRegular, SearchRegular } from '@fluentui/react-icons';
import { TASK_PRIORITIES, TASK_STATUSES, type TaskListQuery } from '../utils/types';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { STATUS_LABELS, PRIORITY_LABELS } from "../utils/helpers";

interface TaskToolbarProps {
  query: TaskListQuery;
  onQueryChange: (patch: Partial<TaskListQuery>) => void;
  onAddTask: () => void;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '16px',
  },
  search: {
    minWidth: '240px',
    flexGrow: 1,
  },
  filter: {
    minWidth: '150px',
  },
  spacer: {
    flexGrow: 1,
  },
});

interface FilterDropdownProps {
  anyLabel: string;
  value?: string;
  options: readonly string[];
  labels: Record<string, string>;
  onChange: (value: string | undefined) => void;
}

function FilterDropdown({ anyLabel, value, options, labels, onChange }: FilterDropdownProps) {
  const styles = useStyles();

  return (
    <Dropdown
      className={styles.filter}
      value={value ? labels[value] : anyLabel}
      selectedOptions={value ? [value] : []}
      onOptionSelect={(_, data) => onChange(data.optionValue || undefined)}
    >
      <Option value="">{anyLabel}</Option>
      {options.map((option) => (
        <Option key={option} value={option}>
          {labels[option]}
        </Option>
      ))}
    </Dropdown>
  );
}

export function TaskToolbar({ query, onQueryChange, onAddTask }: TaskToolbarProps) {
  const styles = useStyles();
  const [search, setSearch] = useState(query.q ?? '');
  const [tag, setTag] = useState(query.tag ?? '');
  const debouncedSearch = useDebouncedValue(search);
  const debouncedTag = useDebouncedValue(tag);

  useEffect(() => {
    const q = debouncedSearch.trim() || undefined;
    if (q !== query.q) {
      onQueryChange({ q });
    }
    const tag = debouncedTag.trim() || undefined;
    if (tag !== query.tag) {
      onQueryChange({ tag });
    }
  }, [debouncedSearch, debouncedTag, query.q, query.tag, onQueryChange]);

  return (
    <div className={styles.root}>
      <Input
        className={styles.search}
        placeholder="Search tasks"
        contentBefore={<SearchRegular />}
        value={search}
        onChange={(_, data) => setSearch(data.value)}
      />
      <FilterDropdown
        anyLabel="All statuses"
        value={query.status}
        options={TASK_STATUSES}
        labels={STATUS_LABELS}
        onChange={(status) => onQueryChange({ status: status as TaskListQuery['status'] })}
      />
      <FilterDropdown
        anyLabel="All priorities"
        value={query.priority}
        options={TASK_PRIORITIES}
        labels={PRIORITY_LABELS}
        onChange={(priority) => onQueryChange({ priority: priority as TaskListQuery['priority'] })}
      />
      <Input
        className={styles.filter}
        placeholder="Filter by tag"
        value={tag}
        onChange={(_, data) => setTag(data.value)}
      />
      <div className={styles.spacer} />
      <Button appearance="primary" icon={<AddRegular />} onClick={onAddTask}>
        New task
      </Button>
    </div>
  );
}

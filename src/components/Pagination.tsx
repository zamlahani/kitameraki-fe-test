import { Button, Dropdown, Option, Text, makeStyles } from '@fluentui/react-components';
import { ChevronLeftRegular, ChevronRightRegular } from '@fluentui/react-icons';
import { PAGE_SIZE_OPTIONS } from '../utils/query';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '16px',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pageSize: {
    minWidth: '140px',
  },
});

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const styles = useStyles();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className={styles.root}>
      <Text size={200}>{total === 0 ? 'No results' : `Showing ${from}-${to} of ${total}`}</Text>
      <div className={styles.controls}>
        <Dropdown
          className={styles.pageSize}
          value={`${pageSize} per page`}
          selectedOptions={[String(pageSize)]}
          onOptionSelect={(_, data) => data.optionValue && onPageSizeChange(Number(data.optionValue))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <Option key={size} value={String(size)}>
              {`${size} per page`}
            </Option>
          ))}
        </Dropdown>
        <Button
          appearance="subtle"
          icon={<ChevronLeftRegular />}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />
        <Text size={200}>
          Page {page} of {totalPages}
        </Text>
        <Button
          appearance="subtle"
          icon={<ChevronRightRegular />}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </div>
  );
}


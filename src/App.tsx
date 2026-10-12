import { FluentProvider, Text, Toaster, makeStyles, tokens, webLightTheme } from '@fluentui/react-components';
import { TaskListPage } from './components/TaskListPage';
import { TOASTER_ID } from './hooks/useErrorToast';

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    padding: '16px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
});

export function App() {
  const styles = useStyles();

  return (
    <FluentProvider theme={webLightTheme}>
      <Toaster toasterId={TOASTER_ID} />
      <div className={styles.root}>
        <header className={styles.header}>
          <Text size={600} weight="semibold">
            Task Manager
          </Text>
        </header>
        <main className={styles.main}>
          <TaskListPage />
        </main>
      </div>
    </FluentProvider>
  );
}

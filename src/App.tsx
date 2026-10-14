import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { FluentProvider, Text, Toaster, makeStyles, tokens, webLightTheme } from '@fluentui/react-components';
import { TaskListPage } from './pages/TaskListPage';
import { FormSettingsPage } from './pages/FormSettingsPage';
import { TOASTER_ID } from './hooks/useErrorToast';

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    padding: '16px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  nav: {
    display: 'flex',
    gap: '4px',
  },
  navLink: {
    color: tokens.colorNeutralForeground2,
    textDecoration: 'none',
    padding: '6px 12px',
    borderRadius: tokens.borderRadiusMedium,
  },
  navActive: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    borderBottom: `2px solid ${tokens.colorBrandBackground}`,
    borderRadius: 0,
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
});

function Header() {
  const styles = useStyles();
  const link = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.navLink} ${styles.navActive}` : styles.navLink;

  return (
    <header className={styles.header}>
      <Text size={600} weight="semibold">
        Task Manager
      </Text>
      <nav className={styles.nav}>
        <NavLink to="/" end className={link}>
          Tasks
        </NavLink>
        <NavLink to="/form-settings" className={link}>
          Form settings
        </NavLink>
      </nav>
    </header>
  );
}

export function App() {
  const styles = useStyles();

  return (
    <FluentProvider theme={webLightTheme}>
      <BrowserRouter>
        <Toaster toasterId={TOASTER_ID} />
        <div className={styles.root}>
          <Header />
          <main className={styles.main}>
            <Routes>
              <Route path="/" element={<TaskListPage />} />
              <Route path="/form-settings" element={<FormSettingsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </FluentProvider>
  );
}

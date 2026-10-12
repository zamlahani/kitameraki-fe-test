import { Toast, ToastBody, ToastTitle, makeStyles, tokens, useToastController } from '@fluentui/react-components';
import { ErrorCircleFilled } from '@fluentui/react-icons';
import { ApiError } from '../api/client';

export const TOASTER_ID = 'app-toaster';

const useStyles = makeStyles({
  toast: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderLeft: `4px solid ${tokens.colorPaletteRedBackground3}`,
    boxShadow: tokens.shadow16,
  },
  icon: {
    color: tokens.colorPaletteRedForeground1,
  },
  title: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  body: {
    color: tokens.colorNeutralForeground2,
  },
});

export function useErrorToast(): (title: string, err: unknown, fallback: string) => void {
  const styles = useStyles();
  const { dispatchToast } = useToastController(TOASTER_ID);

  return (title: string, err: unknown, fallback: string) => {
    const detail = err instanceof ApiError ? err.message : fallback;
    dispatchToast(
      <Toast className={styles.toast}>
        <ToastTitle
          className={styles.title}
          media={<ErrorCircleFilled className={styles.icon} />}
        >
          {title}
        </ToastTitle>
        <ToastBody className={styles.body}>{detail}</ToastBody>
      </Toast>,
      { intent: 'error', timeout: 6000, pauseOnHover: true },
    );
  };
}

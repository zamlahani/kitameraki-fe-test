import { Toast, ToastBody, ToastTitle, makeStyles, tokens, useToastController } from '@fluentui/react-components';
import { ErrorCircleFilled } from '@fluentui/react-icons';
import type { FormField } from '../utils/types';
import { describeError } from '../utils/apiError';

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
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  details: {
    margin: 0,
    paddingLeft: '18px',
  },
});

export function useErrorToast(): (title: string, err: unknown, fallback: string, fields?: FormField[]) => void {
  const styles = useStyles();
  const { dispatchToast } = useToastController(TOASTER_ID);

  return (title: string, err: unknown, fallback: string, fields: FormField[] = []) => {
    const { message, details } = describeError(err, fallback, fields);
    dispatchToast(
      <Toast className={styles.toast}>
        <ToastTitle
          className={styles.title}
          media={<ErrorCircleFilled className={styles.icon} />}
        >
          {title}
        </ToastTitle>
        <ToastBody className={styles.body}>
          <span>{message}</span>
          {details.length > 0 && (
            <ul className={styles.details}>
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </ToastBody>
      </Toast>,
      { intent: 'error', timeout: 6000, pauseOnHover: true },
    );
  };
}

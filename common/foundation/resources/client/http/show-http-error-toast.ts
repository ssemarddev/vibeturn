import {toast} from '@ui/toast/toast';
import {getAxiosErrorMessage} from './get-axios-error-message';
import {message} from '@ui/i18n/message';
import {ToastOptions} from '@ui/toast/toast-store';
import axios from 'axios';
import {IgnitionErrorDialog} from '@common/http/ignition-error-dialog/ignition-error-dialog';
import {openDialog} from '@ui/overlays/store/dialog-store';

const defaultErrorMessage = message('There was an issue. Please try again.');

export function showHttpErrorToast(
  err: unknown,
  defaultMessage = defaultErrorMessage,
  field?: string | null,
  toastOptions?: ToastOptions,
) {
  if (axios.isAxiosError(err) && err.response?.data?.ignitionTrace) {
    openDialog(IgnitionErrorDialog, {error: err.response.data});
  } else {
    toast.danger(getAxiosErrorMessage(err, field) || defaultMessage, {
      action: (err as any).response?.data?.action,
      ...toastOptions,
    });
  }
}

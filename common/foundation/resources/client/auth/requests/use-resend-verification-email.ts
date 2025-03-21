import {useMutation} from '@tanstack/react-query';
import {BackendResponse} from '../../http/backend-response/backend-response';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {apiClient} from '../../http/query-client';
import {showHttpErrorToast} from '../../http/show-http-error-toast';

interface Response extends BackendResponse {
  message: string;
}

export interface ResendConfirmEmailPayload {
  email: string;
}

export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: (payload: ResendConfirmEmailPayload) => resendEmail(payload),
    onSuccess: () => {
      toast(message('Email sent'));
    },
    onError: err => showHttpErrorToast(err),
  });
}

function resendEmail(payload: ResendConfirmEmailPayload): Promise<Response> {
  return apiClient
    .post('resend-email-verification', payload)
    .then(response => response.data);
}

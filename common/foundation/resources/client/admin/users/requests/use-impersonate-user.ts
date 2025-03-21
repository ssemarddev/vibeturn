import {useMutation} from '@tanstack/react-query';
import {toast} from '@ui/toast/toast';
import {apiClient} from '@common/http/query-client';
import {message} from '@ui/i18n/message';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {User} from '@ui/types/user';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';

interface Response extends BackendResponse {
  user: User;
}

interface Payload {
  userId: string | number;
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: (payload: Payload) => impersonateUser(payload),
    onSuccess: async response => {
      toast(message(`Impersonating User "${response.user.name}"`));
      window.location.href = '/';
    },
    onError: r => showHttpErrorToast(r),
  });
}

function impersonateUser(payload: Payload) {
  return apiClient
    .post<Response>(`admin/users/impersonate/${payload.userId}`, payload)
    .then(r => r.data);
}

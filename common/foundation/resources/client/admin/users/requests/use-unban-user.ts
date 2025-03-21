import {useMutation} from '@tanstack/react-query';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {toast} from '@ui/toast/toast';
import {apiClient, queryClient} from '@common/http/query-client';
import {message} from '@ui/i18n/message';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';

interface Response extends BackendResponse {}

export function useUnbanUser(userId: number) {
  return useMutation({
    mutationFn: () => unbanUser(userId),
    onSuccess: () => {
      toast(message('User unsuspended'));
      queryClient.invalidateQueries({queryKey: ['users']});
    },
    onError: r => showHttpErrorToast(r),
  });
}

function unbanUser(userId: number): Promise<Response> {
  return apiClient.delete(`users/unban/${userId}`).then(r => r.data);
}

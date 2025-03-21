import {useMutation} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';
import {toast} from '@ui/toast/toast';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {User} from '@ui/types/user';
import {message} from '@ui/i18n/message';
import {apiClient} from '@common/http/query-client';

interface Response extends BackendResponse {}

interface Payload {
  first_name?: string;
  last_name?: string;
}

export function useUpdateAccountDetails(
  userId: number,
  form: UseFormReturn<Partial<User>>,
) {
  return useMutation({
    mutationFn: (props: Payload) => updateAccountDetails(userId, props),
    onSuccess: () => {
      toast(message('Updated account details'));
    },
    onError: r => onFormQueryError(r, form),
  });
}

function updateAccountDetails(
  userId: number | string,
  payload: Payload,
): Promise<Response> {
  return apiClient.put(`users/${userId}`, payload).then(r => r.data);
}

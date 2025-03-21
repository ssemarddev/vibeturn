import {keepPreviousData, useQuery} from '@tanstack/react-query';
import {apiClient} from '@common/http/query-client';
import {PaginationResponse} from '@common/http/backend-response/pagination-response';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {Tag} from '@common/tags/tag';

interface Response extends BackendResponse {
  pagination: PaginationResponse<Tag>;
}

interface Params {
  type?: string;
  notType?: string;
  perPage?: number;
  query?: string;
  userId?: number;
}

export function useTags(params: Params) {
  return useQuery({
    queryKey: ['tags', params],
    queryFn: ({signal}) => fetchTags(params, signal),
    placeholderData: keepPreviousData,
  });
}

async function fetchTags(params: Params, signal?: AbortSignal) {
  if (params.query) {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  return apiClient
    .get<Response>(`tags`, {
      params: {paginate: 'simple', ...params},
      signal: params.query ? signal : undefined,
    })
    .then(response => response.data);
}

import React, {
  cloneElement,
  ComponentProps,
  ReactElement,
  ReactNode,
  useRef,
  useState,
} from 'react';
import {TableDataItem} from '../ui/tables/types/table-data-item';
import {BackendFilter} from './filters/backend-filter';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {ColumnConfig} from './column-config';
import {useTrans} from '@ui/i18n/use-trans';
import {useBackendFilterUrlParams} from './filters/backend-filter-url-params';
import {
  GetDatatableDataParams,
  useDatatableData,
} from './requests/paginated-resources';
import {DataTableContext} from './page/data-table-context';
import {AnimatePresence, m} from 'framer-motion';
import {ProgressBar} from '@ui/progress/progress-bar';
import {Table, TableProps} from '../ui/tables/table';
import {DataTablePaginationFooter} from './data-table-pagination-footer';
import {DataTableHeader} from './data-table-header';
import {FilterList} from './filters/filter-list/filter-list';
import {SelectedStateDatatableHeader} from '@common/datatable/selected-state-datatable-header';
import clsx from 'clsx';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import {BackendFiltersUrlKey} from '@common/datatable/filters/backend-filters-url-key';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {FilterListSkeleton} from '@common/datatable/filters/filter-list/filter-list-skeleton';
import {nanoid} from 'nanoid';
import {useSearchParams} from 'react-router';

export interface DataTableProps<T extends TableDataItem> {
  filters?: BackendFilter[];
  pinnedFilters?: string[];
  filtersLoading?: boolean;
  columns: ColumnConfig<T>[];
  searchPlaceholder?: MessageDescriptor;
  queryParams?: Record<string, string | number | undefined | null>;
  endpoint: string;
  baseQueryKey?: string[];
  skeletonsWhileLoading?: number;
  resourceName?: ReactNode;
  emptyStateMessage: ReactElement<{isFiltering: boolean}>;
  actions?: ReactNode;
  enableSelection?: boolean;
  selectionStyle?: TableProps<T>['selectionStyle'];
  selectedActions?: ReactNode;
  onRowAction?: TableProps<T>['onAction'];
  tableDomProps?: ComponentProps<'table'>;
  children?: ReactNode;
  collapseTableOnMobile?: boolean;
  cellHeight?: string;
  border?: string;
}
export function DataTable<T extends TableDataItem>({
  filters,
  pinnedFilters,
  filtersLoading,
  columns,
  searchPlaceholder,
  queryParams,
  endpoint,
  baseQueryKey: baseQueryKeyProp,
  actions,
  selectedActions,
  emptyStateMessage,
  tableDomProps,
  onRowAction,
  enableSelection = true,
  selectionStyle = 'checkbox',
  children,
  cellHeight,
  collapseTableOnMobile = true,
  skeletonsWhileLoading,
  border,
}: DataTableProps<T>) {
  const baseQueryKey = useRef(baseQueryKeyProp);
  const isMobile = useIsMobileMediaQuery();
  const {trans} = useTrans();
  const {encodedFilters} = useBackendFilterUrlParams(filters);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);

  const [params, setParams] = useState<GetDatatableDataParams>({
    perPage: 15,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  if (searchParams.get('page')) {
    params.page = searchParams.get('page');
  }
  if (searchParams.get('perPage')) {
    params.perPage = searchParams.get('perPage');
  }

  const query = useDatatableData<T>(
    endpoint,
    {
      ...params,
      ...queryParams,
      [BackendFiltersUrlKey]: encodedFilters,
    },
    {baseQueryKey: baseQueryKey.current},
    () => setSelectedRows([]),
  );

  const isFiltering = !!(params.query || params.filters || encodedFilters);
  const pagination = query.data?.pagination;

  const data =
    pagination?.data ||
    (query.isLoading && skeletonsWhileLoading
      ? Array.from({length: skeletonsWhileLoading}).map(() => {
          return {
            id: nanoid(),
            isPlaceholder: true,
          };
        })
      : []);

  const setParamInUrl = (
    key: keyof GetDatatableDataParams,
    value: string | number,
  ) => {
    setParams({...params, [key]: value});
    setSearchParams(prev => {
      prev.set(key as string, value.toString());
      if (key === 'query') {
        prev.delete('page');
      }
      if (key === 'page' && value == 1) {
        prev.delete('page');
      }
      return prev;
    });
  };

  return (
    <DataTableContext.Provider
      value={{
        selectedRows,
        setSelectedRows,
        endpoint,
        params,
        setParams,
        query,
        baseQueryKey: baseQueryKey.current,
      }}
    >
      {children}
      <AnimatePresence initial={false} mode="wait">
        {selectedRows.length ? (
          <SelectedStateDatatableHeader
            selectedItemsCount={selectedRows.length}
            actions={selectedActions}
            key="selected"
          />
        ) : (
          <DataTableHeader
            searchPlaceholder={searchPlaceholder}
            searchValue={params.query}
            onSearchChange={query => setParamInUrl('query', query)}
            actions={actions}
            filters={filters}
            filtersLoading={filtersLoading}
            key="default"
          />
        )}
      </AnimatePresence>

      {filters && (
        <div className="mb-14">
          <AnimatePresence initial={false} mode="wait">
            {filtersLoading && (encodedFilters || pinnedFilters?.length) ? (
              <FilterListSkeleton />
            ) : (
              <m.div key="filter-list" {...opacityAnimation}>
                <FilterList filters={filters} pinnedFilters={pinnedFilters} />
              </m.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div
        className={clsx(
          'relative rounded-panel',
          border ? border : (!isMobile || !collapseTableOnMobile) && 'border',
        )}
      >
        {query.isFetching && !skeletonsWhileLoading && (
          <ProgressBar
            isIndeterminate
            className="absolute left-0 top-0 z-10 w-full"
            aria-label={trans({message: 'Loading'})}
            size="xs"
          />
        )}

        <div className="relative overflow-x-auto md:overflow-hidden">
          <Table
            {...tableDomProps}
            columns={columns}
            data={data as T[]}
            sortDescriptor={params}
            onSortChange={descriptor => {
              setParams({...params, ...descriptor});
            }}
            selectedRows={selectedRows}
            enableSelection={enableSelection}
            selectionStyle={selectionStyle}
            onSelectionChange={setSelectedRows}
            onAction={onRowAction}
            collapseOnMobile={collapseTableOnMobile}
            cellHeight={cellHeight}
          />
        </div>

        {(query.isFetched || query.isPlaceholderData) &&
        !pagination?.data.length ? (
          <div className="pt-50">
            {cloneElement(emptyStateMessage, {
              isFiltering,
            })}
          </div>
        ) : undefined}

        <DataTablePaginationFooter
          query={query}
          onPageChange={page => setParamInUrl('page', page)}
          onPerPageChange={perPage => setParamInUrl('perPage', perPage)}
        />
      </div>
    </DataTableContext.Provider>
  );
}

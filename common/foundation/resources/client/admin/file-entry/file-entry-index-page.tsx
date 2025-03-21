import React, {Fragment} from 'react';
import {DataTablePage} from '../../datatable/page/data-table-page';
import {IconButton} from '@ui/buttons/icon-button';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {ColumnConfig} from '../../datatable/column-config';
import {Trans} from '@ui/i18n/trans';
import {DeleteSelectedItemsAction} from '../../datatable/page/delete-selected-items-action';
import {DataTableEmptyStateMessage} from '../../datatable/page/data-table-emty-state-message';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {FileEntry} from '../../uploads/file-entry';
import {NameWithAvatar} from '../../datatable/column-templates/name-with-avatar';
import {CheckIcon} from '@ui/icons/material/Check';
import {CloseIcon} from '@ui/icons/material/Close';
import {FormattedBytes} from '@ui/i18n/formatted-bytes';
import {VisibilityIcon} from '@ui/icons/material/Visibility';
import uploadSvg from './upload.svg';
import {FilePreviewDialog} from '@common/uploads/components/file-preview/file-preview-dialog';
import {FILE_ENTRY_INDEX_FILTERS} from './file-entry-index-filters';
import {FileTypeIcon} from '@common/uploads/components/file-type-icon/file-type-icon';
import {User} from '@ui/types/user';

const columnConfig: ColumnConfig<FileEntry>[] = [
  {
    key: 'name',
    allowsSorting: true,
    visibleInMode: 'all',
    width: 'flex-3 min-w-200',
    header: () => <Trans message="Name" />,
    body: entry => (
      <Fragment>
        <div className="overflow-x-hidden overflow-ellipsis">{entry.name}</div>
        <div className="overflow-x-hidden overflow-ellipsis text-xs text-muted">
          {entry.file_name}
        </div>
      </Fragment>
    ),
  },
  {
    key: 'owner_id',
    allowsSorting: true,
    width: 'flex-3 min-w-200',
    header: () => <Trans message="Uploader" />,
    body: entry => {
      const owner =
        entry.users?.find(user => user.owns_entry) ?? entry.users?.[0];
      if (!owner) return null;
      return (
        <NameWithAvatar
          image={(owner as User).image}
          label={(owner as User).name}
          description={owner.email}
        />
      );
    },
  },
  {
    key: 'type',
    width: 'w-100 flex-shrink-0',
    allowsSorting: true,
    header: () => <Trans message="Type" />,
    body: entry => (
      <div className="flex items-center gap-12">
        <FileTypeIcon type={entry.type} className="h-24 w-24 overflow-hidden" />
        <div className="capitalize">{entry.type}</div>
      </div>
    ),
  },
  {
    key: 'public',
    allowsSorting: true,
    width: 'w-60 flex-shrink-0',
    header: () => <Trans message="Public" />,
    body: entry =>
      entry.public ? (
        <CheckIcon className="text-positive icon-md" />
      ) : (
        <CloseIcon className="text-danger icon-md" />
      ),
  },
  {
    key: 'file_size',
    allowsSorting: true,
    maxWidth: 'max-w-100',
    header: () => <Trans message="File size" />,
    body: entry => <FormattedBytes bytes={entry.file_size} />,
  },
  {
    key: 'updated_at',
    allowsSorting: true,
    width: 'w-100',
    header: () => <Trans message="Last updated" />,
    body: entry => <FormattedDate date={entry.updated_at} />,
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    align: 'end',
    width: 'w-42 flex-shrink-0',
    visibleInMode: 'all',
    body: entry => {
      return (
        <DialogTrigger type="modal">
          <IconButton size="md" className="text-muted">
            <VisibilityIcon />
          </IconButton>
          <FilePreviewDialog entries={[entry]} />
        </DialogTrigger>
      );
    },
  },
];

export function FileEntryIndexPage() {
  return (
    <DataTablePage
      endpoint="file-entries"
      title={<Trans message="Uploaded files and folders" />}
      columns={columnConfig}
      filters={FILE_ENTRY_INDEX_FILTERS}
      selectedActions={<DeleteSelectedItemsAction />}
      emptyStateMessage={
        <DataTableEmptyStateMessage
          image={uploadSvg}
          title={<Trans message="Nothing has been uploaded yet" />}
          filteringTitle={<Trans message="No matching files or folders" />}
        />
      }
    />
  );
}

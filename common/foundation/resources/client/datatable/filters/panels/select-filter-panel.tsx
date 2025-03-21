import {FormSelect} from '@ui/forms/select/select';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {FilterPanelProps} from '@common/datatable/filters/panels/filter-panel-props';
import {useTrans} from '@ui/i18n/use-trans';
import {FilterSelectControl} from '@common/datatable/filters/backend-filter';

export function SelectFilterPanel({
  filter,
}: FilterPanelProps<FilterSelectControl>) {
  const {trans} = useTrans();

  return (
    <FormSelect
      size="sm"
      name={`${filter.key}.value`}
      selectionMode="single"
      showSearchField={filter.control.showSearchField}
      placeholder={
        filter.control.placeholder
          ? trans(filter.control.placeholder)
          : undefined
      }
      searchPlaceholder={
        filter.control.searchPlaceholder
          ? trans(filter.control.searchPlaceholder)
          : undefined
      }
    >
      {filter.control.options.map(option => (
        <Item key={option.key} value={option.key}>
          {typeof option.label === 'string' ? (
            option.label
          ) : (
            <Trans {...option.label} />
          )}
        </Item>
      ))}
    </FormSelect>
  );
}

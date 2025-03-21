import {FieldArrayWithId, useFormContext, useWatch} from 'react-hook-form';
import {Fragment, useEffect, useMemo, useRef} from 'react';
import {Link, useNavigate, useParams} from 'react-router';
import {MenuSectionConfig} from '@common/admin/appearance/types/appearance-editor-config';
import {
  AppearanceEditorValues,
  appearanceState,
  useAppearanceStore,
} from '@common/admin/appearance/appearance-store';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Button} from '@ui/buttons/button';
import {AddMenuItemDialog} from '@common/admin/appearance/sections/menus/add-menu-item-dialog';
import {AppearanceButton} from '@common/admin/appearance/appearance-button';
import {AddIcon} from '@ui/icons/material/Add';
import {DragIndicatorIcon} from '@ui/icons/material/DragIndicator';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Option} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import dropdownMenu from './dropdown-menu.svg';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {
  useSortable,
  UseSortableProps,
} from '@ui/interactions/dnd/sortable/use-sortable';
import {IconButton} from '@ui/buttons/icon-button';
import {createSvgIconFromTree} from '@ui/icons/create-svg-icon';
import {useSettings} from '@ui/settings/use-settings';
import {MenuItemConfig} from '@common/menus/menu-config';
import {MenuEditorFormValue} from '@common/admin/appearance/sections/menus/menu-editor-form';
import {moveItemInNewArray} from '@ui/utils/array/move-item-in-new-array';

export function AppearanceMenuEditor() {
  const {menuIndex} = useParams();
  const navigate = useNavigate();

  const {getValues} = useFormContext<AppearanceEditorValues>();
  const menuFormPath = `settings.menus.${menuIndex!}` as 'settings.menus.0';
  const menu = getValues(menuFormPath);

  useEffect(() => {
    // go to menu list, if menu can't be found
    if (!menu) {
      navigate('/admin/appearance/menus');
    } else {
      appearanceState().preview.setHighlight(`[data-menu-id="${menu.id}"]`);
    }
  }, [navigate, menu]);

  if (!menu) {
    return null;
  }

  return <MenuEditorSection menuFormPath={menuFormPath} />;
}

interface MenuEditorFormProps {
  menuFormPath: 'settings.menus.0';
}
function MenuEditorSection({menuFormPath}: MenuEditorFormProps) {
  const {
    site: {has_mobile_app},
  } = useSettings();
  const menuSectionConfig = useAppearanceStore(
    s => s.config?.sections.menus.config,
  ) as MenuSectionConfig;

  const menuPositions = useMemo(() => {
    const positions = [...menuSectionConfig?.positions];
    if (has_mobile_app) {
      positions.push('mobile-app-about');
    }
    return positions.map(position => ({
      key: position,
      name: position.replaceAll('-', ' '),
    }));
  }, [menuSectionConfig, has_mobile_app]);

  return (
    <Fragment>
      <div className="mb-30 border-b pb-30">
        <FormTextField
          name={`${menuFormPath}.name`}
          label={<Trans message="Menu name" />}
          className="mb-20"
          autoFocus
        />
        <FormChipField
          chipSize="sm"
          name={`${menuFormPath}.positions`}
          valueKey="id"
          label={<Trans message="Menu positions" />}
          description={
            <Trans message="Where should this menu appear on the site" />
          }
        >
          {menuPositions.map(item => (
            <Option key={item.key} value={item.key} capitalizeFirst>
              {item.name}
            </Option>
          ))}
        </FormChipField>
      </div>
      <MenuItemsManager formPath={`${menuFormPath}.items`} />
      <div className="text-right">
        <DeleteMenuTrigger />
      </div>
    </Fragment>
  );
}

interface MenuItemsManagerProps {
  formPath: string;
}
export function MenuItemsManager({formPath}: MenuItemsManagerProps) {
  const navigate = useNavigate();
  const form = useFormContext();
  const items = useWatch({
    control: form.control,
    name: formPath,
  }) as MenuItemConfig[];

  return (
    <Fragment>
      <div className="flex flex-shrink-0 items-center justify-between gap-16">
        <Trans message="Menu items" />
        <DialogTrigger
          type="popover"
          placement="right"
          offset={20}
          onClose={(menuItemConfig?: MenuItemConfig) => {
            if (menuItemConfig) {
              form.setValue(formPath, [...items, menuItemConfig], {
                shouldDirty: true,
              });
              navigate(`${items.length}`);
            }
          }}
        >
          <Button
            variant="outline"
            color="primary"
            size="xs"
            startIcon={<AddIcon />}
          >
            <Trans message="Add" />
          </Button>
          <AddMenuItemDialog />
        </DialogTrigger>
      </div>
      <div className="mt-20 flex-shrink-0">
        {items.map((item, index) => (
          <MenuListItem
            key={item.id}
            item={item}
            items={items}
            index={index}
            onSortEnd={(oldIndex, newIndex) => {
              form.setValue(
                formPath,
                moveItemInNewArray(items, oldIndex, newIndex),
                {shouldDirty: true},
              );
            }}
          />
        ))}
        {!items.length ? (
          <IllustratedMessage
            size="xs"
            className="my-40"
            image={<SvgImage src={dropdownMenu} />}
            title={<Trans message="No menu items yet" />}
            description={
              <Trans message="Click “add“ button to start adding links, pages, routes and other items to this menu. " />
            }
          />
        ) : null}
      </div>
    </Fragment>
  );
}

function DeleteMenuTrigger() {
  const navigate = useNavigate();
  const params = useParams();
  const menuIndex = parseInt(params.menuIndex!);

  const form = useFormContext<MenuEditorFormValue>();
  const name = `settings.menus` as 'settings.menus';
  const menus = useWatch({
    control: form.control,
    name,
  });
  const menu = menus[menuIndex];

  if (!menu) return null;

  return (
    <DialogTrigger
      type="modal"
      onClose={isConfirmed => {
        if (isConfirmed) {
          form.setValue(
            name,
            menus.filter((_, i) => i != menuIndex),
            {
              shouldDirty: true,
            },
          );
          navigate('/admin/appearance/menus');
        }
      }}
    >
      <Button
        variant="outline"
        color="danger"
        size="xs"
        startIcon={<DeleteIcon />}
      >
        <Trans message="Delete menu" />
      </Button>
      <ConfirmationDialog
        isDanger
        title={<Trans message="Delete menu" />}
        body={
          <Trans
            message="Are you sure you want to delete “:name“?"
            values={{name: menu.name}}
          />
        }
        confirm={<Trans message="Delete" />}
      />
    </DialogTrigger>
  );
}

interface MenuListItemProps {
  item: MenuItemConfig;
  items: FieldArrayWithId[];
  index: number;
  onSortEnd: UseSortableProps['onSortEnd'];
}
function MenuListItem({item, items, index, onSortEnd}: MenuListItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const {sortableProps, dragHandleRef} = useSortable({
    item,
    items,
    type: 'menuEditorSortable',
    ref,
    onSortEnd,
    strategy: 'liveSort',
  });

  const Icon = item.icon && createSvgIconFromTree(item.icon);
  const iconOnlyLabel = (
    <div className="flex items-center gap-4 text-xs text-muted">
      {Icon && <Icon size="sm" />}
      (<Trans message="No label..." />)
    </div>
  );

  return (
    <Fragment>
      <AppearanceButton
        elementType={Link}
        to={`${index}`}
        ref={ref}
        {...sortableProps}
      >
        <div className="flex items-center gap-10">
          <IconButton ref={dragHandleRef} size="sm">
            <DragIndicatorIcon className="text-muted hover:cursor-move" />
          </IconButton>
          <div>{item.label || iconOnlyLabel}</div>
        </div>
      </AppearanceButton>
    </Fragment>
  );
}

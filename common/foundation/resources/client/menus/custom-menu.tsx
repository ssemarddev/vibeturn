import React, {forwardRef, Fragment, ReactElement, ReactNode} from 'react';
import {NavLink} from 'react-router';
import clsx from 'clsx';
import {Orientation} from '@ui/forms/orientation';
import {useCustomMenu} from './use-custom-menu';
import {Trans} from '@ui/i18n/trans';
import {IconSize} from '@ui/icons/svg-icon';
import {MenuConfig, MenuItemConfig} from '@common/menus/menu-config';
import {createSvgIconFromTree} from '@ui/icons/create-svg-icon';
import {Tooltip} from '@ui/tooltip/tooltip';

type MatchDescendants = undefined | boolean | ((to: string) => boolean);

export interface CustomMenuProps {
  className?: string;
  matchDescendants?: MatchDescendants;
  iconClassName?: string;
  iconSize?: IconSize;
  itemClassName?:
    | string
    | ((props: {
        isActive: boolean;
        item: MenuItemConfig;
      }) => string | undefined);
  gap?: string;
  menu?: string | MenuConfig;
  children?: (
    menuItem: MenuItemConfig,
    menuItemProps: MenuItemProps,
  ) => ReactElement;
  orientation?: Orientation;
  onlyShowIcons?: boolean;
  unstyled?: boolean;
}
export function CustomMenu({
  className,
  iconClassName,
  itemClassName,
  gap = 'gap-30',
  menu: menuOrPosition,
  orientation = 'horizontal',
  children,
  matchDescendants,
  onlyShowIcons,
  iconSize,
  unstyled = false,
}: CustomMenuProps) {
  const menu = useCustomMenu(menuOrPosition);
  if (!menu) return null;

  return (
    <div
      className={clsx(
        'flex',
        gap,
        orientation === 'vertical' ? 'flex-col items-start' : 'items-center',
        className,
      )}
      data-menu-id={menu.id}
    >
      {menu.items.map(item => {
        const menuItemProps: MenuItemProps = {
          item,
          unstyled,
          onlyShowIcon: onlyShowIcons,
          matchDescendants,
          iconClassName,
          iconSize,
          className: props => {
            return typeof itemClassName === 'function'
              ? itemClassName({...props, item})
              : itemClassName;
          },
        };

        if (children) {
          return children(item, menuItemProps);
        }
        return <CustomMenuItem key={item.id} {...menuItemProps} />;
      })}
    </div>
  );
}

export interface MenuItemProps extends React.RefAttributes<HTMLAnchorElement> {
  item: MenuItemConfig;
  iconClassName?: string;
  className?: (props: {isActive: boolean}) => string | undefined;
  matchDescendants?: MatchDescendants;
  onlyShowIcon?: boolean;
  iconSize?: IconSize;
  unstyled?: boolean;
  extraContent?: ReactNode;
  position?: string;
}
export const CustomMenuItem = forwardRef<HTMLAnchorElement, MenuItemProps>(
  (
    {
      item,
      className,
      matchDescendants,
      unstyled,
      onlyShowIcon,
      iconClassName,
      iconSize = 'sm',
      extraContent,
      position = 'relative',
      ...linkProps
    },
    ref,
  ) => {
    const label = <Trans message={item.label} />;
    const IconCmp = item.icon && createSvgIconFromTree(item.icon);
    let icon = IconCmp ? (
      <IconCmp size={iconSize} className={iconClassName} />
    ) : null;
    if (icon && onlyShowIcon && label) {
      icon = (
        <Tooltip label={label} placement="right">
          {icon}
        </Tooltip>
      );
    }
    const content = (
      <Fragment>
        {icon}
        {(!icon || !onlyShowIcon) && label}
      </Fragment>
    );

    const baseClassName =
      !unstyled && 'whitespace-nowrap flex items-center justify-start gap-10';
    const focusClassNames = !unstyled && 'outline-none focus-visible:ring-2';

    if (item.type === 'link') {
      return (
        <a
          className={clsx(
            baseClassName,
            className?.({isActive: false}),
            focusClassNames,
            position,
          )}
          href={item.action}
          target={item.target}
          data-menu-item-id={item.id}
          ref={ref}
          {...linkProps}
        >
          {extraContent}
          {content}
        </a>
      );
    }
    return (
      <NavLink
        end={
          typeof matchDescendants === 'function'
            ? matchDescendants(item.action)
            : matchDescendants
        }
        className={props =>
          clsx(baseClassName, className?.(props), focusClassNames, position)
        }
        to={item.action}
        target={item.target}
        data-menu-item-id={item.id}
        ref={ref}
        {...linkProps}
      >
        {extraContent}
        {content}
      </NavLink>
    );
  },
);

import {ReactElement, ReactNode} from 'react';
import clsx from 'clsx';
import {useAuth} from '@common/auth/use-auth';
import {NotificationDialogTrigger} from '@common/notifications/dialog/notification-dialog-trigger';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {useCustomMenu} from '@common/menus/use-custom-menu';
import {createSvgIconFromTree} from '@ui/icons/create-svg-icon';
import {Trans} from '@ui/i18n/trans';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import {CustomMenu} from '@common/menus/custom-menu';
import {useSettings} from '@ui/settings/use-settings';
import {ButtonColor} from '@ui/buttons/get-shared-button-style';
import {MenuIcon} from '@ui/icons/material/Menu';
import {
  NavbarAuthUser,
  NavbarAuthUserProps,
} from '@common/ui/navigation/navbar/navbar-auth-user';
import {NavbarAuthButtons} from '@common/ui/navigation/navbar/navbar-auth-buttons';
import {useDarkThemeVariables} from '@ui/themes/use-dark-theme-variables';
import {Logo} from '@common/ui/navigation/navbar/logo';
import {useLightThemeVariables} from '@ui/themes/use-light-theme-variables';
import {isAbsoluteUrl} from '@ui/utils/urls/is-absolute-url';
import {MenuItemConfig} from '@common/menus/menu-config';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';

type NavbarColor = 'primary' | 'bg' | 'bg-alt' | 'transparent' | string;

export interface NavbarProps {
  hideLogo?: boolean | null;
  toggleButton?: ReactElement;
  children?: ReactNode;
  className?: string;
  color?: NavbarColor;
  bgOpacity?: number | string;
  darkModeColor?: NavbarColor;
  logoColor?: 'dark' | 'light';
  textColor?: string;
  primaryButtonColor?: ButtonColor;
  border?: string;
  size?: 'xs' | 'sm' | 'md';
  rightChildren?: ReactNode;
  menuPosition?: string;
  authMenuItems?: NavbarAuthUserProps['items'];
  alwaysDarkMode?: boolean;
  wrapInContainer?: boolean;
}
export function Navbar(props: NavbarProps) {
  let {
    hideLogo,
    toggleButton,
    children,
    className,
    border,
    size = 'md',
    color,
    textColor,
    darkModeColor,
    rightChildren,
    menuPosition,
    primaryButtonColor,
    authMenuItems,
    logoColor,
    alwaysDarkMode = false,
    wrapInContainer = false,
  } = props;
  const isDarkMode = useIsDarkMode() || alwaysDarkMode;
  const isMobile = useIsMobileMediaQuery();
  const {notifications} = useSettings();
  const {isLoggedIn} = useAuth();
  const darkThemeVars = useDarkThemeVariables();
  const lightThemeVars = useLightThemeVariables();
  const showNotifButton = isLoggedIn && notifications?.integrated;
  color = color ?? lightThemeVars?.['--be-navbar-color'] ?? 'primary';
  darkModeColor =
    darkModeColor ?? darkThemeVars?.['--be-navbar-color'] ?? 'bg-alt';

  if (isDarkMode) {
    color = darkModeColor;
  }

  return (
    <div
      style={alwaysDarkMode ? darkThemeVars : undefined}
      className={clsx(
        getColorStyle(color, textColor),
        size === 'md' && 'h-64 py-8',
        size === 'sm' && 'h-54 py-4',
        size === 'xs' && 'h-48 py-4',
        border,
        className,
      )}
    >
      <div
        className={clsx(
          'flex h-full items-center justify-end gap-10 pl-14 pr-8 md:pl-20 md:pr-20',
          wrapInContainer && 'container mx-auto',
        )}
      >
        {!hideLogo && (
          <Logo
            size="h-full max-h-26 md:max-h-36"
            className="mr-4 md:mr-24"
            color={resolveLogoColor({
              navbarColor: color,
              logoColor,
              isDarkMode,
            })}
          />
        )}
        {toggleButton}
        {children}
        <MobileMenu position={menuPosition} />
        <DesktopMenu position={menuPosition} />
        <div className="ml-auto flex items-center gap-4 md:gap-14">
          {rightChildren}
          {showNotifButton && <NotificationDialogTrigger />}
          {isLoggedIn ? (
            <NavbarAuthUser
              variant={isMobile ? 'compact' : 'wide'}
              items={authMenuItems}
            />
          ) : (
            <NavbarAuthButtons
              navbarColor={color}
              primaryButtonColor={primaryButtonColor}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface DesktopMenuProps {
  position: NavbarProps['menuPosition'];
}
function DesktopMenu({position}: DesktopMenuProps) {
  return (
    <CustomMenu
      className="mx-14 text-sm max-md:hidden"
      itemClassName={isActive =>
        clsx(
          'opacity-90 hover:underline hover:opacity-100',
          isActive && 'opacity-100',
        )
      }
      menu={position}
    />
  );
}

interface MobileMenuProps {
  position: NavbarProps['menuPosition'];
}
function MobileMenu({position}: MobileMenuProps) {
  const navigate = useNavigate();
  const menu = useCustomMenu(position);

  if (!menu?.items.length) {
    return null;
  }

  const handleItemClick = (item: MenuItemConfig) => {
    if (isAbsoluteUrl(item.action)) {
      window.open(item.action, item.target)?.focus();
    } else {
      navigate(item.action);
    }
  };

  return (
    <MenuTrigger>
      <IconButton className="md:hidden" aria-label="Toggle menu">
        <MenuIcon />
      </IconButton>
      <Menu>
        {menu.items.map(item => {
          const Icon = item.icon && createSvgIconFromTree(item.icon);
          return (
            <Item
              value={item.action}
              onSelected={() => handleItemClick(item)}
              key={item.id}
              startIcon={Icon && <Icon />}
            >
              <Trans message={item.label} />
            </Item>
          );
        })}
      </Menu>
    </MenuTrigger>
  );
}

function getColorStyle(color: string, textColor?: string): string {
  switch (color) {
    case 'primary':
      return `bg-primary ${textColor || 'text-on-primary'} border-b-primary`;
    case 'bg':
      return `bg ${textColor || 'text-main'} border-b`;
    case 'bg-alt':
      return `bg-alt ${textColor || 'text-main'} border-b`;
    case 'transparent':
      return `bg-transparent ${textColor || 'text-white'}`;
    default:
      return `${color} ${textColor}`;
  }
}

function resolveLogoColor({
  logoColor,
  navbarColor,
  isDarkMode,
}: {
  logoColor?: 'light' | 'dark';
  navbarColor: NavbarColor;
  isDarkMode: boolean;
}): 'dark' | 'light' {
  if (logoColor != null) {
    return logoColor;
  }

  if (isDarkMode) {
    return 'light';
  }

  if (navbarColor === 'bg' || navbarColor === 'bg-alt') {
    return 'dark';
  }

  return 'light';
}

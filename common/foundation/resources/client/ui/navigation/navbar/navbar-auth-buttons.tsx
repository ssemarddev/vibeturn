import {ButtonColor} from '@ui/buttons/get-shared-button-style';
import {useSettings} from '@ui/settings/use-settings';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {IconButton} from '@ui/buttons/icon-button';
import {PersonIcon} from '@ui/icons/material/Person';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {Link} from 'react-router';
import {Button} from '@ui/buttons/button';
import {NavbarProps} from '@common/ui/navigation/navbar/navbar';
import {Fragment} from 'react';

interface NavbarAuthButtonsProps {
  primaryButtonColor?: ButtonColor;
  navbarColor?: NavbarProps['color'];
}
export function NavbarAuthButtons({
  primaryButtonColor,
  navbarColor,
}: NavbarAuthButtonsProps) {
  if (!primaryButtonColor) {
    primaryButtonColor = navbarColor === 'primary' ? 'paper' : 'primary';
  }

  return (
    <Fragment>
      <MobileButtons />
      <DesktopButtons primaryButtonColor={primaryButtonColor} />
    </Fragment>
  );
}

interface DesktopButtonsProps {
  primaryButtonColor: ButtonColor;
}
function DesktopButtons({primaryButtonColor}: DesktopButtonsProps) {
  const {registration} = useSettings();
  return (
    <div className="text-sm max-md:hidden">
      {!registration?.disable && (
        <Button
          elementType={Link}
          to="/register"
          variant="text"
          className="mr-10"
        >
          <Trans message="Register" />
        </Button>
      )}
      <Button
        elementType={Link}
        to="/login"
        variant="raised"
        color={primaryButtonColor}
      >
        <Trans message="Login" />
      </Button>
    </div>
  );
}

function MobileButtons() {
  const {registration} = useSettings();
  const navigate = useNavigate();
  return (
    <MenuTrigger>
      <IconButton size="md" className="md:hidden">
        <PersonIcon />
      </IconButton>
      <Menu>
        <Item value="login" onSelected={() => navigate('/login')}>
          <Trans message="Login" />
        </Item>
        {!registration?.disable && (
          <Item value="register" onSelected={() => navigate('/register')}>
            <Trans message="Register" />
          </Item>
        )}
      </Menu>
    </MenuTrigger>
  );
}

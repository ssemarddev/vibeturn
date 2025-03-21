import {Link, useNavigate, useParams} from 'react-router';
import {Fragment, ReactNode, useEffect, useState} from 'react';
import {
  AppearanceEditorValues,
  appearanceState,
  previewAppIsLoaded,
} from '@common/admin/appearance/appearance-store';
import {AppearanceButton} from '@common/admin/appearance/appearance-button';
import {ColorIcon} from '@common/admin/appearance/sections/themes/color-icon';
import {CssTheme} from '@ui/themes/css-theme';
import {colorToThemeValue} from '@ui/themes/utils/color-to-theme-value';
import {ThemeSettingsDialogTrigger} from '@common/admin/appearance/sections/themes/theme-settings-dialog-trigger';
import {ThemeMoreOptionsButton} from '@common/admin/appearance/sections/themes/theme-more-options-button';
import {ColorPickerDialog} from '@ui/color-picker/color-picker-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useFormContext} from 'react-hook-form';
import {Trans} from '@ui/i18n/trans';
import {NavbarColorPicker} from '@common/admin/appearance/sections/themes/navbar-color-picker';
import {message} from '@ui/i18n/message';
import {themeValueToHex} from '@ui/themes/utils/theme-value-to-hex';
import {AppearanceSectionTitle} from '@common/admin/appearance/appearance-section-title';

const colorList = [
  {
    label: message('Background'),
    key: '--be-background',
  },
  {
    label: message('Background alt'),
    key: '--be-background-alt',
  },
  {
    label: message('Foreground'),
    key: '--be-foreground-base',
  },
  {
    label: message('Accent light'),
    key: '--be-primary-light',
  },
  {
    label: message('Accent'),
    key: '--be-primary',
  },
  {
    label: message('Accent dark'),
    key: '--be-primary-dark',
  },
  {
    label: message('Text on accent'),
    key: '--be-on-primary',
  },
  {
    label: message('Chip'),
    key: '--be-background-chip',
  },
];

export function ThemeEditor() {
  const navigate = useNavigate();
  const {themeIndex} = useParams();
  const {getValues, watch} = useFormContext<AppearanceEditorValues>();

  const theme = getValues(`appearance.themes.${+themeIndex!}`);
  const selectedFont = watch(`appearance.themes.${+themeIndex!}.font.family`);

  // go to theme list, if theme can't be found
  useEffect(() => {
    if (!theme) {
      navigate('..', {relative: 'path', replace: true});
    }
  }, [navigate, theme]);

  // set this theme as active in preview iframe
  useEffect(() => {
    let isAborted = false;
    if (theme?.id) {
      previewAppIsLoaded.then(() => {
        if (isAborted) return;
        appearanceState().preview.setActiveTheme(theme.id);
      });
    }
    return () => {
      isAborted = true;
      appearanceState().preview.setActiveTheme(null);
    };
  }, [theme?.id]);

  if (!theme) return null;

  return (
    <Fragment>
      <div className="mb-20 flex items-center justify-between gap-10">
        <ThemeSettingsDialogTrigger />
        <ThemeMoreOptionsButton />
      </div>
      <div>
        <AppearanceButton
          elementType={Link}
          to="font"
          description={selectedFont ? selectedFont : <Trans message="System" />}
        >
          <Trans message="Font" />
        </AppearanceButton>
        <AppearanceButton elementType={Link} to="radius">
          <Trans message="Rounding" />
        </AppearanceButton>
        <AppearanceSectionTitle>
          <Trans message="Colors" />
        </AppearanceSectionTitle>
        <NavbarColorPicker />
        {colorList.map(color => (
          <ColorPickerTrigger
            key={color.key}
            colorName={color.key}
            label={<Trans {...color.label} />}
            initialThemeValue={theme.values[color.key]}
            theme={theme}
          />
        ))}
      </div>
    </Fragment>
  );
}

interface ColorPickerTriggerProps {
  label: ReactNode;
  theme: CssTheme;
  colorName: string;
  initialThemeValue: string;
}
function ColorPickerTrigger({
  label,
  theme,
  colorName,
  initialThemeValue,
}: ColorPickerTriggerProps) {
  const {setValue} = useFormContext<AppearanceEditorValues>();
  const {themeIndex} = useParams();
  const [selectedThemeValue, setSelectedThemeValue] =
    useState<string>(initialThemeValue);

  // set color as css variable in preview and on button preview, but not in appearance values
  // this way color change can be canceled when color picker is closed and applied explicitly via apply button
  const selectThemeValue = (themeValue: string) => {
    setSelectedThemeValue(themeValue);
    appearanceState().preview.setThemeValue(colorName, themeValue);
  };

  useEffect(() => {
    // need to update the color here so changes via "reset colors" button are reflected
    setSelectedThemeValue(initialThemeValue);
  }, [initialThemeValue]);

  return (
    <DialogTrigger
      value={themeValueToHex(selectedThemeValue)}
      type="popover"
      placement="right"
      offset={10}
      onValueChange={newColor => {
        selectThemeValue(colorToThemeValue(newColor));
      }}
      onClose={(newColor, {valueChanged, initialValue}) => {
        if (newColor && valueChanged) {
          setValue(
            `appearance.themes.${+themeIndex!}.values.${colorName}`,
            colorToThemeValue(newColor),
            {shouldDirty: true},
          );
        } else {
          // reset to initial value, if apply button was not clicked
          selectThemeValue(initialValue);
        }
      }}
    >
      <AppearanceButton
        className="capitalize"
        startIcon={
          <ColorIcon
            viewBox="0 0 48 48"
            className="icon-lg"
            style={{fill: `rgb(${selectedThemeValue})`}}
          />
        }
      >
        {label}
      </AppearanceButton>
      <ColorPickerDialog />
    </DialogTrigger>
  );
}

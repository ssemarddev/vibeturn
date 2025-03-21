import {NavLink} from 'react-router';
import {AppearanceButton} from './appearance-button';
import {useAppearanceStore} from './appearance-store';
import {Trans} from '@ui/i18n/trans';
import {useMemo} from 'react';
import {AppearanceEditorLayout} from '@common/admin/appearance/appearance-editor-form';

export function SectionList() {
  const sections = useAppearanceStore(s => s.config?.sections);
  const sortedSection = useMemo(() => {
    if (!sections) return [];
    return Object.entries(sections || [])
      .map(([key, value]) => {
        return {
          ...value,
          key,
        };
      })
      .sort((a, b) => (a?.position || 1) - (b?.position || 1));
  }, [sections]);

  return (
    <AppearanceEditorLayout>
      {sortedSection.map(section => (
        <AppearanceButton
          key={section.key}
          to={section.key}
          elementType={NavLink}
        >
          <Trans {...section.label} />
        </AppearanceButton>
      ))}
    </AppearanceEditorLayout>
  );
}

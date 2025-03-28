import useCopyClipboard from 'react-use-clipboard';
import {getAlbumLink} from '@app/web-player/albums/album-link';
import {ReactNode} from 'react';
import {ContextMenuButton} from '@app/web-player/context-dialog/context-dialog-layout';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';

interface CopyLinkMenuButtonProps {
  link: string;
  children: ReactNode;
}
export function CopyLinkMenuButton({link, children}: CopyLinkMenuButtonProps) {
  const {close: closeMenu} = useDialogContext();
  const [, copyLink] = useCopyClipboard(link);

  return (
    <ContextMenuButton
      onClick={() => {
        copyLink();
        closeMenu();
        toast(message('Copied link to clipboard'));
      }}
    >
      {children}
    </ContextMenuButton>
  );
}

import {useSettings} from '@ui/settings/use-settings';
import {useCuedTrack} from '@app/web-player/player-controls/use-cued-track';
import {IconButton} from '@ui/buttons/icon-button';
import {MediaMicrophoneIcon} from '@ui/icons/media/media-microphone';
import {Tooltip} from '@ui/tooltip/tooltip';
import {Trans} from '@ui/i18n/trans';
import {useLocation, useMatch} from 'react-router';
import {useNavigate} from '@common/ui/navigation/use-navigate';

export function LyricsButton() {
  const {player} = useSettings();
  const track = useCuedTrack();
  const navigate = useNavigate();
  const isOnLyricsPage = !!useMatch('/lyrics');
  const {key} = useLocation();
  const hasPreviousUrl = key !== 'default';

  if (!track || player?.hide_lyrics) {
    return null;
  }

  return (
    <Tooltip label={<Trans message="Lyrics" />}>
      <IconButton
        onClick={() => {
          if (isOnLyricsPage) {
            if (hasPreviousUrl) {
              navigate(-1);
            }
          } else {
            navigate(`/lyrics`);
          }
        }}
        color={isOnLyricsPage ? 'primary' : undefined}
      >
        <MediaMicrophoneIcon />
      </IconButton>
    </Tooltip>
  );
}

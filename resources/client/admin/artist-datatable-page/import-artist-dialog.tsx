import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {Trans} from '@ui/i18n/trans';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useForm} from 'react-hook-form';
import {Form} from '@ui/forms/form';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {Button} from '@ui/buttons/button';
import {
  ImportArtistPayload,
  useImportArtist,
} from '@app/admin/artist-datatable-page/requests/use-import-artist';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {useSettings} from '@ui/settings/use-settings';

export function ImportArtistDialog() {
  const settings = useSettings();
  const form = useForm<ImportArtistPayload>({
    defaultValues: {
      importAlbums: true,
      importSimilarArtists: true,
    },
  });
  const {formId, close} = useDialogContext();
  const importArtist = useImportArtist();
  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Import artist" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values => {
            importArtist.mutate(values, {
              onSuccess: response => {
                close(response.artist);
              },
            });
          }}
        >
          <FormTextField
            autoFocus
            required
            name="spotifyId"
            minLength={22}
            maxLength={22}
            label={<Trans message="Spotify ID" />}
            className="mb-24"
          />
          <FormSwitch name="importAlbums" className="mb-24">
            <Trans message="Import albums" />
          </FormSwitch>
          {settings.spotify_use_deprecated_api && (
            <FormSwitch name="importSimilarArtists">
              <Trans message="Import similar artists" />
            </FormSwitch>
          )}
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          form={formId}
          variant="flat"
          color="primary"
          type="submit"
          disabled={importArtist.isPending}
        >
          <Trans message="Import" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

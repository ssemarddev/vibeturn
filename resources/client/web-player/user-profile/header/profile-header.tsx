import {useAuth} from '@common/auth/use-auth';
import {
  actionButtonClassName,
  MediaPageHeaderLayout,
} from '@app/web-player/layout/media-page-header-layout';
import {UserImage} from '@app/web-player/users/user-image';
import {BulletSeparatedItems} from '@app/web-player/layout/bullet-separated-items';
import {Link} from 'react-router';
import {Trans} from '@ui/i18n/trans';
import {ProfileDescription} from '@app/web-player/user-profile/profile-description';
import React from 'react';
import {User} from '@ui/types/user';
import {Button} from '@ui/buttons/button';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {EditIcon} from '@ui/icons/material/Edit';
import {EditProfileDialog} from '@app/web-player/user-profile/edit-profile-dialog';
import {FollowButton} from '@common/users/follow-button';

interface ProfileHeaderProps {
  user: User;
  tabLink: (tabName: string) => string;
}

export function ProfileHeader({user, tabLink}: ProfileHeaderProps) {
  const {user: currentUser} = useAuth();

  return (
    <MediaPageHeaderLayout
      image={
        <UserImage
          user={user}
          size="w-240 h-240"
          className="rounded"
          showProBadge
        />
      }
      title={user.name}
      subtitle={
        <BulletSeparatedItems className="z-20 mx-auto w-max text-sm text-muted">
          {user.followers_count && user.followers_count > 0 ? (
            <Link to={tabLink('followers')} className="hover:underline">
              <Trans
                message=":count followers"
                values={{count: user.followers_count}}
              />
            </Link>
          ) : null}
          {user.followed_users_count && user.followed_users_count > 0 ? (
            <Link to={tabLink('following')} className="hover:underline">
              <Trans
                message="Following :count"
                values={{count: user.followed_users_count}}
              />
            </Link>
          ) : null}
        </BulletSeparatedItems>
      }
      actionButtons={
        <div className="flex items-center justify-center md:justify-start">
          <FollowButton
            user={user}
            variant="flat"
            color="primary"
            minWidth={null}
            className={actionButtonClassName({isFirst: true})}
            radius="rounded-full"
          />
          {currentUser?.id === user.id && <EditButton user={user} />}
        </div>
      }
      footer={<ProfileDescription profile={user.profile} links={user.links} />}
    />
  );
}

interface EditButtonProps {
  user: User;
}

function EditButton({user}: EditButtonProps) {
  return (
    <DialogTrigger type="modal">
      <Button
        variant="outline"
        radius="rounded-full"
        startIcon={<EditIcon />}
        className={actionButtonClassName()}
      >
        <Trans message="Edit" />
      </Button>
      <EditProfileDialog user={user} />
    </DialogTrigger>
  );
}

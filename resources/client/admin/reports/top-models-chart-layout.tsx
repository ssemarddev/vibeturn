import {Trans} from '@ui/i18n/trans';
import {ChartLayout, ChartLayoutProps} from '@common/charts/chart-layout';
import React, {Fragment, ReactElement} from 'react';
import {ReportMetric} from '@common/admin/analytics/report-metric';
import {ChartLoadingIndicator} from '@common/charts/chart-loading-indicator';
import {TopModelDatasetItem} from '@app/admin/reports/requests/use-insights-report';
import {PlayArrowFilledIcon} from '@app/web-player/tracks/play-arrow-filled';
import {InfoIcon} from '@ui/icons/material/Info';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Link, useLocation} from 'react-router';
import {SmallArtistImage} from '@app/web-player/artists/artist-image/small-artist-image';
import {ArtistLink} from '@app/web-player/artists/artist-link';
import {AlbumImage} from '@app/web-player/albums/album-image/album-image';
import {TrackImage} from '@app/web-player/tracks/track-image/track-image';
import {AlbumLink} from '@app/web-player/albums/album-link';
import {TrackLink} from '@app/web-player/tracks/track-link';
import {ArtistLinks} from '@app/web-player/artists/artist-links';
import {UserProfileLink} from '@app/web-player/users/user-profile-link';
import {UserAvatar} from '@common/auth/user-avatar';

interface Props extends Partial<ChartLayoutProps> {
  data?: ReportMetric<TopModelDatasetItem>;
  title: ReactElement;
}
export function TopModelsChartLayout({data, isLoading, ...layoutProps}: Props) {
  const dataItems = data?.datasets[0].data || [];

  return (
    <ChartLayout
      {...layoutProps}
      contentIsFlex={isLoading}
      className="col-span-6 row-span-11 overflow-y-auto overflow-x-hidden"
    >
      {isLoading && <ChartLoadingIndicator />}
      {dataItems.map(item => (
        <div
          key={item.model.id}
          className="mb-20 flex items-center justify-between gap-24 text-sm"
        >
          <div className="flex items-center gap-8">
            <Image
              model={item.model}
              size="w-42 h-42"
              className="flex-shrink-0 rounded"
            />
            <div>
              <div className="text-sm">
                <Name model={item.model} />
              </div>
              <div className="text-xs text-muted">
                <Description model={item.model} />
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-4">
            <PlayArrowFilledIcon className="text-muted" size="sm" />
            <Trans
              message=":count plays"
              values={{count: <FormattedNumber value={item.value} />}}
            />
          </div>
        </div>
      ))}
      {!isLoading && !dataItems.length ? (
        <div className="flex items-center gap-8 text-muted">
          <InfoIcon size="sm" />
          <Trans message="No plays in selected timeframe." />
        </div>
      ) : null}
    </ChartLayout>
  );
}

interface ImageProps {
  model: TopModelDatasetItem['model'];
  size: string;
  className: string;
}
function Image({model, size, className}: ImageProps) {
  const {pathname} = useLocation();
  const inAdmin = pathname.includes('/admin');
  const link = inAdmin
    ? `/admin/${model.model_type}s/${model.id}/insights`
    : `/backstage/${model.model_type}s/${model.id}/insights`;

  switch (model.model_type) {
    case 'artist':
      return (
        <Link to={link}>
          <SmallArtistImage artist={model} size={size} className={className} />
        </Link>
      );
    case 'album':
      return (
        <Link to={link}>
          <AlbumImage album={model} size={size} className={className} />
        </Link>
      );
    case 'track':
      return (
        <Link to={link}>
          <TrackImage track={model} size={size} className={className} />
        </Link>
      );
    case 'user':
      // there's no separate insights page for user
      return <UserAvatar user={model} size={size} className={className} />;
  }
}

interface NameProps {
  model: TopModelDatasetItem['model'];
}
function Name({model}: NameProps) {
  switch (model.model_type) {
    case 'artist':
      return <ArtistLink artist={model} target="_blank" />;
    case 'album':
      return <AlbumLink album={model} target="_blank" />;
    case 'track':
      return <TrackLink track={model} target="_blank" />;
    case 'user':
      return model.id ? (
        <UserProfileLink user={model} target="_blank" />
      ) : (
        <Fragment>{model.name}</Fragment>
      );
  }
}

interface DescriptionProps {
  model: TopModelDatasetItem['model'];
}
function Description({model}: DescriptionProps) {
  switch (model.model_type) {
    case 'artist':
    case 'user':
      return null;
    case 'album':
    case 'track':
      return <ArtistLinks artists={model.artists} target="_blank" />;
  }
}

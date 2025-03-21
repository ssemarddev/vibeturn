import memoize from 'nano-memoize';
import clsx from 'clsx';
import {isAbsoluteUrl} from '@ui/utils/urls/is-absolute-url';

interface RemoteFaviconProps {
  url: string;
  className?: string;
  size?: string;
  alt?: string;
}
export function RemoteFavicon({
  url,
  className,
  size = 'w-16 h-16',
  alt,
}: RemoteFaviconProps) {
  if (!url) {
    return null;
  }

  const src = getFaviconSrc(url);

  if (!src) {
    return null;
  }

  return (
    <img
      className={clsx(size, className)}
      src={src}
      alt={alt || `${src} favicon`}
    />
  );
}

const getFaviconSrc = memoize((url: string): string | null => {
  if (url.includes('youtube')) {
    return 'https://www.youtube.com/s/desktop/ca54e1bd/img/favicon.ico';
  }

  // relative url to current site
  if (!isAbsoluteUrl(url)) {
    url = `${window.location.protocol}//${window.location.host}`;
  }

  try {
    const domain = new URL(url).origin;
    return 'https://www.google.com/s2/favicons?domain=' + domain;
  } catch (e) {}

  return null;
});

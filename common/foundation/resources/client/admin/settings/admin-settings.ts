import {Settings} from '@ui/settings/settings';

export interface AdminServerSettings {
  app_url: string;
  app_timezone: string;
  app_locale: string;
  newAppUrl?: string;

  // subscriptions
  paypal_client_id?: string;
  paypal_secret?: string;
  paypal_webhook_id?: string;
  stripe_key?: string;
  stripe_secret?: string;
  stripe_webhook_secret?: string;

  // social login
  envato_id?: string;
  envato_secret?: string;
  envato_personal_token?: string;
  google_id?: string;
  google_secret?: string;
  twitter_id?: string;
  twitter_secret?: string;
  facebook_id?: string;
  facebook_secret?: string;

  // upload drivers
  uploads_disk_driver?: string;
  public_disk_driver?: string;
  static_file_delivery?: string;

  // s3 storage credentials
  storage_s3_key?: string;
  storage_s3_secret?: string;
  storage_s3_region?: string;
  storage_s3_bucket?: string;
  storage_s3_endpoint?: string;

  // ftp storage credentials
  storage_ftp_host?: string;
  storage_ftp_username?: string;
  storage_ftp_password?: string;
  storage_ftp_root?: string;
  storage_ftp_port?: string | number;
  storage_ftp_passive?: boolean;
  storage_ftp_ssl?: boolean;

  // digitalocean storage credentials
  storage_digitalocean_key?: string;
  storage_digitalocean_secret?: string;
  storage_digitalocean_region?: string;
  storage_digitalocean_bucket?: string;

  // backblaze storage credentials
  storage_backblaze_key?: string;
  storage_backblaze_secret?: string;
  storage_backblaze_bucket?: string;
  storage_backblaze_region?: string;

  // dropbox storage credentials
  storage_dropbox_app_key?: string;
  storage_dropbox_app_secret?: string;
  storage_dropbox_refresh_token?: string;

  // mail
  mail_from_address?: string;
  mail_from_name?: string;
  mail_driver?: string;
  mail_setup?: boolean;
  connectedGmailAccount?: string;

  // mailgun
  mailgun_domain?: string;
  mailgun_secret?: string;
  mailgun_endpoint?: string;

  // smtp
  mail_host?: string;
  mail_username?: string;
  mail_password?: string;
  mail_port?: string;
  mail_encryption?: string;

  // amazon simple mail service
  ses_key?: string;
  ses_secret?: string;
  ses_region?: string;

  // postmark
  postmark_token?: string;

  // cache
  cache_driver?: string;

  // memcached
  memcached_host?: string;
  memcached_port?: string;

  // sentry
  sentry_dsn?: string;

  // queue
  queue_driver?: string;
  sqs_queue_key?: string;
  sqs_queue_secret?: string;
  sqs_queue_prefix?: string;
  sqs_queue_name?: string;
  sqs_queue_region?: string;

  // websockets
  broadcast_driver?: string;
  pusher_app_id?: string;
  pusher_app_key?: string;
  pusher_app_secret?: string;
  pusher_app_cluster?: string;
  reverb_app_id?: string;
  reverb_app_key?: string;
  reverb_app_secret?: string;
  reverb_host?: string;
  reverb_port?: string;
  reverb_scheme?: string;
  ably_app_id?: string;
  ably_app_key?: string;
  ably_app_secret?: string;

  // analytics
  analytics_property_id?: string;

  // search
  scout_driver?: string;
  scout_mysql_mode?: string;
  algolia_app_id?: string;
  algolia_secret?: string;

  // AI
  openai_api_key?: string;

  // mtdb
  tmdb_api_key?: string;
  rating_column?: string;

  // bemusic
  spotify_id?: string;
  spotify_secret?: string;
  lastfm_api_key?: string;
}

export interface AdminSettings {
  client: Omit<Settings, 'menus' | 'base_url' | 'site'>;
  server: AdminServerSettings;
  files: Record<string, any>;
}

<?php

namespace Common;

use App\Models\Channel;
use App\Models\User;
use App\Policies\ChannelPolicy;
use Clockwork\Support\Laravel\ClockworkServiceProvider;
use Common\Admin\Appearance\Themes\CssTheme;
use Common\Admin\Appearance\Themes\CssThemePolicy;
use Common\Auth\BaseUser;
use Common\Auth\Commands\DeleteExpiredBansCommand;
use Common\Auth\Commands\DeleteExpiredOtpCodesCommand;
use Common\Auth\Events\UsersDeleted;
use Common\Auth\Middleware\ForbidBannedUser;
use Common\Auth\Middleware\OptionalAuthenticate;
use Common\Auth\Middleware\VerifyApiAccessMiddleware;
use Common\Auth\Permissions\Permission;
use Common\Auth\Permissions\Policies\PermissionPolicy;
use Common\Auth\Roles\Role;
use Common\Billing\Invoices\Invoice;
use Common\Billing\Invoices\InvoicePolicy;
use Common\Billing\Listeners\SyncPlansWhenBillingSettingsChange;
use Common\Billing\Models\Product;
use Common\Billing\Subscription;
use Common\Comments\Comment;
use Common\Comments\CommentPolicy;
use Common\Core\AppUrl;
use Common\Core\Bootstrap\BaseBootstrapData;
use Common\Core\Bootstrap\BootstrapData;
use Common\Core\Commands\GenerateChecksums;
use Common\Core\Commands\GenerateSitemap;
use Common\Core\Commands\SeedCommand;
use Common\Core\Commands\UpdateSimplePaginateTables;
use Common\Core\Contracts\AppUrlGenerator;
use Common\Core\Install\RedirectIfNotInstalledMiddleware;
use Common\Core\Install\UpdateActionsCommand;
use Common\Core\Middleware\EnableDebugIfLoggedInAsAdmin;
use Common\Core\Middleware\EnsureEmailIsVerified;
use Common\Core\Middleware\IsAdmin;
use Common\Core\Middleware\PrerenderIfCrawler;
use Common\Core\Middleware\RestrictDemoSiteFunctionality;
use Common\Core\Middleware\SetAppLocale;
use Common\Core\Middleware\SetSentryUserMiddleware;
use Common\Core\Middleware\SimulateSlowConnectionMiddleware;
use Common\Core\Policies\AppearancePolicy;
use Common\Core\Policies\FileEntryPolicy;
use Common\Core\Policies\LocalizationPolicy;
use Common\Core\Policies\PagePolicy;
use Common\Core\Policies\ProductPolicy;
use Common\Core\Policies\ReportPolicy;
use Common\Core\Policies\RolePolicy;
use Common\Core\Policies\SettingPolicy;
use Common\Core\Policies\SubscriptionPolicy;
use Common\Core\Policies\TagPolicy;
use Common\Core\Policies\UserPolicy;
use Common\Core\Prerender\BaseUrlGenerator;
use Common\Core\Rendering\CrawlerDetector;
use Common\Csv\DeleteExpiredCsvExports;
use Common\Database\AppCursorPaginator;
use Common\Database\CustomLengthAwarePaginator;
use Common\Database\CustomSimplePaginator;
use Common\Domains\CustomDomain;
use Common\Domains\CustomDomainPolicy;
use Common\Domains\CustomDomainsEnabled;
use Common\Files\Actions\Deletion\DeleteEntries;
use Common\Files\Commands\DeleteUploadArtifacts;
use Common\Files\Events\FileUploaded;
use Common\Files\FileEntry;
use Common\Files\Listeners\CreateThumbnailForUploadedFile;
use Common\Files\Providers\BackblazeServiceProvider;
use Common\Files\Providers\DigitalOceanServiceProvider;
use Common\Files\Providers\DropboxServiceProvider;
use Common\Files\Providers\DynamicStorageDiskProvider;
use Common\Files\S3\AbortOldS3Uploads;
use Common\Files\Tus\DeleteExpiredTusUploads;
use Common\Files\Tus\TusServiceProvider;
use Common\Localizations\Commands\ExportTranslations;
use Common\Localizations\Commands\GenerateFooTranslations;
use Common\Localizations\Listeners\UpdateAllUsersLanguageWhenDefaultLocaleChanges;
use Common\Localizations\Localization;
use Common\Logging\CleanLogTables;
use Common\Logging\Mail\OutgoingEmailLogSubscriber;
use Common\Logging\Schedule\MonitorsSchedule;
use Common\Logging\Schedule\ScheduleHealthCommand;
use Common\Pages\CustomPage;
use Common\Search\Drivers\Mysql\MysqlSearchEngine;
use Common\ServerTiming\ServerTiming;
use Common\ServerTiming\ServerTimingMiddleware;
use Common\Settings\Events\SettingsSaved;
use Common\Settings\Mail\GmailApiMailTransport;
use Common\Settings\Mail\GmailClient;
use Common\Settings\Setting;
use Common\Settings\Settings;
use Common\SSR\StartSsr;
use Common\SSR\StopSsr;
use Common\Tags\Tag;
use Common\Workspaces\Actions\RemoveMemberFromWorkspace;
use Common\Workspaces\ActiveWorkspace;
use Common\Workspaces\Policies\WorkspaceMemberPolicy;
use Common\Workspaces\Policies\WorkspacePolicy;
use Common\Workspaces\Workspace;
use Common\Workspaces\WorkspaceMember;
use Illuminate\Auth\Events\Registered;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Foundation\AliasLoader;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Laravel\Scout\EngineManager;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\SocialiteServiceProvider;
use Matchish\ScoutElasticSearch\ElasticSearchServiceProvider;
use Matchish\ScoutElasticSearch\Engines\ElasticSearchEngine;
use Symfony\Component\Stopwatch\Stopwatch;

require_once 'helpers.php';

class CommonServiceProvider extends ServiceProvider
{
    use MonitorsSchedule;

    const CONFIG_FILES = [
        'permissions',
        'default-settings',
        'site',
        'demo',
        'setting-validators',
        'menus',
    ];

    public function __construct($app)
    {
        parent::__construct($app);
        $app->instance('path.common', base_path('common/foundation'));
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(function () {
                $this->loadRoutesFrom(app('path.common') . '/routes/api.php');
            });
        Route::middleware('web')->group(function () {
            $this->loadRoutesFrom(app('path.common') . '/routes/web.php');
        });
        $this->loadRoutesFrom(app('path.common') . '/routes/webhooks.php');

        $this->loadMigrationsFrom(app('path.common') . '/database/migrations');
        $this->loadViewsFrom(app('path.common') . '/resources/views', 'common');
        $this->loadViewsFrom(
            storage_path('app/editable-views'),
            'editable-views',
        );

        $this->registerPolicies();
        $this->registerCustomValidators();
        $this->registerCommands();
        $this->registerMiddleware();
        $this->registerCollectionExtensions();
        $this->registerEventListeners();
        $this->registerCustomMailDrivers();
        $this->setMorphMap();

        $configs = collect(self::CONFIG_FILES)
            ->mapWithKeys(function ($file) {
                return [
                    app('path.common') .
                    "/resources/config/$file.php" => config_path(
                        "common/$file.php",
                    ),
                ];
            })
            ->toArray();
        $this->mergeConfigFrom(
            app('path.common') .
                '/resources/config/common-upload-middleware.php',
            'upload-middleware',
        );

        $this->publishes($configs);

        Vite::useScriptTagAttributes([
            'data-keep' => 'true',
        ]);
        Vite::useStyleTagAttributes([
            'data-keep' => 'true',
        ]);
        Vite::usePreloadTagAttributes([
            'data-keep' => 'true',
        ]);

        // install/update page components
        Blade::component(
            'common::install.components.install-layout',
            'install-layout',
        );
        Blade::component(
            'common::install.components.install-button',
            'install-button',
        );
    }

    public function register()
    {
        $this->mergeConfig();

        $request = $this->app->make(Request::class);
        $this->app->instance(AppUrl::class, (new AppUrl())->init());
        $this->normalizeRequestUri($request);
        app('url')->forceRootUrl(config('app.url'));

        $loader = AliasLoader::getInstance();

        // register socialite service provider and alias
        $this->app->register(SocialiteServiceProvider::class);
        $loader->alias('Socialite', Socialite::class);

        $this->app->register(TusServiceProvider::class);

        // server timing
        $this->app->singleton(ServerTiming::class, function ($app) {
            return new ServerTiming(new Stopwatch());
        });
        $this->app->singleton(
            CrawlerDetector::class,
            fn($app) => new CrawlerDetector(),
        );

        // active workspace
        if (config('common.site.workspaces_integrated')) {
            $this->app->singleton(ActiveWorkspace::class, function () {
                return new ActiveWorkspace();
            });
        }

        // need the same instance of settings for request lifecycle, so dynamically changed settings work correctly
        $this->app->singleton(Settings::class, fn() => new Settings());

        $this->app->singleton(
            'guestRole',
            fn() => Role::where('guests', true)->first(),
        );

        // url generator for SEO
        $this->app->bind(AppUrlGenerator::class, BaseUrlGenerator::class);

        // bootstrap data
        $this->app->bind(BootstrapData::class, BaseBootstrapData::class);

        // pagination
        $this->app->bind(
            LengthAwarePaginator::class,
            CustomLengthAwarePaginator::class,
        );
        $this->app->bind(Paginator::class, CustomSimplePaginator::class);

        $this->registerDevProviders();

        // register flysystem providers
        $this->app->register(DynamicStorageDiskProvider::class);
        if ($this->storageDriverSelected('dropbox')) {
            $this->app->register(DropboxServiceProvider::class);
        }
        if ($this->storageDriverSelected('digitalocean_s3')) {
            $this->app->register(DigitalOceanServiceProvider::class);
        }
        if ($this->storageDriverSelected('backblaze_s3')) {
            $this->app->register(BackblazeServiceProvider::class);
        }

        // register scout drivers
        resolve(EngineManager::class)->extend('mysql', function () {
            return new MysqlSearchEngine();
        });
        if (config('scout.driver') === ElasticSearchEngine::class) {
            $this->app->register(ElasticSearchServiceProvider::class);
        }
    }

    private function mergeConfig()
    {
        $this->deepMergeDefaultSettings(
            app('path.common') . '/resources/config/default-settings.php',
            'common.default-settings',
        );
        $this->deepMergeConfigFrom(
            app('path.common') . '/resources/config/demo-blocked-routes.php',
            'common.demo-blocked-routes',
        );
        $this->mergeConfigFrom(
            app('path.common') . '/resources/config/site.php',
            'common.site',
        );
        $this->mergeConfigFrom(
            app('path.common') . '/resources/config/setting-validators.php',
            'common.setting-validators',
        );
        $this->mergeConfigFrom(
            app('path.common') . '/resources/config/menus.php',
            'common.menus',
        );
        $this->mergeConfigFrom(
            app('path.common') . '/resources/config/appearance.php',
            'common.appearance',
        );
        $this->mergeConfigFrom(
            app('path.common') . '/resources/config/services.php',
            'services',
        );
        $this->mergeConfigFrom(
            app('path.common') . '/resources/config/seo/common.php',
            'seo.common',
        );
    }

    /**
     * Remove sub-directory from request uri, so as far as laravel/symfony
     * is concerned request came from public directory, even if request
     * was redirected from root laravel folder to public via .htaccess
     *
     * This will solve issues where requests redirected from laravel root
     * folder to public via .htaccess (or other) redirects are not working
     * if laravel is inside a subdirectory. Mostly useful for shared hosting
     * or local dev where virtual hosts can't be set up properly.
     *
     * @param Request $request
     */
    private function normalizeRequestUri(Request $request)
    {
        $parsedUrl = parse_url(config('app.url'));

        //if there's no subdirectory we can bail
        if (!isset($parsedUrl['path'])) {
            return;
        }

        $originalUri = $request->server->get('REQUEST_URI');
        $subdirectory = preg_quote($parsedUrl['path'], '/');
        $normalizedUri = preg_replace("/^$subdirectory/", '', $originalUri);

        //if uri starts with "/public" after normalizing,
        //we can bail as laravel will handle this uri properly
        if (str_starts_with(ltrim($normalizedUri, '/'), 'public')) {
            return;
        }

        $request->server->set('REQUEST_URI', $normalizedUri);
    }

    private function registerMiddleware(): void
    {
        if (!config('common.site.installed')) {
            $this->app['router']->pushMiddlewareToGroup(
                'web',
                RedirectIfNotInstalledMiddleware::class,
            );
            return;
        }

        $aliasMiddleware = [
            'isAdmin' => IsAdmin::class,
            'verified' => EnsureEmailIsVerified::class,
            'optionalAuth' => OptionalAuthenticate::class,
            'customDomainsEnabled' => CustomDomainsEnabled::class,
            'prerenderIfCrawler' => PrerenderIfCrawler::class,
            'verifyApiAccess' => VerifyApiAccessMiddleware::class,
        ];

        $apiMiddleware = [
            EnableDebugIfLoggedInAsAdmin::class,
            SimulateSlowConnectionMiddleware::class,
            SetAppLocale::class,
            ForbidBannedUser::class,
            SetSentryUserMiddleware::class,
            VerifyApiAccessMiddleware::class,
        ];

        $webMiddleware = [
            EnableDebugIfLoggedInAsAdmin::class,
            SimulateSlowConnectionMiddleware::class,
            ServerTimingMiddleware::class,
            SetAppLocale::class,
            ForbidBannedUser::class,
            SetSentryUserMiddleware::class,
        ];

        if (config('common.site.demo')) {
            $apiMiddleware[] = RestrictDemoSiteFunctionality::class;
            $webMiddleware[] = RestrictDemoSiteFunctionality::class;
        }

        foreach ($apiMiddleware as $middleware) {
            $this->app['router']->pushMiddlewareToGroup('api', $middleware);
        }

        foreach ($webMiddleware as $middleware) {
            $this->app['router']->pushMiddlewareToGroup('web', $middleware);
        }

        foreach ($aliasMiddleware as $alias => $middleware) {
            $this->app['router']->aliasMiddleware($alias, $middleware);
        }
    }

    /**
     * Register custom validation rules with laravel.
     */
    private function registerCustomValidators()
    {
        Validator::extend(
            'email_verified',
            'Common\Auth\Validators\EmailVerifiedValidator@validate',
        );
        Validator::extend(
            'multi_date_format',
            'Common\Validation\Validators\MultiDateFormatValidator@validate',
        );
    }

    /**
     * Deep merge the given configuration with the existing configuration.
     */
    private function deepMergeConfigFrom(string $path, string $key): void
    {
        $config = $this->app['config']->get($key, []);
        $this->app['config']->set(
            $key,
            array_merge_recursive(require $path, $config),
        );
    }

    private function registerPolicies()
    {
        Gate::policy('App\Model', 'App\Policies\ModelPolicy');
        Gate::policy(FileEntry::class, FileEntryPolicy::class);
        Gate::policy(BaseUser::class, UserPolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(CustomPage::class, PagePolicy::class);
        Gate::policy(Setting::class, SettingPolicy::class);
        Gate::policy(Localization::class, LocalizationPolicy::class);
        Gate::policy('AppearancePolicy', AppearancePolicy::class);
        Gate::policy('ReportPolicy', ReportPolicy::class);
        Gate::policy(CssTheme::class, CssThemePolicy::class);
        Gate::policy(CustomDomain::class, CustomDomainPolicy::class);
        Gate::policy(Permission::class, PermissionPolicy::class);
        Gate::policy(Tag::class, TagPolicy::class);
        Gate::policy(Comment::class, CommentPolicy::class);
        Gate::policy(Channel::class, ChannelPolicy::class);

        // billing
        Gate::policy(Subscription::class, SubscriptionPolicy::class);
        Gate::policy(Invoice::class, InvoicePolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);

        // workspaces
        Gate::policy(Workspace::class, WorkspacePolicy::class);
        Gate::policy(WorkspaceMember::class, WorkspaceMemberPolicy::class);

        Gate::define('admin.access', function (BaseUser $user) {
            return $user->hasPermission('admin.access');
        });
    }

    private function registerCommands(): void
    {
        // register commands
        $commands = [
            DeleteUploadArtifacts::class,
            SeedCommand::class,
            DeleteExpiredCsvExports::class,
            GenerateChecksums::class,
            AbortOldS3Uploads::class,
            DeleteExpiredTusUploads::class,
            UpdateSimplePaginateTables::class,
            DeleteExpiredBansCommand::class,
            DeleteExpiredOtpCodesCommand::class,
            StartSsr::class,
            StopSsr::class,
            UpdateActionsCommand::class,
            GenerateSitemap::class,
            ScheduleHealthCommand::class,
            CleanLogTables::class,
        ];

        if ($this->app->environment() !== 'production') {
            $commands = array_merge($commands, [
                ExportTranslations::class,
                GenerateFooTranslations::class,
            ]);
        }

        $this->commands($commands);

        // schedule commands
        $this->app->booted(function () {
            if (!$this->app->runningInConsole()) {
                return;
            }

            $schedule = $this->app->make(Schedule::class);
            // make sure daily commands are not running at the same time to prevent CPU/Memory spikes
            $schedule->command(DeleteUploadArtifacts::class)->dailyAt('02:00');
            $schedule
                ->command(DeleteExpiredCsvExports::class)
                ->dailyAt('02:10');
            $schedule->command(AbortOldS3Uploads::class)->dailyAt('02:20');
            $schedule
                ->command(DeleteExpiredTusUploads::class)
                ->dailyAt('02:30');
            $schedule
                ->command(UpdateSimplePaginateTables::class)
                ->dailyAt('02:40');
            $schedule
                ->command(DeleteExpiredBansCommand::class)
                ->dailyAt('02:50');
            $schedule
                ->command(DeleteExpiredOtpCodesCommand::class)
                ->dailyAt('03:00');
            $schedule->command(CleanLogTables::class)->dailyAt('03:10');
            $schedule->command(ScheduleHealthCommand::class)->everyMinute();

            $this->monitorSchedule($schedule);
        });
    }

    /**
     * Deep merge "default-settings" config values.
     */
    private function deepMergeDefaultSettings(
        string $path,
        string $configKey,
    ): void {
        $defaultSettings = require $path;
        $userSettings = $this->app['config']->get($configKey, []);

        foreach ($userSettings as $userSetting) {
            //remove default setting, if it's overwritten by user setting
            foreach ($defaultSettings as $key => $defaultSetting) {
                if ($defaultSetting['name'] === $userSetting['name']) {
                    unset($defaultSettings[$key]);
                }
            }

            //push user setting into default settings array
            $defaultSettings[] = $userSetting;
        }

        $this->app['config']->set($configKey, $defaultSettings);
    }

    private function registerDevProviders()
    {
        if (!config('app.debug')) {
            return;
        }

        if ($this->clockworkExists()) {
            $this->app->register(ClockworkServiceProvider::class);
        }
    }

    private function clockworkExists(): bool
    {
        return class_exists(ClockworkServiceProvider::class);
    }

    private function registerCollectionExtensions(): void
    {
        // convert all array items to lowercase
        Collection::macro('toLower', function ($key = null) {
            return $this->map(function ($value) use ($key) {
                // remove all whitespace and lowercase
                if (is_string($value)) {
                    return slugify($value, ' ');
                } else {
                    $value[$key] = slugify($value[$key], ' ');
                    return $value;
                }
            });
        });

        EloquentCollection::macro('makeUsersCompact', function (
            $extraFields = [],
        ): static {
            foreach ($this as $item) {
                if ($item instanceof BaseUser) {
                    $item->setVisible([...$extraFields, 'id', 'name', 'image']);
                } else {
                    foreach ($item->getRelations() as $name => $model) {
                        if ($model instanceof BaseUser) {
                            $model->setVisible([
                                ...$extraFields,
                                'id',
                                'name',
                                'image',
                            ]);
                        }
                    }
                }
            }
            return $this;
        });

        EloquentCollection::macro('makeUsersCompactWithEmail', function (
            $extraFields = [],
        ) {
            return $this->makeUsersCompact([...$extraFields, 'email']);
        });
    }

    protected function storageDriverSelected(string $name): bool
    {
        return config('common.site.uploads_disk_driver') === $name ||
            config('common.site.public_disk_driver') === $name;
    }

    private function registerEventListeners(): void
    {
        Event::listen(SettingsSaved::class, [
            SyncPlansWhenBillingSettingsChange::class,
            UpdateAllUsersLanguageWhenDefaultLocaleChanges::class,
        ]);
        Event::subscribe(OutgoingEmailLogSubscriber::class);
        Event::listen(
            FileUploaded::class,
            CreateThumbnailForUploadedFile::class,
        );
        Event::listen(Registered::class, function (Registered $event) {
            if (
                app(Settings::class)->get('require_email_confirmation') &&
                !$event->user->hasVerifiedEmail()
            ) {
                $event->user->sendEmailVerificationNotification();
            }
        });

        if (config('common.site.workspaces_integrated')) {
            Event::listen(UsersDeleted::class, function (UsersDeleted $e) {
                $e->users->each(function (User $user) {
                    app(Workspace::class)
                        ->forUser($user->id)
                        ->get()
                        ->each(function (Workspace $workspace) use ($user) {
                            app(RemoveMemberFromWorkspace::class)->execute(
                                $workspace,
                                $user->id,
                            );
                        });
                    app(DeleteEntries::class)->execute([
                        'entryIds' => $user
                            ->entries()
                            ->pluck('file_entries.id'),
                    ]);
                });
            });
        }
    }

    public function registerCustomMailDrivers()
    {
        $this->app->get('mail.manager');
        $this->app
            ->get('mail.manager')
            ->extend('gmailApi', function (array $config) {
                return new GmailApiMailTransport();
            });

        $this->app->singleton(GmailClient::class);
    }

    private function setMorphMap()
    {
        Relation::enforceMorphMap([
            'post' => 'App\Models\Post',
            'video' => 'App\Models\Video',
            'workspace' => Workspace::class,
            'user' => User::class,
        ]);
    }
}

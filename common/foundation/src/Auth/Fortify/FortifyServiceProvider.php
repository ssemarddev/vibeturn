<?php

namespace Common\Auth\Fortify;

use Common\Auth\Fortify\FortifyRegisterUser;
use Common\Auth\Fortify\LoginResponse;
use Common\Auth\Fortify\LogoutResponse;
use Common\Auth\Fortify\RegisterResponse;
use Common\Auth\Fortify\ResetUserPassword;
use Common\Auth\Fortify\TwoFactorLoginResponse;
use Common\Auth\Fortify\UpdateUserPassword;
use Common\Auth\Fortify\ValidateLoginCredentials;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->instance(LoginResponseContract::class, new LoginResponse());
        $this->app->instance(
            TwoFactorLoginResponseContract::class,
            new TwoFactorLoginResponse(),
        );
        $this->app->instance(
            LogoutResponseContract::class,
            new LogoutResponse(),
        );
        $this->app->instance(
            RegisterResponseContract::class,
            new RegisterResponse(),
        );
    }

    public function boot()
    {
        Fortify::createUsersUsing(FortifyRegisterUser::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);

        RateLimiter::for('login', function (Request $request) {
            $email = (string) $request->email;
            return Limit::perMinute(5)->by($email . $request->ip());
        });

        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by(
                $request->session()->get('login.id'),
            );
        });

        Fortify::authenticateUsing(function (Request $request) {
            return (new ValidateLoginCredentials())->execute($request);
        });
    }
}

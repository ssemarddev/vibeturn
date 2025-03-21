<?php

namespace Common\Billing\Listeners;

use Common\Billing\Gateways\Paypal\Paypal;
use Common\Billing\Gateways\Stripe\Stripe;
use Common\Billing\Models\Product;
use Common\Settings\Events\SettingsSaved;
use Illuminate\Support\Arr;

class SyncPlansWhenBillingSettingsChange
{
    public function __construct(
        protected Stripe $stripe,
        protected Paypal $paypal,
    ) {
    }

    public function __invoke(SettingsSaved $event): void
    {
        $s = $event->envSettings;
        @ini_set('max_execution_time', 300);
        $products = Product::where('free', false)->get();

        if (Arr::get($s, 'stripe_key') || Arr::get($s, 'stripe_secret')) {
            $products->each(
                fn(Product $product) => $this->stripe->syncPlan($product),
            );
        }

        if (Arr::get($s, 'paypal_client_id') || Arr::get($s, 'paypal_secret')) {
            $products->each(
                fn(Product $product) => $this->paypal->syncPlan($product),
            );
        }
    }
}

<?php namespace Common\Billing\Gateways\Paypal;

use Common\Billing\Subscription;
use Common\Billing\Gateways\Paypal\Paypal;
use Common\Core\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class PaypalController extends BaseController
{
    public function __construct(
        protected Request $request,
        protected Subscription $subscription,
        protected Paypal $paypal,
    ) {
        $this->middleware('auth');
    }

    public function storeSubscriptionDetailsLocally(): Response|JsonResponse
    {
        $data = $this->validate($this->request, [
            'paypal_subscription_id' => 'required|string',
        ]);

        $this->paypal->subscriptions->sync(
            $data['paypal_subscription_id'],
            Auth::id(),
        );

        return $this->success();
    }
}

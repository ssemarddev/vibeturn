<?php

namespace Common\Websockets\API;

use Exception;
use Illuminate\Support\Collection;

class WebsocketAPI
{
    protected array $resolvedProviders = [];

    public function __construct(protected array $options = [])
    {
    }

    /**
     * @return Collection<int, array>
     */
    public function getActiveUsersInChannel(string $channel): Collection
    {
        return $this->resolveProvider()
            ->getActiveUsersInChannel($channel)
            ->map(function (array $item) {
                $maybeEncodedId = (string) $item['id'];
                [$modelType, $id] = explode('.', $maybeEncodedId, 2);
                return [
                    'id' => (int) $id,
                    'modelType' => $modelType,
                ];
            })
            ->unique('id');
    }

    public function getAllChannels(): Collection
    {
        return $this->resolveProvider()->getAllChannels();
    }

    protected function resolveProvider(): WebsocketProviderAPI
    {
        $providerName = config('broadcasting.default');

        if (isset($this->resolvedProviders[$providerName])) {
            return $this->resolvedProviders[$providerName];
        }

        return $this->resolvedProviders[$providerName] = match ($providerName) {
            'reverb' => new ReverbAPI($this->options),
            'pusher' => new PusherAPI($this->options),
            'ably' => new AblyAPI($this->options),
            default => throw new Exception('Unsupported websocket provider'),
        };
    }
}

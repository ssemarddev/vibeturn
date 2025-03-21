<?php

namespace Common\Auth\Traits;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait HasAvatarAttribute
{
    public function getImageAttribute(?string $value)
    {
        // absolute link
        if ($value && Str::contains($value, '//')) {
            // change google/twitter avatar imported via social login size
            $value = str_replace(
                '.jpg?sz=50',
                ".jpg?sz=$this->gravatarSize",
                $value,
            );
            if ($this->gravatarSize > 50) {
                // twitter
                $value = str_replace('_normal.jpg', '.jpg', $value);
            }
            return $value;
        }

        // relative link (for new and legacy urls)
        if ($value) {
            return Storage::disk('public')->url(
                str_replace('storage/', '', $value),
            );
        }

        // gravatar
        if ($this->gravatarEnabled) {
            $hash = md5(trim(strtolower($this->email)));
            return "https://www.gravatar.com/avatar/$hash?s={$this->gravatarSize}&d=retro";
        }

        return $value;
    }

    public function setGravatarSize(int $size): static
    {
        $this->gravatarSize = $size;
        return $this;
    }
}

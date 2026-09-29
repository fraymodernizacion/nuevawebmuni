<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;

class LocalDateTime
{
    public const TIMEZONE = 'America/Argentina/Buenos_Aires';

    public static function format(?DateTimeInterface $dateTime): ?string
    {
        return $dateTime === null
            ? null
            : DateTimeImmutable::createFromInterface($dateTime)
                ->setTimezone(new DateTimeZone(self::TIMEZONE))
                ->format('d/m/Y H:i');
    }

    public static function today(): DateTimeImmutable
    {
        return CarbonImmutable::now(self::TIMEZONE)->startOfDay();
    }

    public static function startOfDayUtc(?DateTimeInterface $dateTime = null): DateTimeImmutable
    {
        $localDateTime = $dateTime === null
            ? self::today()
            : DateTimeImmutable::createFromInterface($dateTime)
                ->setTimezone(new DateTimeZone(self::TIMEZONE))
                ->setTime(0, 0);

        return $localDateTime->setTimezone(new DateTimeZone('UTC'));
    }

    public static function nextDayUtc(?DateTimeInterface $dateTime = null): DateTimeImmutable
    {
        return self::startOfDayUtc($dateTime)
            ->setTimezone(new DateTimeZone(self::TIMEZONE))
            ->modify('+1 day')
            ->setTimezone(new DateTimeZone('UTC'));
    }
}

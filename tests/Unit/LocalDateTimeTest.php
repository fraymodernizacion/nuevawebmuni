<?php

use App\Support\LocalDateTime;
use Carbon\CarbonImmutable;

test('UTC timestamps are displayed at the corresponding Argentine time', function () {
    $timestamp = CarbonImmutable::parse('2026-09-29 02:15:00', 'UTC');

    expect(LocalDateTime::format($timestamp))->toBe('28/09/2026 23:15')
        ->and(LocalDateTime::format(null))->toBeNull();
});

test('Argentine calendar day uses UTC boundaries without changing stored timestamps', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-29 01:30:00', 'UTC'));

    try {
        expect(LocalDateTime::today()->format('Y-m-d'))->toBe('2026-09-28')
            ->and(LocalDateTime::startOfDayUtc()->format('Y-m-d H:i:s P'))->toBe('2026-09-28 03:00:00 +00:00')
            ->and(LocalDateTime::nextDayUtc()->format('Y-m-d H:i:s P'))->toBe('2026-09-29 03:00:00 +00:00');
    } finally {
        CarbonImmutable::setTestNow();
    }
});

test('the local year remains unchanged during the first three UTC hours of January', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2027-01-01 01:30:00', 'UTC'));

    try {
        expect(LocalDateTime::today()->format('Y-m-d'))->toBe('2026-12-31');
    } finally {
        CarbonImmutable::setTestNow();
    }
});

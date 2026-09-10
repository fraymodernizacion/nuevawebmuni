<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Boost Master Switch
    |--------------------------------------------------------------------------
    |
    | Keep Boost disabled during normal web requests so the app boots without
    | pulling in development-only routes, middleware, and log capture work.
    |
    */

    'enabled' => env('BOOST_ENABLED', false),

    /*
    |--------------------------------------------------------------------------
    | Browser Log Watcher
    |--------------------------------------------------------------------------
    |
    | Browser log capture is also disabled by default to keep request startup
    | lean. Enable it only when actively debugging browser-side issues.
    |
    */

    'browser_logs_watcher' => env('BOOST_BROWSER_LOGS_WATCHER', false),

];

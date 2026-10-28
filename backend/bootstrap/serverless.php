<?php

/*
|--------------------------------------------------------------------------
| Vercel Serverless Bootstrap
|--------------------------------------------------------------------------
| Ensures /tmp directories exist for Laravel's cache/views/logs
| in Vercel's read-only serverless environment.
*/

$dirs = [
    '/tmp/views',
    '/tmp/cache',
    '/tmp/sessions',
    '/tmp/logs',
];

foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

<?php

// Prepare serverless tmp directories
require __DIR__ . '/../bootstrap/serverless.php';

// Forward all requests to Laravel's public/index.php
require __DIR__ . '/../public/index.php';

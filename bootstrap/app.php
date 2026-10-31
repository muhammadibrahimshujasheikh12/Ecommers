<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

/*
| Application bootstrap: routing, middleware and exception handling.
| The admin guard (EnsureAdmin) is applied per route group in routes/web.php.
*/
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Laravel's default web middleware stack is used as-is.
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Return JSON errors to AJAX calls (e.g. the checkout delivery quote).
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();

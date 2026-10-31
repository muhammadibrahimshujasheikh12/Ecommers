<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lets only admin users (users.is_admin) through to the /admin area.
 * Everyone else is sent to the sign-in page, which returns them here afterwards.
 */
class EnsureAdmin
{
    /** Pass admins through; redirect guests and customers to login. */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->is_admin) {
            return redirect()->guest(route('login'));
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, $role   ): Response
    {
        $user = JWTAuth::parseToken()->authenticate();

        if ($user->userType !== $role) {
            return response()->json([
                'error' => 'Unauthorized - only ' . $role . ' can access this route'], 403);
        }
        return $next($request);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class LogController extends Controller
{
    private array $allowedServices = [
        'azuracast',
        'kandafm',
        'kandatv',
        'kandanews',
        'ngabopay',
        'thirdmoney',
        'mailcow-postfix-1',
        'mailcow-dovecot-1',
        'mailcow-nginx-1',
    ];

    public function nginx(): JsonResponse
    {
        $output = shell_exec('tail -n 200 /var/log/nginx/error.log 2>/dev/null');

        return response()->json(['logs' => $output ?: '']);
    }

    public function system(): JsonResponse
    {
        $output = shell_exec('journalctl -n 200 --no-pager 2>/dev/null');

        return response()->json(['logs' => $output ?: '']);
    }

    public function service(string $service): JsonResponse
    {
        if (!in_array($service, $this->allowedServices)) {
            return response()->json(['error' => 'Service not allowed'], 403);
        }

        $output = shell_exec("docker logs --tail=200 {$service} 2>&1");

        return response()->json(['service' => $service, 'logs' => $output ?: '']);
    }
}

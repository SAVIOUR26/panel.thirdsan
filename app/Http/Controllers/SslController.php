<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class SslController extends Controller
{
    public function index(): JsonResponse
    {
        $output = shell_exec('certbot certificates 2>/dev/null');
        $certs  = [];

        if ($output) {
            $blocks = explode('- - -', $output);
            foreach ($blocks as $block) {
                if (!str_contains($block, 'Certificate Name')) continue;

                preg_match('/Certificate Name: (.+)/', $block, $name);
                preg_match('/Expiry Date: (.+) \((.+)\)/', $block, $expiry);
                preg_match('/Domains: (.+)/', $block, $domains);

                if (isset($name[1])) {
                    $daysLeft = 0;
                    if (isset($expiry[2])) {
                        preg_match('/(\d+) day/', $expiry[2], $days);
                        $daysLeft = (int) ($days[1] ?? 0);
                    }

                    $certs[] = [
                        'name'      => trim($name[1]),
                        'domains'   => isset($domains[1]) ? explode(' ', trim($domains[1])) : [],
                        'expiry'    => isset($expiry[1]) ? trim($expiry[1]) : 'Unknown',
                        'days_left' => $daysLeft,
                        'status'    => $daysLeft > 30 ? 'valid' : ($daysLeft > 7 ? 'expiring' : 'critical'),
                    ];
                }
            }
        }

        return response()->json($certs);
    }

    public function renew(string $domain): JsonResponse
    {
        $output = shell_exec("certbot renew --cert-name {$domain} --force-renewal 2>&1");

        return response()->json([
            'message' => "SSL renewal attempted for {$domain}",
            'output'  => $output,
            'success' => str_contains($output, 'Successfully renewed'),
        ]);
    }

    public function renewAll(): JsonResponse
    {
        $output = shell_exec('certbot renew 2>&1');

        return response()->json([
            'message' => 'SSL renewal attempted for all certificates',
            'output'  => $output,
        ]);
    }
}

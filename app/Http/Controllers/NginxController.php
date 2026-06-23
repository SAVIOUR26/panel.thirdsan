<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NginxController extends Controller
{
    private string $sitesPath = '/etc/nginx/sites-enabled';

    public function domains(): JsonResponse
    {
        $domains = [];
        $files   = glob("{$this->sitesPath}/*.conf");

        foreach ($files as $file) {
            $content    = file_get_contents($file);
            $domainName = basename($file, '.conf');

            preg_match('/server_name\s+([^;]+);/', $content, $names);
            preg_match('/proxy_pass\s+http:\/\/localhost:(\d+)/', $content, $port);
            $hasSsl = str_contains($content, 'ssl_certificate');

            $domains[] = [
                'config'    => $domainName,
                'domains'   => isset($names[1]) ? explode(' ', trim($names[1])) : [],
                'port'      => $port[1] ?? null,
                'ssl'       => $hasSsl,
                'active'    => true,
            ];
        }

        return response()->json($domains);
    }

    public function addDomain(Request $request): JsonResponse
    {
        $request->validate([
            'domain'      => 'required|string',
            'proxy_port'  => 'required|integer|min:1000|max:65535',
            'issue_ssl'   => 'boolean',
        ]);

        $domain    = $request->domain;
        $port      = $request->proxy_port;
        $email     = config('panel.admin_email', 'info@thirdsan.com');
        $safeName  = str_replace(['.', ' '], '-', $domain);
        $confPath  = "{$this->sitesPath}/{$safeName}.conf";

        if (file_exists($confPath)) {
            return response()->json(['error' => 'Domain config already exists'], 409);
        }

        $config = <<<NGINX
server {
    listen 80;
    server_name {$domain} www.{$domain};

    location / {
        proxy_pass http://localhost:{$port};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX;

        file_put_contents($confPath, $config);

        // Test and reload Nginx
        $test = shell_exec('nginx -t 2>&1');
        if (!str_contains($test, 'test is successful')) {
            unlink($confPath);
            return response()->json(['error' => 'Nginx config test failed', 'details' => $test], 500);
        }

        shell_exec('systemctl reload nginx 2>&1');

        // Issue SSL if requested
        if ($request->issue_ssl) {
            $sslOutput = shell_exec("certbot --nginx -d {$domain} -d www.{$domain} --non-interactive --agree-tos -m {$email} 2>&1");
            return response()->json([
                'message'    => "Domain {$domain} added with SSL",
                'ssl_output' => $sslOutput,
            ]);
        }

        return response()->json(['message' => "Domain {$domain} added successfully"]);
    }

    public function removeDomain(string $domain): JsonResponse
    {
        $confPath = "{$this->sitesPath}/{$domain}.conf";

        if (!file_exists($confPath)) {
            return response()->json(['error' => 'Config not found'], 404);
        }

        unlink($confPath);
        shell_exec('systemctl reload nginx 2>&1');

        return response()->json(['message' => "Domain {$domain} removed"]);
    }

    public function reload(): JsonResponse
    {
        $test = shell_exec('nginx -t 2>&1');

        if (!str_contains($test, 'test is successful')) {
            return response()->json(['error' => 'Nginx config test failed', 'details' => $test], 500);
        }

        shell_exec('systemctl reload nginx 2>&1');

        return response()->json(['message' => 'Nginx reloaded successfully']);
    }
}

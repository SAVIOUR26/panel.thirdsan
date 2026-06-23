<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        return response()->json([
            'cpu'    => $this->getCpuUsage(),
            'ram'    => $this->getRamUsage(),
            'disk'   => $this->getDiskUsage(),
            'uptime' => $this->getUptime(),
            'load'   => $this->getLoadAverage(),
        ]);
    }

    public function health(): JsonResponse
    {
        $services = [
            'nginx'     => $this->checkSystemService('nginx'),
            'docker'    => $this->checkSystemService('docker'),
            'fail2ban'  => $this->checkSystemService('fail2ban'),
            'certbot'   => $this->checkCertbot(),
        ];

        $containers = $this->getDockerContainers();

        return response()->json([
            'services'   => $services,
            'containers' => $containers,
            'ssl'        => $this->getSslStatus(),
            'timestamp'  => now()->toISOString(),
        ]);
    }

    private function getCpuUsage(): array
    {
        $load = sys_getloadavg();
        $cores = (int) shell_exec('nproc');
        $percent = round(($load[0] / $cores) * 100, 1);

        return [
            'percent' => min($percent, 100),
            'cores'   => $cores,
            'load_1'  => $load[0],
            'load_5'  => $load[1],
            'load_15' => $load[2],
        ];
    }

    private function getRamUsage(): array
    {
        $meminfo = file_get_contents('/proc/meminfo');
        preg_match('/MemTotal:\s+(\d+)/', $meminfo, $total);
        preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $available);

        $totalKb     = (int) $total[1];
        $availableKb = (int) $available[1];
        $usedKb      = $totalKb - $availableKb;

        return [
            'total'   => round($totalKb / 1024 / 1024, 2),
            'used'    => round($usedKb / 1024 / 1024, 2),
            'free'    => round($availableKb / 1024 / 1024, 2),
            'percent' => round(($usedKb / $totalKb) * 100, 1),
            'unit'    => 'GB',
        ];
    }

    private function getDiskUsage(): array
    {
        $total = disk_total_space('/');
        $free  = disk_free_space('/');
        $used  = $total - $free;

        return [
            'total'   => round($total / 1024 / 1024 / 1024, 1),
            'used'    => round($used / 1024 / 1024 / 1024, 1),
            'free'    => round($free / 1024 / 1024 / 1024, 1),
            'percent' => round(($used / $total) * 100, 1),
            'unit'    => 'GB',
        ];
    }

    private function getUptime(): string
    {
        $uptime  = (float) file_get_contents('/proc/uptime');
        $days    = floor($uptime / 86400);
        $hours   = floor(($uptime % 86400) / 3600);
        $minutes = floor(($uptime % 3600) / 60);

        return "{$days}d {$hours}h {$minutes}m";
    }

    private function getLoadAverage(): array
    {
        $load = sys_getloadavg();
        return ['1m' => $load[0], '5m' => $load[1], '15m' => $load[2]];
    }

    private function checkSystemService(string $service): string
    {
        $status = shell_exec("systemctl is-active {$service} 2>/dev/null");
        return trim($status) === 'active' ? 'running' : 'stopped';
    }

    private function checkCertbot(): string
    {
        $result = shell_exec('certbot certificates 2>/dev/null | grep "VALID"');
        return $result ? 'running' : 'stopped';
    }

    private function getDockerContainers(): array
    {
        $output = shell_exec('docker ps --format "{{.Names}}|{{.Status}}|{{.Image}}" 2>/dev/null');
        if (!$output) return [];

        $containers = [];
        foreach (explode("\n", trim($output)) as $line) {
            if (!$line) continue;
            [$name, $status, $image] = explode('|', $line);
            $containers[] = [
                'name'    => $name,
                'status'  => str_contains($status, 'Up') ? 'running' : 'stopped',
                'image'   => $image,
                'uptime'  => $status,
            ];
        }

        return $containers;
    }

    private function getSslStatus(): array
    {
        $output = shell_exec('certbot certificates 2>/dev/null');
        if (!$output) return [];

        $certs = [];
        preg_match_all('/Certificate Name: (.+)\n.*?Expiry Date: (.+) \((.+)\)/s', $output, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $certs[] = [
                'domain'  => trim($match[1]),
                'expiry'  => trim($match[2]),
                'status'  => str_contains($match[3], 'VALID') ? 'valid' : 'expiring',
            ];
        }

        return $certs;
    }
}

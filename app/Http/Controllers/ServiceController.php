<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    // Whitelisted services only — security measure
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

    public function index(): JsonResponse
    {
        $output = shell_exec('docker ps -a --format "{{.Names}}|{{.Status}}|{{.Image}}|{{.Ports}}" 2>/dev/null');
        $containers = [];

        if ($output) {
            foreach (explode("\n", trim($output)) as $line) {
                if (!$line) continue;
                $parts = explode('|', $line);
                $name  = $parts[0] ?? '';
                $containers[] = [
                    'name'    => $name,
                    'status'  => str_contains($parts[1] ?? '', 'Up') ? 'running' : 'stopped',
                    'image'   => $parts[2] ?? '',
                    'ports'   => $parts[3] ?? '',
                    'managed' => in_array($name, $this->allowedServices),
                ];
            }
        }

        return response()->json($containers);
    }

    public function start(string $name): JsonResponse
    {
        if (!$this->isAllowed($name)) {
            return response()->json(['error' => 'Service not allowed'], 403);
        }

        $output = shell_exec("docker start {$name} 2>&1");
        $this->logAction('start', $name);

        return response()->json(['message' => "Started {$name}", 'output' => $output]);
    }

    public function stop(string $name): JsonResponse
    {
        if (!$this->isAllowed($name)) {
            return response()->json(['error' => 'Service not allowed'], 403);
        }

        $output = shell_exec("docker stop {$name} 2>&1");
        $this->logAction('stop', $name);

        return response()->json(['message' => "Stopped {$name}", 'output' => $output]);
    }

    public function restart(string $name): JsonResponse
    {
        if (!$this->isAllowed($name)) {
            return response()->json(['error' => 'Service not allowed'], 403);
        }

        $output = shell_exec("docker restart {$name} 2>&1");
        $this->logAction('restart', $name);

        return response()->json(['message' => "Restarted {$name}", 'output' => $output]);
    }

    public function logs(string $name): JsonResponse
    {
        if (!$this->isAllowed($name)) {
            return response()->json(['error' => 'Service not allowed'], 403);
        }

        $output = shell_exec("docker logs --tail=100 {$name} 2>&1");

        return response()->json([
            'service' => $name,
            'logs'    => $output,
        ]);
    }

    public function stats(string $name): JsonResponse
    {
        if (!$this->isAllowed($name)) {
            return response()->json(['error' => 'Service not allowed'], 403);
        }

        $output = shell_exec("docker stats {$name} --no-stream --format '{{.CPUPerc}}|{{.MemUsage}}|{{.NetIO}}|{{.BlockIO}}' 2>&1");
        $parts  = explode('|', trim($output));

        return response()->json([
            'service' => $name,
            'cpu'     => $parts[0] ?? '0%',
            'memory'  => $parts[1] ?? '0MB',
            'network' => $parts[2] ?? '0B',
            'block'   => $parts[3] ?? '0B',
        ]);
    }

    private function isAllowed(string $name): bool
    {
        return in_array($name, $this->allowedServices);
    }

    private function logAction(string $action, string $service): void
    {
        $log  = storage_path('logs/panel-actions.log');
        $line = now()->toISOString() . " | {$action} | {$service} | " . request()->user()->email . "\n";
        file_put_contents($log, $line, FILE_APPEND);
    }
}

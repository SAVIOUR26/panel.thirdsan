<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeploymentController extends Controller
{
    private array $services = [
        'kandafm'   => ['path' => '/opt/thirdsan/kandafm',   'compose_service' => 'kandafm'],
        'kandatv'   => ['path' => '/opt/thirdsan/kandatv',   'compose_service' => 'kandatv'],
        'kandanews' => ['path' => '/opt/thirdsan/kandanews', 'compose_service' => 'kandanews'],
        'ngabopay'  => ['path' => '/opt/thirdsan/ngabopay',  'compose_service' => 'ngabopay'],
        'thirdmoney'=> ['path' => '/opt/thirdsan/thirdmoney','compose_service' => 'thirdmoney'],
    ];

    public function index(): JsonResponse
    {
        $logFile     = storage_path('logs/deployments.json');
        $deployments = [];

        if (file_exists($logFile)) {
            $deployments = json_decode(file_get_contents($logFile), true) ?? [];
        }

        // Get latest 20
        $deployments = array_slice(array_reverse($deployments), 0, 20);

        return response()->json($deployments);
    }

    public function deploy(string $service): JsonResponse
    {
        if (!isset($this->services[$service])) {
            return response()->json(['error' => 'Unknown service'], 404);
        }

        $config    = $this->services[$service];
        $startTime = now();

        // Pull latest image and restart container
        $pullOutput    = shell_exec("cd /opt/thirdsan && docker compose pull {$config['compose_service']} 2>&1");
        $deployOutput  = shell_exec("cd /opt/thirdsan && docker compose up -d {$config['compose_service']} 2>&1");

        $success = str_contains($deployOutput, 'Started') || str_contains($deployOutput, 'Running');

        // Log the deployment
        $this->logDeployment([
            'service'   => $service,
            'status'    => $success ? 'success' : 'failed',
            'deployed_by' => request()->user()->email,
            'started_at'  => $startTime->toISOString(),
            'finished_at' => now()->toISOString(),
            'duration'    => $startTime->diffInSeconds(now()) . 's',
            'output'      => $deployOutput,
        ]);

        return response()->json([
            'service' => $service,
            'status'  => $success ? 'success' : 'failed',
            'output'  => $deployOutput,
            'message' => $success ? "✅ {$service} deployed successfully" : "❌ {$service} deployment failed",
        ]);
    }

    public function rollback(string $service): JsonResponse
    {
        if (!isset($this->services[$service])) {
            return response()->json(['error' => 'Unknown service'], 404);
        }

        // Restart with previous image tag
        $output = shell_exec("cd /opt/thirdsan && docker compose restart {$service} 2>&1");

        return response()->json([
            'service' => $service,
            'message' => "Rollback attempted for {$service}",
            'output'  => $output,
        ]);
    }

    private function logDeployment(array $data): void
    {
        $logFile     = storage_path('logs/deployments.json');
        $deployments = [];

        if (file_exists($logFile)) {
            $deployments = json_decode(file_get_contents($logFile), true) ?? [];
        }

        $deployments[] = $data;

        // Keep last 100 deployments
        if (count($deployments) > 100) {
            $deployments = array_slice($deployments, -100);
        }

        file_put_contents($logFile, json_encode($deployments, JSON_PRETTY_PRINT));
    }
}

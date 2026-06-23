<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    private string $backupPath = '/opt/thirdsan/backups';

    public function index(): JsonResponse
    {
        $backups = [];

        if (is_dir($this->backupPath)) {
            foreach (glob("{$this->backupPath}/*.tar.gz") as $file) {
                $backups[] = [
                    'filename'   => basename($file),
                    'size'       => round(filesize($file) / 1024 / 1024, 2),
                    'created_at' => date('c', filemtime($file)),
                ];
            }
        }

        usort($backups, fn ($a, $b) => strcmp($b['created_at'], $a['created_at']));

        return response()->json($backups);
    }

    public function create(): JsonResponse
    {
        if (!is_dir($this->backupPath)) {
            mkdir($this->backupPath, 0750, true);
        }

        $filename = 'backup-' . now()->format('Y-m-d_H-i-s') . '.tar.gz';
        $output = shell_exec(
            "tar -czf {$this->backupPath}/{$filename} -C /opt/thirdsan panel --exclude=panel/node_modules --exclude=panel/vendor 2>&1"
        );

        return response()->json([
            'filename' => $filename,
            'message'  => 'Backup created',
            'output'   => $output,
        ]);
    }

    public function download(string $filename): BinaryFileResponse|JsonResponse
    {
        $safeName = basename($filename);
        $path = "{$this->backupPath}/{$safeName}";

        if (!str_ends_with($safeName, '.tar.gz') || !file_exists($path)) {
            return response()->json(['error' => 'Backup not found'], 404);
        }

        return response()->download($path);
    }
}

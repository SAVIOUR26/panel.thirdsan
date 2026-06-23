<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\NginxController;
use App\Http\Controllers\DeploymentController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\SslController;
use App\Http\Controllers\LogController;

// Auth routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/health', [DashboardController::class, 'health']);

    // Services (Docker containers)
    Route::get('/services', [ServiceController::class, 'index']);
    Route::post('/services/{name}/start', [ServiceController::class, 'start']);
    Route::post('/services/{name}/stop', [ServiceController::class, 'stop']);
    Route::post('/services/{name}/restart', [ServiceController::class, 'restart']);
    Route::get('/services/{name}/logs', [ServiceController::class, 'logs']);
    Route::get('/services/{name}/stats', [ServiceController::class, 'stats']);

    // Nginx
    Route::get('/nginx/domains', [NginxController::class, 'domains']);
    Route::post('/nginx/domains', [NginxController::class, 'addDomain']);
    Route::delete('/nginx/domains/{domain}', [NginxController::class, 'removeDomain']);
    Route::post('/nginx/reload', [NginxController::class, 'reload']);

    // SSL
    Route::get('/ssl/certificates', [SslController::class, 'index']);
    Route::post('/ssl/renew/{domain}', [SslController::class, 'renew']);
    Route::post('/ssl/renew-all', [SslController::class, 'renewAll']);

    // Deployments
    Route::get('/deployments', [DeploymentController::class, 'index']);
    Route::post('/deployments/{service}/deploy', [DeploymentController::class, 'deploy']);
    Route::post('/deployments/{service}/rollback', [DeploymentController::class, 'rollback']);

    // Backups
    Route::get('/backups', [BackupController::class, 'index']);
    Route::post('/backups/create', [BackupController::class, 'create']);
    Route::get('/backups/{filename}/download', [BackupController::class, 'download']);

    // Logs
    Route::get('/logs/nginx', [LogController::class, 'nginx']);
    Route::get('/logs/system', [LogController::class, 'system']);
    Route::get('/logs/{service}', [LogController::class, 'service']);
});

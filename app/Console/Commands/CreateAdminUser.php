<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateAdminUser extends Command
{
    protected $signature = 'panel:create-admin
        {--email= : Admin email address}
        {--name= : Admin display name}
        {--password= : Admin password (random if omitted)}';

    protected $description = 'Create or update the Thirdsan Panel admin user';

    public function handle(): int
    {
        $email = $this->option('email') ?: config('panel.admin_email');
        $name = $this->option('name') ?: config('panel.admin_name');
        $password = $this->option('password') ?: Str::password(20);

        $user = User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => Hash::make($password)]
        );

        $this->info("Admin user ready: {$user->email}");

        if (!$this->option('password')) {
            $this->warn("Generated password: {$password}");
        }

        return self::SUCCESS;
    }
}

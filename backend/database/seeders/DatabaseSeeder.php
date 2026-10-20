<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed baseline roles & permissions
        $this->call(RolePermissionSeeder::class);

        // Seed baseline users for dev & testing
        $this->call(UserSeeder::class);
    }
}


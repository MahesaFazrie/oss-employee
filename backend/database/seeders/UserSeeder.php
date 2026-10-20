<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds for default user accounts.
     */
    public function run(): void
    {
        $superadminRole = Role::where('name', 'superadmin')->first();
        $direkturRole = Role::where('name', 'direktur')->first();
        $karyawanRole = Role::where('name', 'karyawan')->first();

        $defaultPassword = Hash::make('password123');

        $users = [
            [
                'name'              => 'Super Admin',
                'email'             => 'admin@oss.com',
                'password'          => $defaultPassword,
                'role_id'           => $superadminRole?->id,
                'status'            => 'active',
                'email_verified_at' => now(),
            ],
            [
                'name'              => 'Direktur Utama',
                'email'             => 'direktur@oss.com',
                'password'          => $defaultPassword,
                'role_id'           => $direkturRole?->id,
                'status'            => 'active',
                'email_verified_at' => now(),
            ],
            [
                'name'              => 'Karyawan Demo',
                'email'             => 'karyawan@oss.com',
                'password'          => $defaultPassword,
                'role_id'           => $karyawanRole?->id,
                'status'            => 'active',
                'email_verified_at' => now(),
            ],
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Seed the application's database with baseline roles and permissions.
     */
    public function run(): void
    {
        // Create roles
        $superadmin = Role::firstOrCreate(['name' => 'superadmin'], ['guard_name' => 'web']);
        $direktur = Role::firstOrCreate(['name' => 'direktur'], ['guard_name' => 'web']);
        $karyawan = Role::firstOrCreate(['name' => 'karyawan'], ['guard_name' => 'web']);

        // Define permissions
        $permissions = [
            ['name' => 'manage-users', 'description' => 'Kelola data user (CRUD)'],
            ['name' => 'manage-roles', 'description' => 'Kelola roles & permissions'],
            ['name' => 'view-logbook', 'description' => 'Lihat logbook sendiri'],
            ['name' => 'manage-logbook', 'description' => 'Kelola logbook sendiri (CRUD)'],
            ['name' => 'view-all-logbook', 'description' => 'Lihat semua logbook karyawan'],
            ['name' => 'manage-payroll', 'description' => 'Kelola pengajuan payroll'],
            ['name' => 'approve-payroll', 'description' => 'Approve/reject pengajuan payroll'],
            ['name' => 'view-reports', 'description' => 'Lihat laporan & rekap bulanan'],
            ['name' => 'manage-settings', 'description' => 'Kelola pengaturan sistem'],
        ];

        // Create permissions
        $createdPermissions = [];
        foreach ($permissions as $perm) {
            $createdPermissions[$perm['name']] = Permission::firstOrCreate(
                ['name' => $perm['name']],
                ['guard_name' => 'web', 'description' => $perm['description']]
            );
        }

        // Assign permissions to roles
        // Superadmin gets all permissions
        $superadmin->permissions()->syncWithoutDetaching(
            collect($createdPermissions)->pluck('id')->toArray()
        );

        // Direktur gets view & approval permissions
        $direktur->permissions()->syncWithoutDetaching([
            $createdPermissions['view-all-logbook']->id,
            $createdPermissions['approve-payroll']->id,
            $createdPermissions['view-reports']->id,
            $createdPermissions['view-logbook']->id,
        ]);

        // Karyawan gets self-management permissions
        $karyawan->permissions()->syncWithoutDetaching([
            $createdPermissions['view-logbook']->id,
            $createdPermissions['manage-logbook']->id,
            $createdPermissions['manage-payroll']->id,
        ]);
    }
}

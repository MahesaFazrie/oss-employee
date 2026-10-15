$user = App\Models\User::where("email", "mahesa@example.com")->first(); $user->status = "active"; $user->save(); $user->assignRole("superadmin"); echo "Berhasil!";

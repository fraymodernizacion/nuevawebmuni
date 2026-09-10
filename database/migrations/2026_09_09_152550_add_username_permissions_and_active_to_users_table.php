<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->after('name');
            $table->json('module_permissions')->nullable()->after('role');
            $table->boolean('active')->default(true)->after('module_permissions')->index();
        });

        DB::table('users')
            ->orderBy('id')
            ->get(['id', 'email', 'name'])
            ->each(function (object $user): void {
                $baseUsername = Str::of((string) ($user->email ?: $user->name))
                    ->before('@')
                    ->ascii()
                    ->lower()
                    ->replaceMatches('/[^a-z0-9._-]+/', '.')
                    ->trim('.')
                    ->toString() ?: 'usuario';
                $username = $baseUsername;
                $suffix = 2;

                while (DB::table('users')->where('username', $username)->where('id', '!=', $user->id)->exists()) {
                    $username = "{$baseUsername}{$suffix}";
                    $suffix++;
                }

                DB::table('users')->where('id', $user->id)->update(['username' => $username]);
            });

        Schema::table('users', function (Blueprint $table) {
            $table->unique('username');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn(['username', 'module_permissions', 'active']);
        });
    }
};

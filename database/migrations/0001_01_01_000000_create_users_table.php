<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * REFACTORED: Removed custom `roles` table and `role_id` FK from users.
 * Role management is now delegated to spatie/laravel-permission which provides
 * its own `roles`, `permissions`, and pivot tables via its own published migration.
 *
 * Users table now follows the APP_SPECIFICATION.md SSOT:
 *   id (BigIncrements), username, email, password, timestamps()
 *   plus is_active (operational flag) and remember_token for Sanctum.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Core users table — spec-compliant: id, username, email, password, timestamps
        Schema::create('users', function (Blueprint $table) {
            $table->id();                                        // BigIncrements 'id' per spec
            $table->string('username', 100)->unique();
            $table->string('email', 150)->unique();
            $table->string('password');
            $table->boolean('is_active')->default(true);         // Operational flag for account status
            $table->rememberToken();
            $table->timestamps();                                // created_at + updated_at per spec

            $table->index('is_active');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};

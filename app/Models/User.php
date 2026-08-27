<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Primary key sesuai spesifikasi brief: user_id.
     */
    protected $primaryKey = 'user_id';

    /**
     * Aktifkan timestamps (created_at & updated_at).
     * Diperlukan untuk tracking perubahan user data.
     */
    public $timestamps = true;

    /**
     * Kolom yang boleh diisi secara mass assignment.
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'role_id',
        'is_active',
    ];

    /**
     * Kolom yang disembunyikan saat serialization (JSON response).
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Type casting untuk kolom tertentu.
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    /**
     * Relasi: User belongs to satu Role.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    // =========================================================================
    // ROLE HELPER METHODS
    // Digunakan di Policy, Gate, Middleware, dan Controller
    // =========================================================================

    /**
     * Cek apakah user memiliki role tertentu.
     */
    public function hasRole(string $roleName): bool
    {
        return $this->role && $this->role->role_name === $roleName;
    }

    /**
     * Cek apakah user memiliki salah satu dari role yang diberikan.
     */
    public function hasAnyRole(array $roleNames): bool
    {
        return $this->role && in_array($this->role->role_name, $roleNames);
    }

    /**
     * Cek apakah user adalah Super Admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole(Role::SUPER_ADMIN);
    }

    /**
     * Cek apakah user adalah Project Manager.
     */
    public function isProjectManager(): bool
    {
        return $this->hasRole(Role::PROJECT_MANAGER);
    }

    /**
     * Cek apakah user adalah Member.
     */
    public function isMember(): bool
    {
        return $this->hasRole(Role::MEMBER);
    }

    /**
     * Cek apakah user adalah Client.
     */
    public function isClient(): bool
    {
        return $this->hasRole(Role::CLIENT);
    }

    /**
     * Mendapatkan nama role yang mudah dibaca.
     */
    public function getRoleDisplayNameAttribute(): string
    {
        return $this->role ? $this->role->display_name : 'Unknown';
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    /**
     * Primary key sesuai spesifikasi brief: role_id.
     */
    protected $primaryKey = 'role_id';

    /**
     * Nonaktifkan default timestamps.
     * Kita hanya menggunakan created_at yang di-set manual di migration.
     */
    public $timestamps = false;

    /**
     * Kolom yang boleh diisi secara mass assignment.
     */
    protected $fillable = [
        'role_name',
        'display_name',
        'description',
    ];

    /**
     * Konstanta role untuk menghindari magic string di seluruh aplikasi.
     * Digunakan untuk pengecekan role di Policy, Gate, dan Middleware.
     */
    const SUPER_ADMIN = 'super_admin';
    const PROJECT_MANAGER = 'project_manager';
    const MEMBER = 'member';
    const CLIENT = 'client';

    /**
     * Daftar semua role yang valid.
     * Digunakan untuk validasi dan seeding.
     */
    const ALL_ROLES = [
        self::SUPER_ADMIN,
        self::PROJECT_MANAGER,
        self::MEMBER,
        self::CLIENT,
    ];

    /**
     * Relasi: Satu role memiliki banyak user.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id', 'role_id');
    }

    /**
     * Cek apakah role ini adalah Super Admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role_name === self::SUPER_ADMIN;
    }

    /**
     * Cek apakah role ini adalah Project Manager.
     */
    public function isProjectManager(): bool
    {
        return $this->role_name === self::PROJECT_MANAGER;
    }

    /**
     * Cek apakah role ini adalah Member.
     */
    public function isMember(): bool
    {
        return $this->role_name === self::MEMBER;
    }

    /**
     * Cek apakah role ini adalah Client.
     */
    public function isClient(): bool
    {
        return $this->role_name === self::CLIENT;
    }
}

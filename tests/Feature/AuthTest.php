<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AuthTest extends TestCase
{
    // Menggunakan DatabaseTransactions agar database tetap bersih setelah test
    use DatabaseTransactions;

    /**
     * Test login untuk semua role yang telah seeded di database.
     */
    public function test_user_can_login_with_all_roles(): void
    {
        $users = [
            [
                'email' => 'superadmin@pm.test',
                'role_name' => 'super_admin',
                'display_name' => 'Super Admin'
            ],
            [
                'email' => 'pm@pm.test',
                'role_name' => 'project_manager',
                'display_name' => 'Project Manager'
            ],
            [
                'email' => 'member@pm.test',
                'role_name' => 'member',
                'display_name' => 'Member'
            ],
            [
                'email' => 'viewer@pm.test',
                'role_name' => 'viewer',
                'display_name' => 'Viewer'
            ],
        ];

        foreach ($users as $u) {
            $response = $this->postJson('/api/login', [
                'email' => $u['email'],
                'password' => 'password123',
            ]);

            $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'user' => [
                            'user_id',
                            'username',
                            'email',
                            'role' => [
                                'role_id',
                                'role_name',
                                'display_name',
                            ],
                            'is_active',
                            'created_at',
                        ]
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'user' => [
                            'email' => $u['email'],
                            'role' => [
                                'role_name' => $u['role_name'],
                                'display_name' => $u['display_name'],
                            ]
                        ]
                    ]
                ]);
        }
    }

    /**
     * Test login gagal dengan kredensial salah.
     */
    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'superadmin@pm.test',
            'password' => 'wrong_password',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Email atau password salah.',
            ]);
    }

    /**
     * Test login gagal jika akun dinonaktifkan (is_active = false).
     */
    public function test_login_fails_if_user_is_inactive(): void
    {
        // Cari user member, nonaktifkan sementara untuk testing
        $user = User::where('email', 'member@pm.test')->first();
        $user->is_active = false;
        $user->save();

        $response = $this->postJson('/api/login', [
            'email' => 'member@pm.test',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Akun Anda telah dinonaktifkan. Hubungi administrator.',
            ]);
    }

    /**
     * Test akses /api/me untuk user terautentikasi dan tamu (unauthenticated).
     */
    public function test_profile_endpoint_access(): void
    {
        // 1. Tamu (Unauthenticated) harus ditolak 401
        $guestResponse = $this->getJson('/api/me');
        $guestResponse->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthorized. Silakan login terlebih dahulu.',
            ]);

        // 2. User Terautentikasi (Super Admin) harus diizinkan
        $user = User::where('email', 'superadmin@pm.test')->first();
        
        $authResponse = $this->actingAs($user)
            ->getJson('/api/me');

        $authResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'superadmin@pm.test',
                    ]
                ]
            ]);
    }

    /**
     * Test proteksi middleware role: register hanya boleh diakses oleh super_admin.
     */
    public function test_role_middleware_authorizes_super_admin_only_for_register(): void
    {
        $superAdmin = User::where('email', 'superadmin@pm.test')->first();
        $pmUser = User::where('email', 'pm@pm.test')->first();

        // 1. Project Manager mencoba register -> Harus Ditolak (403 Forbidden)
        $pmResponse = $this->actingAs($pmUser)
            ->postJson('/api/register', [
                'username' => 'newuser',
                'email' => 'newuser@pm.test',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role_id' => 3,
            ]);

        $pmResponse->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Forbidden. Anda tidak memiliki akses untuk tindakan ini.',
            ]);

        // 2. Super Admin mencoba register -> Harus Diizinkan (201 Created)
        $saResponse = $this->actingAs($superAdmin)
            ->postJson('/api/register', [
                'username' => 'newmember',
                'email' => 'newmember@pm.test',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role_id' => 3,
            ]);

        $saResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'User berhasil didaftarkan.',
            ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    /**
     * Test login untuk semua role yang telah seeded di database.
     */
    public function test_user_can_login_with_all_roles(): void
    {
        $users = [
            [
                'email' => 'superadmin@pm.test',
                'role_name' => 'super_admin',
            ],
            [
                'email' => 'pm@pm.test',
                'role_name' => 'project_manager',
            ],
            [
                'email' => 'member@pm.test',
                'role_name' => 'member',
            ],
            [
                'email' => 'viewer@pm.test',
                'role_name' => 'viewer',
            ],
        ];

        foreach ($users as $u) {
            $user = User::factory()->create(['email' => $u['email']]);
            $user->assignRole($u['role_name']);

            $response = $this->post('/login', [
                'email' => $u['email'],
                'password' => 'password', // Default factory password
            ]);

            $response->assertRedirect(route('projects.index'));
            $response->assertSessionHas('success', 'Login berhasil.');
            $this->assertAuthenticatedAs($user);

            // Log out for next iteration
            $this->post('/logout');
            $this->assertGuest();
        }
    }

    /**
     * Test login gagal dengan kredensial salah.
     */
    public function test_login_fails_with_invalid_credentials(): void
    {
        $user = User::factory()->create(['email' => 'superadmin@pm.test']);
        $user->assignRole('super_admin');

        $response = $this->post('/login', [
            'email' => 'superadmin@pm.test',
            'password' => 'wrong_password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    /**
     * Test login gagal jika akun dinonaktifkan (is_active = false).
     */
    public function test_login_fails_if_user_is_inactive(): void
    {
        $user = User::factory()->inactive()->create(['email' => 'member@pm.test']);
        $user->assignRole('member');

        $response = $this->post('/login', [
            'email' => 'member@pm.test',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    /**
     * Test akses /me untuk user terautentikasi dan tamu (unauthenticated).
     */
    public function test_profile_endpoint_access(): void
    {
        // 1. Tamu (Unauthenticated) harus ditolak 302 ke login
        $guestResponse = $this->get('/me');
        $guestResponse->assertRedirect(route('login'));

        // 2. User Terautentikasi (Super Admin) harus diizinkan dan render komponen
        $user = User::factory()->create(['email' => 'superadmin@pm.test']);
        $user->assignRole('super_admin');
        
        $authResponse = $this->actingAs($user)
            ->get('/me');

        $authResponse->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Auth/Profile')
                ->has('user')
            );
    }

    /**
     * Test proteksi middleware role: register hanya boleh diakses oleh super_admin.
     */
    public function test_role_middleware_authorizes_super_admin_only_for_register(): void
    {
        $superAdmin = User::factory()->create(['email' => 'superadmin@pm.test']);
        $superAdmin->assignRole('super_admin');

        $pmUser = User::factory()->create(['email' => 'pm@pm.test']);
        $pmUser->assignRole('project_manager');

        // 1. Project Manager mencoba register -> Harus Ditolak (403 Forbidden)
        $pmResponse = $this->actingAs($pmUser)
            ->post('/register', [
                'username' => 'newuser',
                'email' => 'newuser@pm.test',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role' => 'member',
            ]);

        $pmResponse->assertForbidden();

        // 2. Super Admin mencoba register -> Harus Diizinkan (302 Redirect back)
        $saResponse = $this->actingAs($superAdmin)
            ->post('/register', [
                'username' => 'newmember',
                'email' => 'newmember@pm.test',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role' => 'member',
            ]);

        $saResponse->assertRedirect();
        $saResponse->assertSessionHas('success', 'User berhasil didaftarkan.');
        $this->assertDatabaseHas('users', ['email' => 'newmember@pm.test']);
    }
}



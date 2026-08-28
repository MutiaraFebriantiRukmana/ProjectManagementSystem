<?php

namespace App\Providers;

use App\Models\Project;
use App\Models\Task;
use App\Observers\TaskObserver;
use App\Policies\ProjectPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * Register Policies here for explicit, discoverable mapping.
     * Laravel 12 also supports auto-discovery via convention, but explicit
     * registration is preferred per enterprise spec for auditability.
     */
    public function boot(): void
    {
        Gate::policy(Project::class, ProjectPolicy::class);
        Task::observe(TaskObserver::class);
    }
}

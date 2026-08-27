<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreProjectRequest — Validates project creation input.
 *
 * Spec rule: NEVER write $request->validate() inside Controllers.
 * Authorization is handled here + in ProjectPolicy (double-check).
 */
class StoreProjectRequest extends FormRequest
{
    /**
     * Delegate authorization to ProjectPolicy via the controller's authorize() call.
     * This FormRequest always returns true — policy check happens in the controller.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status'      => ['required', 'string', 'in:planning,active,on_hold,completed,cancelled'],
            'start_date'  => ['required', 'date'],
            'end_date'    => ['required', 'date', 'after_or_equal:start_date'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'             => 'Project name is required.',
            'status.in'                 => 'Invalid project status. Allowed: planning, active, on_hold, completed, cancelled.',
            'start_date.required'       => 'Start date is required.',
            'end_date.required'         => 'End date (deadline) is required.',
            'end_date.after_or_equal'   => 'End date must be on or after the start date.',
        ];
    }
}

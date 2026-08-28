<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateProjectRequest — Validates project update input.
 *
 * Spec rule: NEVER write $request->validate() inside Controllers.
 */
class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status'      => ['sometimes', 'string', 'in:planning,active,on_hold,completed,cancelled'],
            'start_date'  => ['sometimes', 'date'],
            'end_date'    => ['sometimes', 'date', 'after_or_equal:start_date'],
            'manager_id'  => ['sometimes', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in'               => 'Invalid project status. Allowed: planning, active, on_hold, completed, cancelled.',
            'end_date.after_or_equal' => 'End date must be on or after the start date.',
            'manager_id.exists'       => 'User yang dipilih sebagai Manager tidak ditemukan.',
        ];
    }
}

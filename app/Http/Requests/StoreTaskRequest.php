<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'project_id'        => ['required', 'integer', 'exists:projects,id'],
            'parent_id'         => ['nullable', 'integer', 'exists:tasks,id'],
            'title'             => ['required', 'string', 'max:255'],
            'description'       => ['nullable', 'string'],
            'priority'          => ['required', 'in:low,medium,high,critical'],
            'status'            => ['nullable', 'in:backlog,todo,in_progress,review,done'],
            'start_date'        => ['nullable', 'date'],
            'end_date'          => ['nullable', 'date', 'after_or_equal:start_date'],
            'requires_approval' => ['nullable', 'boolean'],
            'assignees'         => ['nullable', 'array'],
            'assignees.*'       => ['integer', 'exists:users,id'],
            'labels'            => ['nullable', 'array'],
            'labels.*'          => ['integer', 'exists:labels,id'],
            'dependencies'      => ['nullable', 'array'],
            'dependencies.*'    => ['integer', 'exists:tasks,id'],
        ];
    }
}
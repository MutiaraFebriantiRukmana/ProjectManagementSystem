<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'        => ['required', 'in:backlog,todo,in_progress,review,done'],
            'prev_position' => ['nullable', 'numeric'],
            'next_position' => ['nullable', 'numeric'],
        ];
    }
}
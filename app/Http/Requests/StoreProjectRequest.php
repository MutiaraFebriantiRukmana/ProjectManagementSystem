<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Otorisasi ditangani oleh Gate::authorize('create', Project::class) di controller
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status'      => ['required', 'string', 'in:planning,active,on_hold,completed,cancelled'],
            'start_date'  => ['required', 'date'],
            'end_date'    => ['required', 'date', 'after_or_equal:start_date'],
            'manager_id'  => ['required', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'           => 'Nama project wajib diisi.',
            'status.in'               => 'Status project tidak valid.',
            'end_date.after_or_equal' => 'Deadline project harus sama atau setelah tanggal mulai.',
            'manager_id.required'     => 'Project Manager wajib dipilih.',
            'manager_id.exists'       => 'User yang dipilih sebagai Manager tidak ditemukan.',
        ];
    }
}
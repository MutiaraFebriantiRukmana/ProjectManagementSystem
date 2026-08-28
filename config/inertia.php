<?php

return [
    'testing' => [
        'ensure_pages_exist' => false, // Nonaktifkan pengecekan fisik file saat testing
        'page_paths' => [
            resource_path('js/Pages'),
        ],
        'page_extensions' => [
            'js',
            'jsx',
            'svelte',
            'ts',
            'tsx',
            'vue',
        ],
    ],
];
// Ziggy global route helper
declare function route(): { current(name: string): boolean; };
declare function route(name: string, params?: Record<string, unknown>): string;

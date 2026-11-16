export const hasPermission = (auth: any, permissionName: string) => {
    // Super Admin bypasses all checks
    if (auth.user?.roles?.includes('super_admin') || auth.user?.roles?.includes('Super Admin')) {
        return true;
    }
    return auth.user?.permissions?.includes(permissionName);
};

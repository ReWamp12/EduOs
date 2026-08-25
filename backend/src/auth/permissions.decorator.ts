import { SetMetadata } from '@nestjs/common';

export interface PermissionRequirement {
  module: string;
  action: string;
  scope?: 'self' | 'branch' | 'tenant' | 'system';
}

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions and scope on a controller route.
 * Example: @RequirePermission({ module: 'academics', action: 'gradebook.approve', scope: 'tenant' })
 */
export const RequirePermission = (requirement: PermissionRequirement) =>
  SetMetadata(PERMISSIONS_KEY, requirement);

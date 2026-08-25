import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionRequirement } from './permissions.decorator';

// Canonical default permission capabilities per stakeholder role
const ROLE_PERMISSIONS: Record<string, Record<string, string[]>> = {
  super_admin: {
    '*': ['*'],
  },
  principal: {
    academics: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    attendance: ['view', 'approve', 'export'],
    exams: ['view', 'create', 'edit', 'approve', 'export'],
    hr: ['view', 'approve', 'export'],
    compliance: ['view', 'edit', 'approve', 'export'],
    notices: ['view', 'create', 'edit', 'delete', 'approve'],
  },
  teacher: {
    academics: ['view', 'create', 'edit'],
    attendance: ['view', 'create', 'edit'],
    exams: ['view', 'create', 'edit'],
    notices: ['view'],
    lms: ['view', 'create', 'edit'],
    assignments: ['view', 'create', 'edit', 'grade'],
  },
  student: {
    academics: ['view'],
    attendance: ['view'],
    exams: ['view'],
    lms: ['view'],
    assignments: ['view', 'submit'],
    notices: ['view'],
    support: ['view', 'create'],
  },
  parent: {
    academics: ['view'],
    attendance: ['view'],
    exams: ['view'],
    finance: ['view', 'pay'],
    consent: ['view', 'approve'],
    notices: ['view'],
  },
  hr_manager: {
    hr: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    careers: ['view', 'create', 'edit', 'delete', 'export'],
    notices: ['view', 'create'],
  },
  finance_officer: {
    finance: ['view', 'create', 'edit', 'approve', 'export'],
    payroll: ['view', 'create', 'edit', 'approve', 'export'],
    notices: ['view'],
  },
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirement) {
      return true; // No explicit permission restriction on this endpoint
    }

    const request = context.switchToHttp().getRequest();
    const userRole = request.headers['x-user-role'] || request.user?.role || 'student';
    const tenantId = request.headers['x-tenant-id'] || request.user?.tenantId;

    // Check if role is recognized
    const roleCaps = ROLE_PERMISSIONS[userRole];
    if (!roleCaps) {
      this.logger.warn(`Access denied: Unknown role '${userRole}'`);
      throw new ForbiddenException(`Role '${userRole}' has no registered permissions.`);
    }

    // Super admin bypass
    if (roleCaps['*']?.includes('*')) {
      return true;
    }

    const allowedActions = roleCaps[requirement.module] || [];
    const hasPermission =
      allowedActions.includes('*') ||
      allowedActions.includes(requirement.action) ||
      allowedActions.some((a) => requirement.action.startsWith(a));

    if (!hasPermission) {
      this.logger.warn(
        `Access denied: Role '${userRole}' lacks '${requirement.action}' on module '${requirement.module}'`,
      );
      throw new ForbiddenException(
        `Role '${userRole}' is not authorized to execute '${requirement.action}' on '${requirement.module}'.`,
      );
    }

    return true;
  }
}

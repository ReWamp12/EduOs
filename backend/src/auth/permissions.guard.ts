import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionRequirement } from './permissions.decorator';
import { SupabaseService } from '../supabase.service';

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

  constructor(
    private reflector: Reflector,
    @Optional() private supabaseService?: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirement) {
      return true; // No explicit permission restriction on this endpoint
    }

    const request = context.switchToHttp().getRequest();
    let userRole = request.user?.role;
    let tenantId = request.user?.tenantId;

    // If Supabase is configured and a Bearer token is provided, verify it cryptographically
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];
    if (this.supabaseService?.isConfigured() && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      try {
        const client = this.supabaseService.getClient();
        const { data: { user }, error } = await client.auth.getUser(token);
        if (error || !user) {
          throw new UnauthorizedException('Invalid or expired authentication token');
        }

        // Fetch profile
        const { data: profile } = await client
          .from('user_profiles')
          .select('role, tenant_id')
          .eq('auth_user_id', user.id)
          .single();

        userRole = profile?.role || user.user_metadata?.role || user.app_metadata?.role || 'student';
        tenantId = profile?.tenant_id || user.user_metadata?.tenant_id || user.app_metadata?.tenant_id;

        request.user = {
          id: user.id,
          email: user.email,
          role: userRole,
          tenantId,
        };
      } catch (err) {
        if (err instanceof UnauthorizedException) throw err;
        this.logger.warn(`Token verification failed: ${err}`);
        throw new UnauthorizedException('Authentication token verification failed');
      }
    }

    // Fallback for tests / mocks / dev if request.user is explicitly set or in sandbox mode
    if (!userRole) {
      if (!this.supabaseService?.isConfigured() || process.env.NODE_ENV === 'test') {
        userRole = request.headers['x-user-role'] || 'student';
        tenantId = request.headers['x-tenant-id'];
      } else {
        throw new UnauthorizedException('Missing authentication token for protected endpoint');
      }
    }

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

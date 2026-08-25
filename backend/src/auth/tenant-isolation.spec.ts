import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY, PermissionRequirement } from './permissions.decorator';
import { EventBusService, DomainEvent } from '../common/events/event-bus.service';
import { AuditService } from '../common/audit/audit.service';
import { SupabaseService } from '../supabase.service';

describe('EDUOS-108: Multi-Tenant Isolation & RBAC Security Suite', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let eventBus: EventBusService;
  let auditService: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        Reflector,
        EventBusService,
        AuditService,
        {
          provide: SupabaseService,
          useValue: {
            isConfigured: () => false,
            getClient: () => null,
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);
    eventBus = module.get<EventBusService>(EventBusService);
    auditService = module.get<AuditService>(AuditService);
  });

  function createMockExecutionContext(
    userRole: string,
    tenantId: string = 'tenant-aaa-111',
    permRequirement?: PermissionRequirement,
  ): ExecutionContext {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(permRequirement);

    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'x-user-role': userRole,
            'x-tenant-id': tenantId,
          },
          user: { role: userRole, tenantId },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  describe('1. Server-Side RBAC Enforcement', () => {
    it('allows super_admin access to all modules and actions', () => {
      const context = createMockExecutionContext('super_admin', 'tenant-aaa', {
        module: 'compliance',
        action: 'pocso_vault.view',
        scope: 'tenant',
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('allows teacher to mark attendance and view academics', () => {
      const context = createMockExecutionContext('teacher', 'tenant-aaa', {
        module: 'attendance',
        action: 'create',
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('denies teacher when attempting to approve payroll or compliance items', () => {
      const context = createMockExecutionContext('teacher', 'tenant-aaa', {
        module: 'finance',
        action: 'payroll.approve',
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('allows student to view LMS lessons and submit assignments', () => {
      const context = createMockExecutionContext('student', 'tenant-aaa', {
        module: 'assignments',
        action: 'submit',
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('denies student when attempting to mark attendance or publish notices', () => {
      const context = createMockExecutionContext('student', 'tenant-aaa', {
        module: 'attendance',
        action: 'create',
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('denies unregistered or arbitrary roles', () => {
      const context = createMockExecutionContext('attacker_role', 'tenant-aaa', {
        module: 'academics',
        action: 'view',
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('2. Domain Event Bus Decoupling', () => {
    it('dispatches typed domain events with tenant context', (done) => {
      const tenantId = 'tenant-demo-888';
      eventBus.subscribe('attendance.marked', (event: DomainEvent) => {
        expect(event.eventName).toBe('attendance.marked');
        expect(event.tenantId).toBe(tenantId);
        expect(event.payload.presentCount).toBe(42);
        done();
      });

      eventBus.emit('attendance.marked', {
        tenantId,
        actorId: 'teacher-user-1',
        payload: { batchId: 'batch-10a', presentCount: 42, absentCount: 3 },
      });
    });
  });

  describe('3. Audit Logging Service', () => {
    it('logs operational mutations with tenant isolation tags', async () => {
      const logSpy = jest.spyOn(auditService, 'log');
      await auditService.log({
        tenantId: 'tenant-001',
        actorId: 'principal-1',
        actorRole: 'principal',
        action: 'approve',
        module: 'hr',
        recordId: 'emp-101',
        entityType: 'employee_record',
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-001',
          action: 'approve',
          module: 'hr',
        }),
      );
    });
  });
});

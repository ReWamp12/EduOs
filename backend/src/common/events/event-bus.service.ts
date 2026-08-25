import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export type DomainEventName =
  | 'attendance.marked'
  | 'attendance.student_absent'
  | 'assignment.created'
  | 'assignment.submitted'
  | 'fee.invoice_generated'
  | 'fee.paid'
  | 'leave.requested'
  | 'leave.actioned'
  | 'applicant.stage_changed'
  | 'consent.signed'
  | 'gradebook.published'
  | 'safety.inspection_gap_flagged';

export interface DomainEvent<T = any> {
  id: string;
  eventName: DomainEventName;
  tenantId: string;
  branchId?: string;
  actorId?: string;
  timestamp: string;
  payload: T;
}

export type DomainEventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  /**
   * Publishes a typed domain event across system modules.
   */
  emit<T = any>(eventName: DomainEventName, event: Omit<DomainEvent<T>, 'id' | 'timestamp' | 'eventName'>): void {
    const fullEvent: DomainEvent<T> = {
      id: crypto.randomUUID(),
      eventName,
      timestamp: new Date().toISOString(),
      ...event,
    };

    this.logger.log(
      `[EVENT_BUS] Event published: '${eventName}' | Tenant: ${fullEvent.tenantId} | Actor: ${fullEvent.actorId || 'system'}`,
    );

    this.emitter.emit(eventName, fullEvent);
    this.emitter.emit('*', fullEvent); // Wildcard listener for monitoring / webhooks
  }

  /**
   * Subscribes a handler to a specific domain event.
   */
  subscribe<T = any>(eventName: DomainEventName, handler: DomainEventHandler<T>): () => void {
    this.emitter.on(eventName, handler);
    return () => this.emitter.off(eventName, handler);
  }

  /**
   * Subscribes to all domain events (e.g. for audit logging or outbound webhook dispatcher).
   */
  subscribeAll(handler: DomainEventHandler): () => void {
    this.emitter.on('*', handler);
    return () => this.emitter.off('*', handler);
  }
}

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventBusService } from '../common/events/event-bus.service';
import { AuditService } from '../common/audit/audit.service';

export interface FeeHead {
  name: string;
  category: 'tuition' | 'laboratory' | 'library' | 'sports' | 'examination' | 'transport' | 'composite';
  amount: number;
}

export interface PayrollInput {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  basicPay: number;
  hra: number;
  da: number;
  allowances: number;
  customTds?: number;
}

export interface CalculatedPayrollItem {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  basicPay: number;
  hra: number;
  da: number;
  allowances: number;
  grossPay: number;
  pfDeduction: number;   // 12% of Basic + DA
  esiDeduction: number;  // 0.75% of Gross if gross <= 21,000, else 0
  ptDeduction: number;   // Standard Professional Tax slab (e.g. ₹200)
  tdsDeduction: number;  // Income tax deduction
  totalDeductions: number;
  netPay: number;
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  note?: string;
}

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Calculates total annual fee schedule and installment breakdown.
   */
  calculateCompositeFee(heads: FeeHead[], concessionDiscountPct = 0): {
    subtotal: number;
    discountAmount: number;
    totalPayable: number;
    quarterlyInstallment: number;
  } {
    const subtotal = heads.reduce((sum, h) => sum + h.amount, 0);
    const discountAmount = (subtotal * concessionDiscountPct) / 100;
    const totalPayable = subtotal - discountAmount;
    const quarterlyInstallment = Math.round(totalPayable / 4);

    return {
      subtotal,
      discountAmount,
      totalPayable,
      quarterlyInstallment,
    };
  }

  /**
   * Calculates monthly payroll with statutory Indian compliance deductions (PF, ESI, PT, TDS).
   */
  calculateEmployeeSalary(input: PayrollInput): CalculatedPayrollItem {
    const grossPay = input.basicPay + input.hra + input.da + input.allowances;

    // PF: 12% of (Basic + DA)
    const pfDeduction = Math.round((input.basicPay + input.da) * 0.12);

    // ESI: 0.75% of gross pay if eligible (gross <= 21,000)
    const esiDeduction = grossPay <= 21000 ? Math.round(grossPay * 0.0075) : 0;

    // Professional Tax standard slab
    const ptDeduction = grossPay > 15000 ? 200 : 0;

    // TDS estimate
    const tdsDeduction = input.customTds ?? (grossPay > 50000 ? Math.round(grossPay * 0.1) : 0);

    const totalDeductions = pfDeduction + esiDeduction + ptDeduction + tdsDeduction;
    const netPay = grossPay - totalDeductions;

    return {
      ...input,
      grossPay,
      pfDeduction,
      esiDeduction,
      ptDeduction,
      tdsDeduction,
      totalDeductions,
      netPay,
    };
  }

  /**
   * Validates and posts an immutable double-entry journal entry to the General Ledger.
   */
  validateAndPostJournal(
    entryNumber: string,
    description: string,
    lines: JournalLine[],
    tenantId: string,
    userId: string,
  ): { isValid: boolean; totalDebit: number; totalCredit: number } {
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Double-entry imbalance: Total Debits (₹${totalDebit}) must equal Total Credits (₹${totalCredit}).`,
      );
    }

    this.logger.log(
      `Posted GL Journal Entry ${entryNumber}: ₹${totalDebit} (${description}) for tenant ${tenantId}`,
    );

    // Log to statutory audit ledger (fire-and-forget; AuditService handles its own errors)
    void this.auditService.log({
      tenantId,
      actorId: userId,
      actorRole: 'finance_officer',
      action: 'create',
      module: 'finance',
      entityType: 'journal_entries',
      recordId: entryNumber,
      afterState: { totalDebit, totalCredit, description, lineCount: lines.length },
    });

    return {
      isValid: true,
      totalDebit,
      totalCredit,
    };
  }

  /**
   * Handles fee collection receipting and automatically triggers GL journal entry posting.
   */
  processFeeCollection(
    invoiceId: string,
    studentName: string,
    amount: number,
    paymentMethod: string,
    tenantId: string,
    userId: string,
  ): { receiptNumber: string; journalEntryNumber: string } {
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
    const journalEntryNumber = `JV-FEE-${Date.now().toString().slice(-6)}`;

    // Automatic Double-Entry GL Posting:
    // Debit 1001 Cash/Bank (Asset Increases)
    // Credit 4001 Student Tuition Fee Income (Income Increases)
    const lines: JournalLine[] = [
      {
        accountCode: paymentMethod.toLowerCase().includes('cash') ? '1001' : '1002',
        accountName: paymentMethod.toLowerCase().includes('cash') ? 'Cash in Hand' : 'Operating Bank Account (HDFC)',
        debit: amount,
        credit: 0,
        note: `Fee collection from ${studentName} via ${paymentMethod}`,
      },
      {
        accountCode: '4001',
        accountName: 'Student Tuition & Composite Fee Income',
        debit: 0,
        credit: amount,
        note: `Revenue recognized for Invoice ${invoiceId}`,
      },
    ];

    this.validateAndPostJournal(journalEntryNumber, `Fee receipt ${receiptNumber} - ${studentName}`, lines, tenantId, userId);

    // Emit domain event for multi-module synchronization
    this.eventBus.emit('fee.paid', {
      tenantId,
      actorId: userId,
      payload: {
        invoiceId,
        studentName,
        amount,
        paymentMethod,
        receiptNumber,
      },
    });

    return {
      receiptNumber,
      journalEntryNumber,
    };
  }
}

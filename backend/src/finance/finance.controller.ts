import { Controller, Get, Post, Body, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import type { FeeHead, PayrollInput, JournalLine } from './finance.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';

@Controller('finance')
@UseGuards(PermissionsGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('fee-structure/calculate')
  @RequirePermission({ module: 'finance', action: 'manage' })
  calculateFeeStructure(@Body() body: { heads: FeeHead[]; concessionDiscountPct?: number }) {
    return this.financeService.calculateCompositeFee(body.heads || [], body.concessionDiscountPct || 0);
  }

  @Post('payroll/calculate-employee')
  @RequirePermission({ module: 'payroll', action: 'manage' })
  calculatePayroll(@Body() body: PayrollInput) {
    return this.financeService.calculateEmployeeSalary(body);
  }

  @Post('fees/collect')
  @RequirePermission({ module: 'finance', action: 'manage' })
  collectFee(
    @Body() body: { invoiceId: string; studentName: string; amount: number; paymentMethod: string },
    @Headers('x-tenant-id') tenantId = '00000000-0000-0000-0000-000000000001',
    @Headers('x-user-id') userId = 'sys-finance-01',
  ) {
    if (!body.invoiceId || !body.amount) {
      throw new BadRequestException('Invoice ID and collection amount are required.');
    }
    return this.financeService.processFeeCollection(
      body.invoiceId,
      body.studentName || 'Student',
      body.amount,
      body.paymentMethod || 'UPI',
      tenantId,
      userId,
    );
  }

  @Post('journal/post')
  @RequirePermission({ module: 'finance', action: 'manage' })
  postJournal(
    @Body() body: { entryNumber: string; description: string; lines: JournalLine[] },
    @Headers('x-tenant-id') tenantId = '00000000-0000-0000-0000-000000000001',
    @Headers('x-user-id') userId = 'sys-accountant-01',
  ) {
    return this.financeService.validateAndPostJournal(
      body.entryNumber || `JV-${Date.now()}`,
      body.description || 'General Ledger Journal Voucher',
      body.lines || [],
      tenantId,
      userId,
    );
  }
}

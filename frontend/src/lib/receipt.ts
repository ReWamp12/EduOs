'use client';

import type { FeeInvoiceRecord } from './store';

/**
 * Generates and downloads an official fee receipt as a real PDF file.
 *
 * jsPDF is imported dynamically so it never enters the SSR bundle and only
 * loads when a receipt is actually requested.
 *
 * Note on currency: the ₹ glyph (U+20B9) is absent from jsPDF's built-in
 * WinAnsi-encoded Helvetica and renders as garbage, so the PDF uses the
 * "Rs." form that Indian receipts conventionally accept.
 */
export async function downloadFeeReceipt(
  inv: FeeInvoiceRecord,
  school: { name: string; affiliation?: string; address?: string } = {
    name: 'Modern Public School',
    affiliation: 'CBSE Affiliation No. 1030492 · School Code: 20491',
    address: 'Main Senior Wing Campus, Institutional Area, New Delhi - 110058',
  },
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const PAGE_W = doc.internal.pageSize.getWidth();
  const M = 48; // page margin
  const rs = (n: number) => `Rs. ${n.toLocaleString('en-IN')}`;
  let y = 56;

  // ---- School header -------------------------------------------------
  doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(15, 23, 42);
  doc.text(school.name.toUpperCase(), PAGE_W / 2, y, { align: 'center' });
  y += 16;

  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(100, 116, 139);
  if (school.affiliation) {
    doc.text(school.affiliation, PAGE_W / 2, y, { align: 'center' });
    y += 12;
  }
  if (school.address) {
    doc.text(school.address, PAGE_W / 2, y, { align: 'center' });
    y += 20;
  }

  // ---- Title band ----------------------------------------------------
  doc.setFillColor(241, 245, 249);
  doc.rect(M, y, PAGE_W - M * 2, 26, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(30, 41, 59);
  doc.text('OFFICIAL STUDENT FEE RECEIPT', PAGE_W / 2, y + 17, { align: 'center' });
  y += 44;

  // ---- Particulars of payer -----------------------------------------
  const rows: Array<[string, string, string, string]> = [
    ['Student Name', inv.studentName || '-', 'Roll Number / Class', `${inv.studentRoll || '-'} · ${inv.batchName || '-'}`],
    ['Receipt Number', inv.receiptNumber || '-', 'Payment Date', inv.paidOn || '-'],
    ['Transaction Reference', inv.transactionId || '-', 'Payment Mode', inv.paymentMethod || '-'],
    ['Invoice Number', inv.invoiceNumber || '-', 'Billing Period', inv.title || '-'],
  ];

  const colL = M + 10;
  const colR = PAGE_W / 2 + 6;
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(M, y - 14, PAGE_W - M * 2, rows.length * 32 + 12, 4, 4, 'S');

  for (const [lLabel, lValue, rLabel, rValue] of rows) {
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(100, 116, 139);
    doc.text(lLabel.toUpperCase(), colL, y);
    doc.text(rLabel.toUpperCase(), colR, y);

    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(15, 23, 42);
    doc.text(String(lValue), colL, y + 13, { maxWidth: PAGE_W / 2 - M - 20 });
    doc.text(String(rValue), colR, y + 13, { maxWidth: PAGE_W / 2 - M - 20 });
    y += 32;
  }
  y += 22;

  // ---- Fee head table ------------------------------------------------
  doc.setFillColor(248, 250, 252);
  doc.rect(M, y - 14, PAGE_W - M * 2, 24, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(71, 85, 105);
  doc.text('PARTICULARS / FEE HEAD', colL, y + 2);
  doc.text('AMOUNT (INR)', PAGE_W - M - 10, y + 2, { align: 'right' });
  y += 24;

  const heads = inv.breakdown?.length ? inv.breakdown : [{ head: inv.title, amount: inv.amount }];
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(30, 41, 59);
  for (const h of heads) {
    doc.text(String(h.head), colL, y);
    doc.text(rs(Number(h.amount) || 0), PAGE_W - M - 10, y, { align: 'right' });
    y += 10;
    doc.setDrawColor(241, 245, 249);
    doc.line(M, y, PAGE_W - M, y);
    y += 14;
  }

  // ---- Total ---------------------------------------------------------
  doc.setDrawColor(203, 213, 225);
  doc.line(M, y - 6, PAGE_W - M, y - 6);
  y += 10;
  doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(15, 23, 42);
  doc.text('Total Amount Paid', colL, y);
  doc.setTextColor(4, 120, 87);
  doc.text(rs(inv.amount), PAGE_W - M - 10, y, { align: 'right' });
  y += 34;

  // ---- Status stamp --------------------------------------------------
  const isPaid = inv.status === 'paid';
  if (isPaid) {
    doc.setFillColor(236, 253, 245);
  } else {
    doc.setFillColor(254, 242, 242);
  }
  doc.roundedRect(M, y - 14, 150, 24, 4, 4, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(9);
  if (isPaid) {
    doc.setTextColor(4, 120, 87);
  } else {
    doc.setTextColor(185, 28, 28);
  }
  doc.text(isPaid ? 'PAID - VERIFIED & CLEARED' : `STATUS: ${inv.status.toUpperCase()}`, M + 12, y + 2);
  y += 44;

  // ---- Footer --------------------------------------------------------
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(148, 163, 184);
  doc.text(
    'This is a computer-generated receipt and does not require a physical signature.',
    PAGE_W / 2,
    y,
    { align: 'center' },
  );
  y += 12;
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, PAGE_W / 2, y, { align: 'center' });

  const safe = (inv.receiptNumber || inv.invoiceNumber || 'receipt').replace(/[^A-Za-z0-9._-]/g, '-');
  const who = (inv.studentName || 'student').replace(/[^A-Za-z0-9]/g, '-');
  doc.save(`Fee-Receipt-${safe}-${who}.pdf`);
}

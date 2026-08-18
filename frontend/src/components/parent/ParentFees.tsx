'use client';

import React, { useState } from 'react';
import { mockFeeInvoices } from '@/lib/mockData';
import { CreditCard, Download, CheckCircle2, ShieldCheck, QrCode, ArrowRight, IndianRupee, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FeeInvoiceItem {
  id: string;
  title: string;
  amount: number;
  dueDate?: string;
  status: string;
  paidOn?: string;
  transactionId?: string;
  receiptUrl?: string;
  studentName: string;
  breakdown?: { head: string; amount: number }[];
}

export const ParentFees: React.FC = () => {
  const [invoices, setInvoices] = useState<FeeInvoiceItem[]>(mockFeeInvoices);
  const [isPaying, setIsPaying] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleOpenPayment = (inv: any) => {
    setActiveInvoice(inv);
    setIsPaying(true);
  };

  const handleCompletePayment = () => {
    setIsPaying(false);
    setPaymentSuccess(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === activeInvoice.id
          ? {
              ...inv,
              status: 'paid',
              paidOn: 'Today, 03:30 PM',
              transactionId: `TXN-UPI-${Math.floor(10000000 + Math.random() * 90000000)}`,
            }
          : inv
      )
    );

    setTimeout(() => setPaymentSuccess(false), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Fee Invoices &amp; Online Payments</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Student: <strong>Aarav Sharma</strong> &bull; Class 11 - JEE Advanced Alpha
          </p>
        </div>
      </div>

      {paymentSuccess && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          borderRadius: 'var(--radius-sm)',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600,
          animation: 'fadeIn 0.3s ease',
        }}>
          <CheckCircle2 size={20} />
          Payment of ₹45,000 completed successfully! Official Tax/Fee receipt generated and sent to parent WhatsApp.
        </div>
      )}

      {/* Invoices List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="glass-card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              borderLeft: inv.status === 'paid' ? '4px solid #10B981' : '4px solid #F59E0B',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    {inv.status === 'paid' ? 'PAID & CLEARED' : 'DUE / UNPAID'}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{inv.title}</h3>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {inv.status === 'paid' ? (
                    <>Paid on: <strong style={{ color: '#fff' }}>{inv.paidOn}</strong> &bull; Txn ID: <code>{inv.transactionId}</code></>
                  ) : (
                    <>Due Date: <strong style={{ color: '#F59E0B' }}>{inv.dueDate}</strong> &bull; 0% Late Fee Grace Period Active</>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: inv.status === 'paid' ? '#10B981' : '#F59E0B' }}>
                  ₹{inv.amount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Fee Breakdown if unpaid */}
            {inv.breakdown && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Fee Head Breakdown:
                </div>
                {inv.breakdown.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.head}</span>
                    <strong style={{ color: 'var(--text-primary)' }}>₹{item.amount.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              {inv.status === 'paid' ? (
                <button className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                  <Download size={16} /> Download Official Tax Receipt (PDF)
                </button>
              ) : (
                <button
                  onClick={() => handleOpenPayment(inv)}
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #4F46E5)', fontSize: '0.85rem' }}
                >
                  <CreditCard size={16} /> Pay ₹{inv.amount.toLocaleString()} Online (UPI / Card)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Simulated Payment Modal */}
      {isPaying && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div className="glass-card" style={{
            width: '420px',
            padding: '28px',
            background: '#111827',
            border: '1px solid rgba(79, 70, 229, 0.4)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#10B981" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>EduOS Pay Gateway</h3>
              </div>
              <button
                onClick={() => setIsPaying(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &times;
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payable Amount</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                ₹{activeInvoice.amount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Apex Institute of Science &bull; Term 2 Fees
              </div>
            </div>

            {/* UPI QR Simulation */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{ background: '#fff', padding: '8px', borderRadius: '8px' }}>
                <QrCode size={120} color="#000" />
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Scan with Google Pay, PhonePe, or Paytm
              </span>
            </div>

            <button
              onClick={handleCompletePayment}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #10B981, #06B6D4)',
              }}
            >
              Simulate Successful 1-Tap UPI Payment <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

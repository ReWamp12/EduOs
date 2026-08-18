'use client';

import React, { useState } from 'react';
import { Scale, Plus, Check, ShieldCheck, FileText, Globe, Layers, AlertCircle } from 'lucide-react';

interface ComplianceRule {
  id: string;
  code: string;
  name: string;
  authority: string;
  jurisdiction: string;
  frequency: 'Annual' | 'One-Time' | 'Quarterly' | 'Continuous';
  category: 'Safety' | 'Affiliation' | 'Child Protection' | 'Labor & Tax';
  mandatoryFor: string[];
}

export const ComplianceLib: React.FC = () => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<'All' | 'National' | 'State' | 'Board'>('All');
  const [rules, setRules] = useState<ComplianceRule[]>([
    {
      id: 'rule-1',
      code: 'CBSE-BYE-01',
      name: 'Admission & Withdrawal Master Register Digital Lock',
      authority: 'CBSE Affiliation Bye-Laws 2025/2026',
      jurisdiction: 'National',
      frequency: 'Continuous',
      category: 'Affiliation',
      mandatoryFor: ['K-12 School', 'Higher Secondary'],
    },
    {
      id: 'rule-2',
      code: 'SAF-NOC-01',
      name: 'Annual Fire Safety NOC & Equipment Inspection Audit',
      authority: 'State Disaster Management & Fire Authority',
      jurisdiction: 'State',
      frequency: 'Annual',
      category: 'Safety',
      mandatoryFor: ['Coaching Institute', 'K-12 School', 'College', 'University'],
    },
    {
      id: 'rule-3',
      code: 'POCSO-SEC-19',
      name: 'Mandatory Child Protection / POSH Internal Committee Composition',
      authority: 'POCSO Act 2012 / POSH Act 2013',
      jurisdiction: 'National',
      frequency: 'Annual',
      category: 'Child Protection',
      mandatoryFor: ['K-12 School', 'Coaching Institute'],
    },
    {
      id: 'rule-4',
      code: 'RTE-SEC-12',
      name: 'RTE Act 25% Reserved Quota Admission & Fee Reimbursement Claim',
      authority: 'Department of School Education (RTE 2009)',
      jurisdiction: 'State',
      frequency: 'Annual',
      category: 'Affiliation',
      mandatoryFor: ['K-12 School'],
    },
    {
      id: 'rule-5',
      code: 'UDISE-PLUS-26',
      name: 'UDISE+ Annual Digital Return & APAAR ID Synchronizer',
      authority: 'Ministry of Education (Govt. of India)',
      jurisdiction: 'National',
      frequency: 'Annual',
      category: 'Affiliation',
      mandatoryFor: ['K-12 School'],
    },
    {
      id: 'rule-6',
      code: 'LABOR-PF-01',
      name: 'Statutory Provident Fund (PF) & ESI Remittance Ledger',
      authority: 'Ministry of Labour & Employment',
      jurisdiction: 'National',
      frequency: 'Quarterly',
      category: 'Labor & Tax',
      mandatoryFor: ['Coaching Institute', 'K-12 School', 'College', 'University'],
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState({
    code: '',
    name: '',
    authority: '',
    jurisdiction: 'National',
    frequency: 'Annual' as const,
    category: 'Safety' as const,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.code || !newRule.name) return;

    const created: ComplianceRule = {
      id: `rule-${Date.now()}`,
      code: newRule.code,
      name: newRule.name,
      authority: newRule.authority || 'Regulatory Body',
      jurisdiction: newRule.jurisdiction,
      frequency: newRule.frequency,
      category: newRule.category,
      mandatoryFor: ['Coaching Institute', 'K-12 School'],
    };

    setRules([created, ...rules]);
    setShowAddModal(false);
    setNewRule({
      code: '',
      name: '',
      authority: '',
      jurisdiction: 'National',
      frequency: 'Annual',
      category: 'Safety',
    });
    setSuccessMessage(`Statutory Rule "${created.code}" registered into Master Library.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const filteredRules = rules.filter((r) => {
    if (selectedJurisdiction === 'All') return true;
    return r.jurisdiction === selectedJurisdiction;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scale size={26} color="#F59E0B" /> Global Statutory Compliance Ruleset Library
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Central repository of legal checklists, statutory filings, and board affiliation standards assigned to tenants
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #4F46E5)', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> Add Compliance Rule
        </button>
      </div>

      {successMessage && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          borderRadius: 'var(--radius-sm)',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
        }}>
          <Check size={18} /> {successMessage}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {(['All', 'National', 'State'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedJurisdiction(filter)}
            className={selectedJurisdiction === filter ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
          >
            {filter === 'All' ? 'All Jurisdictions' : `${filter} Regulatory Standards`}
          </button>
        ))}
      </div>

      {/* Rules Grid / Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>RULE CODE &amp; STANDARD</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>MANDATING AUTHORITY</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>CATEGORY</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>AUDIT FREQUENCY</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>APPLICABILITY</th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((rule) => (
              <tr key={rule.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{rule.name}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <code style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{rule.code}</code>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>&bull; {rule.jurisdiction} Scope</span>
                  </div>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{rule.authority}</td>
                <td style={{ padding: '16px' }}>
                  <span className={`badge ${
                    rule.category === 'Safety' ? 'badge-danger' :
                    rule.category === 'Child Protection' ? 'badge-warning' :
                    rule.category === 'Affiliation' ? 'badge-primary' : 'badge-success'
                  }`} style={{ fontSize: '0.75rem' }}>
                    {rule.category}
                  </span>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {rule.frequency}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {rule.mandatoryFor.map((item, idx) => (
                      <span key={idx} style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="glass-card" style={{ width: '560px', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '18px' }}>
              Define Statutory Compliance Requirement
            </h3>

            <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>RULE IDENTIFIER CODE</label>
                <input
                  type="text"
                  placeholder="e.g. CBSE-AFF-2026"
                  value={newRule.code}
                  onChange={(e) => setNewRule({ ...newRule, code: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    marginTop: '4px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>STATUTORY RULE / REGISTER NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Mandatory Student Water & Health Hygiene Certificate"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    marginTop: '4px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>MANDATING BODY</label>
                  <input
                    type="text"
                    placeholder="e.g. Municipal Health Dept"
                    value={newRule.authority}
                    onChange={(e) => setNewRule({ ...newRule, authority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginTop: '4px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>CATEGORY</label>
                  <select
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginTop: '4px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="Safety">Safety &amp; Infrastructure</option>
                    <option value="Affiliation">Board Affiliation / UDISE+</option>
                    <option value="Child Protection">Child Safeguarding / POCSO</option>
                    <option value="Labor & Tax">Labor Law, PF &amp; Tax</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Save to Ruleset Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

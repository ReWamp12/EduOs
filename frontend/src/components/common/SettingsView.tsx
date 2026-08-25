'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { UserRole } from '@/lib/types';
import { PageHeader, SectionCard, Card, Badge, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  User,
  Bell,
  Shield,
  Sliders,
  Sparkles,
  BookOpen,
  Calendar,
  KeyRound,
  Laptop,
  Check,
  Save,
  Clock,
  Mail,
  Phone,
  School,
  HeartHandshake,
  MessageSquare,
  FileText,
  CreditCard,
  Bus,
  ShieldAlert,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

interface SettingsViewProps {
  onNavigate?: (tab: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const { session } = useAuth();
  const role: UserRole = session?.roles[0] ?? 'student';

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'preferences' | 'notifications' | 'security'>('profile');

  // Common Profile State
  const [firstName, setFirstName] = useState(session?.firstName || '');
  const [lastName, setLastName] = useState(session?.lastName || '');
  const [phone, setPhone] = useState('+91-9810111001');
  const [emergencyPhone, setEmergencyPhone] = useState('+91-9810111002');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [saving, setSaving] = useState(false);

  // Student Preferences
  const [studentGoal, setStudentGoal] = useState('cbse_10');
  const [aiAssistantStyle, setAiAssistantStyle] = useState<'concise' | 'step_by_step' | 'socratic'>('step_by_step');
  const [dppDifficulty, setDppDifficulty] = useState<'standard' | 'advanced' | 'olympiad'>('standard');
  const [offlineCacheWifi, setOfflineCacheWifi] = useState(true);
  const [dailyDigestTime, setDailyDigestTime] = useState('07:30 AM');

  // Teacher Preferences
  const [defaultAttendanceMode, setDefaultAttendanceMode] = useState<'fast_batch' | 'detailed_remarks' | 'qr_scan'>('fast_batch');
  const [autoRemindAssignments, setAutoRemindAssignments] = useState(true);
  const [remindHoursBefore, setRemindHoursBefore] = useState('24');
  const [aiBloomsLevel, setAiBloomsLevel] = useState<'apply' | 'analyze' | 'evaluate'>('analyze');
  const [ptmSlotDuration, setPtmSlotDuration] = useState('15');
  const [ptmWindowDay, setPtmWindowDay] = useState('Saturday');
  const [ptmWindowTime, setPtmWindowTime] = useState('10:00 AM - 01:00 PM');
  const [allowParentDirectReply, setAllowParentDirectReply] = useState(false);

  // Parent Preferences
  const [gatePassAlerts, setGatePassAlerts] = useState(true);
  const [gatePassChannel, setGatePassChannel] = useState<'sms' | 'whatsapp' | 'both'>('both');
  const [unexcusedAbsenceSiren, setUnexcusedAbsenceSiren] = useState(true);
  const [busArrivalAlertThreshold, setBusArrivalAlertThreshold] = useState('5');
  const [feeInvoiceReminders, setFeeInvoiceReminders] = useState(true);
  const [weeklyLearningDigest, setWeeklyLearningDigest] = useState(true);
  const [digestDeliveryDay, setDigestDeliveryDay] = useState('Friday Evening');
  const [preferredPtmMode, setPreferredPtmMode] = useState<'in_person' | 'google_meet'>('in_person');

  // Notification Channels
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSMS, setNotifSMS] = useState(true);
  const [notifWhatsApp, setNotifWhatsApp] = useState(true);

  // Security / Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
    if (session) {
      setFirstName(session.firstName || '');
      setLastName(session.lastName || '');
    }
  }, [session]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast('Profile updated', 'success', 'Your contact details and preferences have been synchronized.');
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast('Preferences saved', 'success', 'Your role-specific workflow settings have been updated.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast('Current password required', 'error');
      return;
    }
    if (newPassword.length < 8) {
      toast('Password too short', 'warning', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match', 'error', 'Please ensure new passwords match.');
      return;
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast('Password changed successfully', 'success', 'Your authentication credentials have been securely updated.');
  };

  const fullName = session ? `${session.firstName} ${session.lastName}`.trim() : 'User';
  const roleDisplay = role.replace('_', ' ').toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings & Workspace Preferences"
        subtitle={`Configure role settings, automated alert pipelines and credentials for ${fullName} (${roleDisplay})`}
        actions={
          <Badge tone="primary">
            <Sliders size={14} /> Active Session: Modern Public School
          </Badge>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { id: 'profile', label: 'Profile & Identity', icon: <User size={15} /> },
          {
            id: 'preferences',
            label:
              role === 'student'
                ? 'Academic & AI Tools'
                : role === 'teacher'
                ? 'Classroom & Pedagogy'
                : role === 'parent'
                ? 'Child Safety & Alerts'
                : 'Operational Controls',
            icon: <Sliders size={15} />,
          },
          { id: 'notifications', label: 'Broadcast Channels', icon: <Bell size={15} /> },
          { id: 'security', label: 'Security & Auth', icon: <Shield size={15} /> },
        ].map((tab) => {
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-text-secondary hover:bg-surface-muted hover:text-foreground',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ----------------- TAB 1: PROFILE & IDENTITY ----------------- */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <Card className="p-6">
            <h3 className="text-section font-bold text-foreground">Identity Information</h3>
            <p className="mt-1 text-meta text-text-secondary">
              Official institutional record mapped to the CBSE & EduOS tenant registry.
            </p>

            <form onSubmit={handleSaveProfile} className="mt-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="eyebrow">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input mt-1.5 w-full"
                    required
                  />
                </div>
                <div>
                  <label className="eyebrow">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input mt-1.5 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="eyebrow">Official Email Address</label>
                  <input
                    type="email"
                    value={session?.email || ''}
                    disabled
                    className="input mt-1.5 w-full bg-surface-muted opacity-80 cursor-not-allowed"
                  />
                  <span className="text-[0.7rem] text-text-tertiary">Managed by school administrator</span>
                </div>
                <div>
                  <label className="eyebrow">Primary Contact Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input mt-1.5 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="eyebrow">Emergency Contact Number</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="input mt-1.5 w-full"
                  />
                </div>
                <div>
                  <label className="eyebrow">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="input mt-1.5 w-full"
                  >
                    <option value="O+">O+ (Universal Donor)</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button type="submit" className="btn-primary" disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </Card>

          {/* Profile Card Summary */}
          <div className="flex flex-col gap-4">
            <Card className="flex flex-col items-center p-6 text-center">
              <img
                src={
                  session?.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`
                }
                alt={fullName}
                className="h-24 w-24 rounded-full border-2 border-primary object-cover shadow-md"
              />
              <h4 className="mt-3 text-section font-bold text-foreground">{fullName}</h4>
              <Badge tone="primary" className="mt-1">
                {roleDisplay}
              </Badge>
              <div className="mt-4 w-full rounded-md bg-surface-muted p-3 text-left text-meta text-text-secondary">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-micro font-semibold uppercase">Institution:</span>
                  <span className="font-medium text-foreground">Modern Public School</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-micro font-semibold uppercase">Affiliation:</span>
                  <span className="font-medium text-foreground">CBSE New Delhi</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-micro font-semibold uppercase">Status:</span>
                  <span className="font-medium text-success">Verified Active</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: ROLE-SPECIFIC PREFERENCES ----------------- */}
      {activeSubTab === 'preferences' && (
        <div className="flex flex-col gap-6">
          {/* === STUDENT SETTINGS === */}
          {role === 'student' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard title="Study Assistant & AI Tutor Defaults" icon={<Sparkles size={18} />}>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="eyebrow">Target Board / Competitive Examination</label>
                    <select
                      value={studentGoal}
                      onChange={(e) => setStudentGoal(e.target.value)}
                      className="input mt-1.5 w-full"
                    >
                      <option value="cbse_10">CBSE Class 10 Board Excellence (NCERT Exemplar Focus)</option>
                      <option value="cbse_ntse">CBSE Class 10 + NTSE Scholar Foundation</option>
                      <option value="olympiad">Math & Science Olympiads (NSEJS / RMO Foundation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="eyebrow">AI Homework Companion Explanation Style</label>
                    <div className="mt-2 grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'step_by_step', label: 'Step-by-Step', desc: 'Detailed method' },
                        { id: 'concise', label: 'Concise Bullet', desc: 'Quick formulas' },
                        { id: 'socratic', label: 'Socratic Hints', desc: 'Guide to answer' },
                      ].map((style) => (
                        <div
                          key={style.id}
                          onClick={() => setAiAssistantStyle(style.id as any)}
                          className={cn(
                            'cursor-pointer rounded-lg border p-3 text-center transition-all',
                            aiAssistantStyle === style.id
                              ? 'border-primary bg-primary-soft text-primary font-bold'
                              : 'border-border bg-surface text-text-secondary hover:border-primary/40',
                          )}
                        >
                          <div className="text-meta">{style.label}</div>
                          <div className="text-[0.68rem] text-text-tertiary">{style.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="eyebrow">Daily Practice Problem (DPP) Difficulty Bias</label>
                    <select
                      value={dppDifficulty}
                      onChange={(e) => setDppDifficulty(e.target.value as any)}
                      className="input mt-1.5 w-full"
                    >
                      <option value="standard">Standard (NCERT Exercise & Board PYQ Level)</option>
                      <option value="advanced">Advanced (High-Order Thinking Skills HOTS)</option>
                      <option value="olympiad">Olympiad Level</option>
                    </select>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Offline Sync & Morning Schedule Digest" icon={<BookOpen size={18} />}>
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 bg-surface-muted">
                    <div>
                      <div className="font-semibold text-meta text-foreground">Auto-Download Classroom Notes</div>
                      <div className="text-micro text-text-secondary">
                        Pre-cache LMS lesson slides and chapter PDFs automatically when on school WiFi.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={offlineCacheWifi}
                      onChange={(e) => setOfflineCacheWifi(e.target.checked)}
                      className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="eyebrow">Daily Morning Schedule Broadcast</label>
                    <select
                      value={dailyDigestTime}
                      onChange={(e) => setDailyDigestTime(e.target.value)}
                      className="input mt-1.5 w-full"
                    >
                      <option value="07:00 AM">07:00 AM (Before Leaving Home)</option>
                      <option value="07:30 AM">07:30 AM (Recommended)</option>
                      <option value="08:00 AM">08:00 AM (At School Gate)</option>
                    </select>
                  </div>

                  <div className="mt-auto pt-4 flex justify-end">
                    <button onClick={handleSavePreferences} className="btn-primary" disabled={saving}>
                      <Save size={16} /> Save Student Preferences
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* === TEACHER SETTINGS === */}
          {role === 'teacher' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard title="Classroom & Attendance Workflows" icon={<Calendar size={18} />}>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="eyebrow">Default Attendance Taking Mode</label>
                    <select
                      value={defaultAttendanceMode}
                      onChange={(e) => setDefaultAttendanceMode(e.target.value as any)}
                      className="input mt-1.5 w-full"
                    >
                      <option value="fast_batch">Fast Batch (All Present with One-Tap Absence Toggles)</option>
                      <option value="detailed_remarks">Detailed Register (Record Medical & Late Arrival Notes)</option>
                      <option value="qr_scan">Gate QR Pass & NFC Terminal Synchronization</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 bg-surface-muted">
                    <div>
                      <div className="font-semibold text-meta text-foreground">Pending Homework Auto-Reminders</div>
                      <div className="text-micro text-text-secondary">
                        Automatically dispatch reminder notifications to students with missing submissions before due date.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoRemindAssignments}
                      onChange={(e) => setAutoRemindAssignments(e.target.checked)}
                      className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                    />
                  </div>

                  {autoRemindAssignments && (
                    <div>
                      <label className="eyebrow">Dispatch Reminder Window</label>
                      <select
                        value={remindHoursBefore}
                        onChange={(e) => setRemindHoursBefore(e.target.value)}
                        className="input mt-1.5 w-full"
                      >
                        <option value="12">12 Hours Before Deadline</option>
                        <option value="24">24 Hours Before Deadline (Standard)</option>
                        <option value="48">48 Hours Before Deadline</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="eyebrow">AI Question Studio Bloom's Taxonomy Focus</label>
                    <select
                      value={aiBloomsLevel}
                      onChange={(e) => setAiBloomsLevel(e.target.value as any)}
                      className="input mt-1.5 w-full"
                    >
                      <option value="apply">Application & Numerical Calculation</option>
                      <option value="analyze">Analysis & Case-Based Assertion/Reasoning (Recommended)</option>
                      <option value="evaluate">Evaluation & High-Order Critical Assessment</option>
                    </select>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Parent-Teacher Meeting (PTM) & Communication" icon={<HeartHandshake size={18} />}>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="eyebrow">Designated PTM Day</label>
                    <select
                      value={ptmWindowDay}
                      onChange={(e) => setPtmWindowDay(e.target.value)}
                      className="input mt-1.5 w-full"
                    >
                      <option value="Saturday">Saturday (Institutional Standard)</option>
                      <option value="Friday Afternoon">Friday Afternoon</option>
                    </select>
                  </div>

                  <div>
                    <label className="eyebrow">Available Meeting Hours</label>
                    <input
                      type="text"
                      value={ptmWindowTime}
                      onChange={(e) => setPtmWindowTime(e.target.value)}
                      className="input mt-1.5 w-full"
                    />
                  </div>

                  <div>
                    <label className="eyebrow">Slot Duration Per Parent Consultation</label>
                    <select
                      value={ptmSlotDuration}
                      onChange={(e) => setPtmSlotDuration(e.target.value)}
                      className="input mt-1.5 w-full"
                    >
                      <option value="10">10 Minutes (Fast Feedback)</option>
                      <option value="15">15 Minutes (Comprehensive Review)</option>
                      <option value="20">20 Minutes (In-Depth Academic Counseling)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 bg-surface-muted">
                    <div>
                      <div className="font-semibold text-meta text-foreground">Allow Direct Parent Replies</div>
                      <div className="text-micro text-text-secondary">
                        When disabled, parent communications are routed via official broadcast and scheduled PTM only.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowParentDirectReply}
                      onChange={(e) => setAllowParentDirectReply(e.target.checked)}
                      className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                    />
                  </div>

                  <div className="mt-auto pt-2 flex justify-end">
                    <button onClick={handleSavePreferences} className="btn-primary" disabled={saving}>
                      <Save size={16} /> Save Teacher Preferences
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* === PARENT SETTINGS === */}
          {role === 'parent' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard title="Child Safety & Gate Attendance Alerts" icon={<ShieldAlert size={18} />}>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 bg-surface-muted">
                    <div>
                      <div className="font-semibold text-meta text-foreground">Instant Campus Gate Entry / Exit Alerts</div>
                      <div className="text-micro text-text-secondary">
                        Real-time alert when your child's QR identity card is validated at the school gate.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={gatePassAlerts}
                      onChange={(e) => setGatePassAlerts(e.target.checked)}
                      className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="eyebrow">Gate Alert Delivery Channel</label>
                    <select
                      value={gatePassChannel}
                      onChange={(e) => setGatePassChannel(e.target.value as any)}
                      className="input mt-1.5 w-full"
                    >
                      <option value="whatsapp">Official WhatsApp Notification</option>
                      <option value="sms">High-Priority SMS Broadcast</option>
                      <option value="both">Both WhatsApp & SMS (Recommended for Safety)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/20 p-4 bg-destructive-soft">
                    <div>
                      <div className="font-semibold text-meta text-destructive">Emergency Absence High-Priority Alert</div>
                      <div className="text-micro text-text-secondary">
                        Receive an urgent alert if child is unmarked in morning attendance by 09:15 AM.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={unexcusedAbsenceSiren}
                      onChange={(e) => setUnexcusedAbsenceSiren(e.target.checked)}
                      className="h-5 w-5 rounded border-border text-destructive focus:ring-destructive"
                    />
                  </div>

                  <div>
                    <label className="eyebrow">School Bus GPS Proximity Alert</label>
                    <select
                      value={busArrivalAlertThreshold}
                      onChange={(e) => setBusArrivalAlertThreshold(e.target.value)}
                      className="input mt-1.5 w-full"
                    >
                      <option value="3">Alert 3 Minutes Before Designated Stop</option>
                      <option value="5">Alert 5 Minutes Before Designated Stop (Standard)</option>
                      <option value="10">Alert 10 Minutes Before Designated Stop</option>
                    </select>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Fee Reminders & AI Learning Digest" icon={<CreditCard size={18} />}>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 bg-surface-muted">
                    <div>
                      <div className="font-semibold text-meta text-foreground">Term Fee Invoice Due Reminders</div>
                      <div className="text-micro text-text-secondary">
                        Receive auto-reminders 7 days and 3 days before term installment deadlines.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={feeInvoiceReminders}
                      onChange={(e) => setFeeInvoiceReminders(e.target.checked)}
                      className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 bg-surface-muted">
                    <div>
                      <div className="font-semibold text-meta text-foreground">Weekly AI Performance Narrative</div>
                      <div className="text-micro text-text-secondary">
                        Detailed summary covering homework completion, test trends and subject strengths.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={weeklyLearningDigest}
                      onChange={(e) => setWeeklyLearningDigest(e.target.checked)}
                      className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="eyebrow">Preferred PTM Consultation Mode</label>
                    <select
                      value={preferredPtmMode}
                      onChange={(e) => setPreferredPtmMode(e.target.value as any)}
                      className="input mt-1.5 w-full"
                    >
                      <option value="in_person">In-Person (School Campus Room 101)</option>
                      <option value="google_meet">Virtual Video Conference (Google Meet)</option>
                    </select>
                  </div>

                  <div className="mt-auto pt-2 flex justify-end">
                    <button onClick={handleSavePreferences} className="btn-primary" disabled={saving}>
                      <Save size={16} /> Save Parent Preferences
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* === PRINCIPAL / SUPER ADMIN / HR SETTINGS === */}
          {role !== 'student' && role !== 'teacher' && role !== 'parent' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard title="Institutional Policies & Governance" icon={<School size={18} />}>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="eyebrow">Active Academic Session</label>
                    <input
                      type="text"
                      value="2026–2027 (Term 1 Active)"
                      disabled
                      className="input mt-1.5 w-full bg-surface-muted"
                    />
                  </div>

                  <div>
                    <label className="eyebrow">Attendance Risk Threshold Percentage</label>
                    <select className="input mt-1.5 w-full" defaultValue="75">
                      <option value="75">75% (CBSE Mandatory Minimum)</option>
                      <option value="80">80% (Institutional High Standard)</option>
                    </select>
                  </div>

                  <div>
                    <label className="eyebrow">Statutory CPD Teacher Training Requirement</label>
                    <input
                      type="text"
                      value="50 Mandatory Hours / Academic Year"
                      disabled
                      className="input mt-1.5 w-full bg-surface-muted"
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Statutory Inspection & Audit Controls" icon={<ShieldAlert size={18} />}>
                <div className="flex flex-col gap-4">
                  <div className="rounded-lg border border-info/20 bg-info-soft p-4">
                    <div className="font-semibold text-meta text-info">CBSE Affiliation Inspection Lock</div>
                    <p className="mt-1 text-micro text-text-secondary">
                      When Board Inspection Mode is launched, all audit registers, fire NOCs and teacher service records are frozen into verifiable read-only format.
                    </p>
                  </div>

                  <div className="mt-auto pt-4 flex justify-end">
                    <button onClick={handleSavePreferences} className="btn-primary" disabled={saving}>
                      <Save size={16} /> Save Institutional Controls
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB 3: BROADCAST CHANNELS ----------------- */}
      {activeSubTab === 'notifications' && (
        <Card className="p-6">
          <h3 className="text-section font-bold text-foreground">Communication & Broadcast Channels</h3>
          <p className="mt-1 text-meta text-text-secondary">
            Select the pipelines through which EduOS dispatches academic notices, exam circulars and emergencies.
          </p>

          <div className="mt-6 flex flex-col gap-4 max-w-2xl">
            {[
              {
                id: 'inapp',
                label: 'In-App Notifications & Top Banner',
                desc: 'Real-time dashboard notifications and push alerts inside the browser.',
                val: notifInApp,
                set: setNotifInApp,
              },
              {
                id: 'whatsapp',
                label: 'Official WhatsApp Business Gateway',
                desc: 'Delivers digital gate passes, homework reminders and verified PDF scorecards.',
                val: notifWhatsApp,
                set: setNotifWhatsApp,
              },
              {
                id: 'sms',
                label: 'Statutory SMS Broadcast (Telecom DLT Approved)',
                desc: 'High-priority SMS dispatch for emergency notices and absence alerts.',
                val: notifSMS,
                set: setNotifSMS,
              },
              {
                id: 'email',
                label: 'Email Summaries & Official Circulars',
                desc: 'Detailed weekly performance narratives and fee invoice PDF receipts.',
                val: notifEmail,
                set: setNotifEmail,
              },
            ].map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 bg-surface hover:bg-surface-muted transition-colors"
              >
                <div>
                  <div className="font-semibold text-meta text-foreground">{channel.label}</div>
                  <div className="text-micro text-text-secondary">{channel.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={channel.val}
                  onChange={(e) => channel.set(e.target.checked)}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                />
              </div>
            ))}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  toast('Broadcast settings saved', 'success', 'Notification preferences updated.');
                }}
                className="btn-primary"
              >
                <Save size={16} /> Update Channels
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* ----------------- TAB 4: SECURITY & AUTH ----------------- */}
      {activeSubTab === 'security' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Password change */}
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <KeyRound size={20} className="text-primary" />
              <h3 className="text-section font-bold text-foreground">Change Password</h3>
            </div>
            <p className="mt-1 text-meta text-text-secondary">
              Update your password to keep your institutional account secure.
            </p>

            <form onSubmit={handleChangePassword} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="eyebrow">Current Password</label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input w-full pr-10"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="eyebrow">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input mt-1.5 w-full"
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              <div>
                <label className="eyebrow">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input mt-1.5 w-full"
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div className="mt-2 flex justify-end">
                <button type="submit" className="btn-primary" disabled={saving}>
                  <KeyRound size={16} /> {saving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </Card>

          {/* Active Sessions */}
          <Card className="p-6 flex flex-col">
            <div className="flex items-center gap-2">
              <Laptop size={20} className="text-success" />
              <h3 className="text-section font-bold text-foreground">Active Device Sessions</h3>
            </div>
            <p className="mt-1 text-meta text-text-secondary">
              Review browsers and mobile terminals authorized to access this account.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success-soft p-3.5">
                <div className="flex items-center gap-3">
                  <Laptop size={18} className="text-success" />
                  <div>
                    <div className="text-meta font-bold text-foreground">Current Web Browser</div>
                    <div className="text-micro text-text-secondary">Next.js SSR Client · Delhi, India · Active Now</div>
                  </div>
                </div>
                <Badge tone="success">Active</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3.5 bg-surface-muted">
                <div className="flex items-center gap-3">
                  <Smartphone size={18} className="text-text-tertiary" />
                  <div>
                    <div className="text-meta font-semibold text-foreground">EduOS Mobile Campus App</div>
                    <div className="text-micro text-text-secondary">iOS 17.5 · Signed in 2 days ago</div>
                  </div>
                </div>
                <Badge tone="neutral">Authorized</Badge>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button
                onClick={() => {
                  toast('Other sessions revoked', 'success', 'All other active browser sessions have been logged out.');
                }}
                className="btn-secondary w-full"
              >
                Sign Out From All Other Devices
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

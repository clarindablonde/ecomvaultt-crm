'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  UserPlus,
  Users,
  RefreshCw,
  Lock,
  Mail,
  Phone,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Key,
} from 'lucide-react';

export default function AdminPage() {
  const { isSuperAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('representative');
  const [tempPassword, setTempPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const supabase = createClient();

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pw = '';
    for (let i = 0; i < 10; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pw);
  };

  useEffect(() => {
    generateRandomPassword();
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setProfiles(data as Profile[]);
    } catch (err) {
      console.error('Error fetching staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const { data, error } = await supabase.rpc('create_staff_member', {
        staff_email: email.trim().toLowerCase(),
        staff_password: tempPassword.trim(),
        staff_full_name: fullName.trim(),
        staff_role: role,
        staff_phone: phone.trim() || null,
      });

      if (error) throw error;

      if (data && data.success === false) {
        throw new Error(data.error);
      }

      setStatusMsg({
        type: 'success',
        text: `Staff account for ${fullName} registered successfully! Temporary password: ${tempPassword}`,
      });

      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      generateRandomPassword();
      loadStaff();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Failed to register staff member.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page on" id="page-admin">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>System Control</b> · Administration & Staff Governance
          </div>
          <h1>Staff Provisioning & Permissions</h1>
          <p>Provision internal users, issue temporary passwords, and manage department permissions</p>
        </div>
      </div>

      <div className="grid g23">
        {/* Left: Provision New Staff Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--blue-dim)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--blue)',
              }}
            >
              <UserPlus size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', margin: 0 }}>Register Internal Staff Member</h3>
              <p style={{ color: 'var(--t3)', fontSize: '12px', margin: 0 }}>
                Staff login with work email and temporary key, then set their permanent password.
              </p>
            </div>
          </div>

          {statusMsg && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                border: statusMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(244, 63, 94, 0.35)',
                color: statusMsg.type === 'success' ? 'var(--green)' : 'var(--red)',
                fontSize: '12.5px',
                marginBottom: '18px',
                wordBreak: 'break-all',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="field">
              <label>Staff Full Name</label>
              <input
                className="inp"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Mary Adeleke"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="field">
                <label>Work Email Address</label>
                <input
                  className="inp"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@clarindablonde.com"
                />
              </div>
              <div className="field">
                <label>WhatsApp / Phone (Optional)</label>
                <input
                  className="inp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 803 000 0000"
                />
              </div>
            </div>

            <div className="field">
              <label>Department Role & Access Level</label>
              <select
                className="inp"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ height: '42px' }}
              >
                <option value="representative">Sales Representative (Omnichannel Chat & Order Entry)</option>
                <option value="logistics_officer">Logistics Officer (Rider Dispatch & COD Collection)</option>
                <option value="warehouse_manager">Warehouse Manager (Stock Ledger & Intake Inspection)</option>
                <option value="finance">Finance Officer (Bank Reconciliation & COD Remittance)</option>
                <option value="super_admin">Super Admin (Full Governance & Security Control)</option>
              </select>
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Assigned Temporary Password</label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  style={{ fontSize: '11.5px', color: 'var(--blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={11} />
                  <span>Regenerate Key</span>
                </button>
              </div>
              <input
                className="inp mono"
                required
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-pri"
              disabled={submitting}
              style={{ justifyContent: 'center', padding: '12px', marginTop: '6px' }}
            >
              {submitting ? 'Creating User in Supabase…' : '＋ Provision Staff Member →'}
            </button>
          </form>
        </div>

        {/* Right: Active Staff Directory */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} color="var(--blue)" />
              <h3 style={{ fontSize: '15px', margin: 0 }}>Active Personnel Directory</h3>
            </div>
            <span className="badge b-blue">{profiles.length} staff</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loading ? (
              <div style={{ color: 'var(--t3)', textAlign: 'center', padding: '32px' }}>Loading staff…</div>
            ) : profiles.length === 0 ? (
              <div style={{ color: 'var(--t3)', textAlign: 'center', padding: '32px' }}>
                No additional staff registered yet.
              </div>
            ) : (
              profiles.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className={`av ${p.avatar_color || 'a1'}`} style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                    {p.avatar_code || p.full_name?.substring(0, 2).toUpperCase() || 'ST'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: '13px', color: 'var(--t1)' }}>{p.full_name}</b>
                    <div style={{ fontSize: '11.5px', color: 'var(--t3)', textTransform: 'capitalize', marginTop: '2px' }}>
                      {p.role?.replace(/_/g, ' ')} {p.phone_number ? `· ${p.phone_number}` : ''}
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      p.role === 'super_admin'
                        ? 'b-purple'
                        : p.role === 'representative'
                        ? 'b-green'
                        : p.role === 'logistics_officer'
                        ? 'b-gold'
                        : 'b-blue'
                    }`}
                    style={{ fontSize: '11px' }}
                  >
                    {p.role?.replace(/_/g, ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setStatusMsg({ type: 'success', text: 'Password successfully updated!' });
      setTimeout(() => {
        onClose();
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 10, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--card2)',
          border: '1px solid var(--border2)',
          borderRadius: 'var(--r-lg)',
          padding: '28px',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>🔑 Change Password</h2>
            <p style={{ color: 'var(--t3)', fontSize: '12px', marginTop: '2px' }}>
              Update your temporary password to a secure personal password
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--t2)',
            }}
          >
            ✕
          </button>
        </div>

        {statusMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: statusMsg.type === 'success' ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
              border: statusMsg.type === 'success' ? '1px solid rgba(34,197,94,.3)' : '1px solid rgba(239,68,68,.3)',
              color: statusMsg.type === 'success' ? 'var(--green)' : 'var(--red)',
              fontSize: '12.5px',
              marginBottom: '14px',
            }}
          >
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="field">
            <label>New Password</label>
            <input
              className="inp"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="field">
            <label>Confirm New Password</label>
            <input
              className="inp"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-pri"
              disabled={loading}
              style={{ flex: 2, justifyContent: 'center' }}
            >
              {loading ? 'Saving...' : 'Update Password →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

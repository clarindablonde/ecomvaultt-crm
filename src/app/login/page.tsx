'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    const targetEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (error) throw error;

      setStatusMsg({
        type: 'success',
        text: 'Authentication successful. Redirecting to workspace…',
      });

      // Small tick for smooth UX before redirect
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 500);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Authentication failed. Please verify your email and password.',
      });
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'grid',
        placeItems: 'center',
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.15), transparent), radial-gradient(ellipse 60% 40% at 50% 120%, rgba(139, 92, 246, 0.12), transparent), #07090D',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle grid background texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(19, 24, 33, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              borderRadius: '14px',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
            }}
          >
            <Sparkles size={24} color="#FFFFFF" />
          </div>

          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#F8FAFC',
              marginBottom: '6px',
            }}
          >
            EcomVaultt
          </h1>

          <p
            style={{
              fontSize: '12.5px',
              color: 'var(--t3)',
              lineHeight: 1.5,
            }}
          >
            Clarinda Blonde Commerce OS · Internal Staff Portal
          </p>
        </div>

        {/* Dynamic Status Notification */}
        {statusMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
              border: statusMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
              color: statusMsg.type === 'success' ? 'var(--green)' : 'var(--red)',
              fontSize: '12.5px',
              lineHeight: 1.45,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <span style={{ fontSize: '14px', flexShrink: 0 }}>
              {statusMsg.type === 'success' ? '✓' : '⚠️'}
            </span>
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Unified Login Form (No Tabs) */}
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={13} color="var(--t3)" />
              <span>Work Email Address</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="inp"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@clarindablonde.com"
                style={{ height: '42px', fontSize: '13.5px' }}
              />
            </div>
          </div>

          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={13} color="var(--t3)" />
                <span>Password</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  fontSize: '11.5px',
                  color: 'var(--blue)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="inp"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password or temporary key"
                style={{ height: '42px', fontSize: '13.5px', paddingRight: '40px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-pri"
            disabled={loading}
            style={{
              width: '100%',
              height: '44px',
              marginTop: '6px',
              fontSize: '13.5px',
              fontWeight: 600,
              gap: '8px',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying credentials…</span>
              </>
            ) : (
              <>
                <span>Sign In to EcomVaultt</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Security Policy Badge */}
        <div
          style={{
            marginTop: '24px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <ShieldCheck size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '11.5px', color: 'var(--t3)', lineHeight: 1.45, margin: 0 }}>
            <b style={{ color: 'var(--t2)' }}>Single Enterprise Sign-In:</b> All roles (Super Admin, Inventory Managers, Sales Representatives, and Dispatchers) sign in here. Role permissions are loaded automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

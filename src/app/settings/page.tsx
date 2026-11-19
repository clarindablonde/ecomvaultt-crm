'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  MessageSquare,
  ShieldCheck,
  Key,
  Globe2,
  Save,
  CheckCircle2,
  Moon,
  Sun,
  Palette,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsPage() {
  const [savedMsg, setSavedMsg] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <section className="page on" id="page-settings">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>SYSTEM</b> · Configuration
          </div>
          <h1>Platform Settings & Integrations</h1>
          <p>
            Appearance themes, organization profile, omnichannel WhatsApp credentials, multi-hub operational parameters, and security policies.
          </p>
        </div>
      </div>

      {savedMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: 'var(--green)',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>Configuration saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Appearance & Dark Mode Selection */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Palette size={18} color="var(--purple)" />
            <div>
              <h3 style={{ fontSize: '15px', margin: 0 }}>System Appearance & Theme</h3>
              <p style={{ color: 'var(--t3)', fontSize: '12px', margin: '2px 0 0' }}>
                Toggle between the original executive dark mode and the modern light mode.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div
              onClick={() => setTheme('dark')}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: `2px solid ${theme === 'dark' ? 'var(--blue)' : 'var(--border)'}`,
                background: theme === 'dark' ? 'var(--blue-dim)' : 'var(--card)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.18s ease',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#07090E',
                  color: '#60A5FA',
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <Moon size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: '13px', display: 'block', color: 'var(--t1)' }}>Dark Mode (Original Design)</b>
                <span style={{ fontSize: '11.5px', color: 'var(--t3)' }}>Deep black OLED surfaces & crisp contrast</span>
              </div>
              {theme === 'dark' && <CheckCircle2 size={16} color="var(--blue)" />}
            </div>

            <div
              onClick={() => setTheme('light')}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: `2px solid ${theme === 'light' ? 'var(--blue)' : 'var(--border)'}`,
                background: theme === 'light' ? 'var(--blue-dim)' : 'var(--card)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.18s ease',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  color: '#2563EB',
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid #E2E8F0',
                }}
              >
                <Sun size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: '13px', display: 'block', color: 'var(--t1)' }}>Light Mode (Executive Clean)</b>
                <span style={{ fontSize: '11.5px', color: 'var(--t3)' }}>Bright corporate enterprise layout</span>
              </div>
              {theme === 'light' && <CheckCircle2 size={16} color="var(--blue)" />}
            </div>
          </div>
        </div>

        {/* Organization Info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Building2 size={18} color="var(--blue)" />
            <h3 style={{ fontSize: '15px', margin: 0 }}>Organization Profile</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div className="field">
              <label>Business / Company Name</label>
              <input className="inp" defaultValue="Clarinda Blonde Skincare Empire" />
            </div>
            <div className="field">
              <label>Primary Currency</label>
              <input className="inp" defaultValue="NGN — Nigerian Naira (₦)" disabled />
            </div>
            <div className="field">
              <label>Cross-Border Secondary Currency</label>
              <input className="inp" defaultValue="GHS — Ghanaian Cedi (GH₵)" disabled />
            </div>
            <div className="field">
              <label>Support Contact Email</label>
              <input className="inp" defaultValue="support@clarindablonde.com" />
            </div>
          </div>
        </div>

        {/* WhatsApp & Omnichannel Webhook */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <MessageSquare size={18} color="var(--green)" />
            <div>
              <h3 style={{ fontSize: '15px', margin: 0 }}>WhatsApp Business Cloud API Webhook</h3>
              <p style={{ color: 'var(--t3)', fontSize: '12px', margin: '2px 0 0' }}>
                Webhook endpoint to receive real-time inbound customer messages from WhatsApp.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="field">
              <label>Production Webhook Callback URL</label>
              <input
                className="inp mono"
                defaultValue="https://crm.clarindablonde.com/api/webhooks/whatsapp"
                readOnly
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="field">
                <label>Webhook Verify Token</label>
                <input
                  className="inp mono"
                  defaultValue="ecomvaultt_cb_secret_token_live"
                />
              </div>
              <div className="field">
                <label>Default Business Phone Number ID</label>
                <input
                  className="inp mono"
                  defaultValue="+234 800 000 0000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security & Authentication */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ShieldCheck size={18} color="var(--purple)" />
            <h3 style={{ fontSize: '15px', margin: 0 }}>Security Policies & Governance</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <b style={{ color: 'var(--t1)' }}>Internal Account Provisioning Model</b>
                <p style={{ color: 'var(--t3)', fontSize: '11.5px', margin: '2px 0 0' }}>
                  Public sign-ups disabled. Only Super Admins can register new staff accounts.
                </p>
              </div>
              <span className="badge b-green">Enforced</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <div>
                <b style={{ color: 'var(--t1)' }}>Supabase Row Level Security (RLS)</b>
                <p style={{ color: 'var(--t3)', fontSize: '11.5px', margin: '2px 0 0' }}>
                  Database tables are protected by PostgreSQL RLS with security definer functions.
                </p>
              </div>
              <span className="badge b-green">Active</span>
            </div>
          </div>
        </div>

        <div>
          <button type="submit" className="btn btn-pri" style={{ gap: '8px', padding: '12px 24px' }}>
            <Save size={15} />
            <span>Save Configuration Changes</span>
          </button>
        </div>
      </form>
    </section>
  );
}

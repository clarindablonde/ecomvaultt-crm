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
} from 'lucide-react';

export default function SettingsPage() {
  const [savedMsg, setSavedMsg] = useState(false);

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
            <b>System Management</b> · Configuration
          </div>
          <h1>Platform Settings & Integrations</h1>
          <p>
            Organization profile, omnichannel WhatsApp credentials, multi-hub operational parameters, and security settings.
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
                <b style={{ color: '#FFFFFF' }}>Internal Account Provisioning Model</b>
                <p style={{ color: 'var(--t3)', fontSize: '11.5px', margin: '2px 0 0' }}>
                  Public sign-ups disabled. Only Super Admins can register new staff accounts.
                </p>
              </div>
              <span className="badge b-green">Enforced</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <div>
                <b style={{ color: '#FFFFFF' }}>Supabase Row Level Security (RLS)</b>
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

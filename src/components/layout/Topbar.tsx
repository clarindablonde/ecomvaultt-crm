'use client';

import React, { useState } from 'react';
import { Search, Bell, RefreshCw, Menu, CheckCheck, Clock } from 'lucide-react';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const [showNotif, setShowNotif] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  return (
    <header className="topbar">
      <button className="hamb" onClick={onToggleSidebar} aria-label="Toggle Navigation">
        <Menu size={18} />
      </button>

      {/* Global Search Bar */}
      <div className="gsearch">
        <Search size={15} className="search-icon" />
        <input placeholder="Search orders, phone numbers, customers, inventory…" />
        <kbd>⌘K</kbd>
      </div>

      {/* Top Actions */}
      <div className="top-actions">
        {/* Live Rep Presence Beacon */}
        <div className="online-chip">
          <span className="pulse" />
          <span className="txt">4 of 5 sales reps online</span>
        </div>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setShowNotif(!showNotif)}
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && <span className="dot" />}
          </button>

          {showNotif && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: 0,
                width: '320px',
                background: 'var(--card-elevated)',
                border: '1px solid var(--border2)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)',
                padding: '16px',
                zIndex: 80,
                animation: 'fadeIn 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <b style={{ fontSize: '13.5px' }}>System Notifications</b>
                <span className="badge b-blue">{unreadCount} unread</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <b style={{ color: 'var(--t1)' }}>New Stock Intake Pending</b>
                  <p style={{ color: 'var(--t2)', fontSize: '11.5px', marginTop: '2px' }}>
                    Duchess White · +200 units arrived at Abuja Hub
                  </p>
                  <span style={{ fontSize: '10.5px', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Clock size={10} /> 5m ago
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <b style={{ color: 'var(--t1)' }}>High-Value Order Delivered</b>
                  <p style={{ color: 'var(--t2)', fontSize: '11.5px', marginTop: '2px' }}>
                    ₦106,200 collected via COD in Lekki Phase 1
                  </p>
                  <span style={{ fontSize: '10.5px', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Clock size={10} /> 28m ago
                  </span>
                </div>
              </div>

              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'center', marginTop: '12px', gap: '6px' }}
                onClick={() => {
                  setUnreadCount(0);
                  setShowNotif(false);
                }}
              >
                <CheckCheck size={14} />
                <span>Mark all as read</span>
              </button>
            </div>
          )}
        </div>

        {/* Sync Status Button */}
        <button className="icon-btn" title="Supabase Realtime Sync Active">
          <RefreshCw size={15} />
        </button>
      </div>
    </header>
  );
}

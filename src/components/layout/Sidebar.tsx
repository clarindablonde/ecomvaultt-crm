'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { ChangePasswordModal } from '@/components/shared/ChangePasswordModal';
import {
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Users,
  Tag,
  Package,
  Warehouse,
  Truck,
  CreditCard,
  Shield,
  Settings,
  Key,
  LogOut,
  Hexagon,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  pill?: string;
  pillColor?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);

  const supabase = createClient();

  const loadLiveBadges = async () => {
    try {
      const [convRes, ordRes] = await Promise.all([
        supabase.from('conversations').select('unread_count'),
        supabase.from('orders').select('id').eq('status', 'awaiting_dispatch'),
      ]);

      if (convRes.data) {
        const totalUnread = convRes.data.reduce((sum, c) => sum + (Number(c.unread_count) || 0), 0);
        setUnreadCount(totalUnread);
      }
      if (ordRes.data) {
        setPendingOrdersCount(ordRes.data.length);
      }
    } catch (err) {
      console.error('Error fetching live sidebar badge counts:', err);
    }
  };

  useEffect(() => {
    loadLiveBadges();

    // Listen to real-time conversation and order changes
    const channel = supabase
      .channel('realtime:sidebar_live_badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadLiveBadges();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadLiveBadges();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const navSections: NavSection[] = [
    {
      label: 'Workspace',
      items: [
        { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        {
          id: 'inbox',
          href: '/inbox',
          label: 'Live Inbox',
          icon: <MessageSquare size={16} />,
          pill: unreadCount > 0 ? String(unreadCount) : undefined,
        },
        { id: 'ai', href: '/ai', label: 'AI Sales Coach', icon: <Sparkles size={16} /> },
      ],
    },
    {
      label: 'Commerce',
      items: [
        {
          id: 'orders',
          href: '/orders',
          label: 'Orders & Pipeline',
          icon: <ShoppingBag size={16} />,
          pill: pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined,
          pillColor: 'red',
        },
        { id: 'customers', href: '/customers', label: 'Customer 360', icon: <Users size={16} /> },
        { id: 'products', href: '/products', label: 'Products & SKUs', icon: <Tag size={16} /> },
      ],
    },
    {
      label: 'Operations & Logistics',
      items: [
        { id: 'inventory', href: '/inventory', label: 'Inventory Ledger', icon: <Package size={16} /> },
        { id: 'warehouses', href: '/warehouses', label: 'Regional Hubs', icon: <Warehouse size={16} /> },
        { id: 'dispatch', href: '/dispatch', label: 'Rider Dispatch', icon: <Truck size={16} /> },
      ],
    },
    {
      label: 'Financial Governance',
      items: [
        { id: 'payments', href: '/payments', label: 'COD Remittances', icon: <CreditCard size={16} /> },
      ],
    },
    {
      label: 'Administration',
      items: [
        { id: 'admin', href: '/admin', label: 'Staff Governance', icon: <Shield size={16} /> },
        { id: 'settings', href: '/settings', label: 'System Settings', icon: <Settings size={16} /> },
      ],
    },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
      {/* Brand Header */}
      <div className="logo">
        <div className="mark">
          <Hexagon size={18} />
        </div>
        <div>
          <span>EcomVaultt</span>
          <small>Clarinda OS</small>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="nav" id="nav">
        {navSections.map((sec) => (
          <React.Fragment key={sec.label}>
            <div className="nav-label">{sec.label}</div>
            {sec.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={isActive ? 'active' : ''}
                >
                  <span className="ic">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.pill && (
                    <span className={`pill ${item.pillColor === 'red' ? 'red' : ''}`}>
                      {item.pill}
                    </span>
                  )}
                </Link>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

      {/* User Status Bar */}
      <div className="side-user">
        <div className={`av ${profile?.avatar_color || 'a1'}`}>
          {profile?.avatar_code || profile?.full_name?.substring(0, 2).toUpperCase() || 'CB'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: '13px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.full_name || 'Clarinda O.'}
          </b>
          <span className="st" style={{ textTransform: 'capitalize' }}>
            <span className="dot" />
            <span>{profile?.role ? profile.role.replace(/_/g, ' ') : 'Administrator'}</span>
          </span>
        </div>

        <button
          className="icon-btn"
          style={{ width: '32px', height: '32px' }}
          title="Change Password"
          onClick={() => setIsPasswordModalOpen(true)}
        >
          <Key size={14} />
        </button>

        <button
          className="icon-btn"
          style={{ width: '32px', height: '32px' }}
          title="Sign Out"
          onClick={() => signOut()}
        >
          <LogOut size={14} />
        </button>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </aside>
  );
}

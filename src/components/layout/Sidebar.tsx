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
  Receipt,
  Target,
  BarChart3,
  Megaphone,
  MessagesSquare,
  BookOpen,
  Briefcase,
  Shield,
  Settings,
  Key,
  LogOut,
  Hexagon,
  X,
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
        supabase.from('orders').select('id, status'),
      ]);

      if (convRes.data) {
        const totalUnread = convRes.data.reduce((sum, c) => sum + (Number(c.unread_count) || 0), 0);
        setUnreadCount(totalUnread);
      } else {
        setUnreadCount(0);
      }

      if (ordRes.data) {
        const pending = ordRes.data.filter(
          (o) => o.status === 'awaiting_dispatch' || o.status === 'pending'
        );
        setPendingOrdersCount(pending.length);
      } else {
        setPendingOrdersCount(0);
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
      label: 'WORKSPACE',
      items: [
        { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        {
          id: 'inbox',
          href: '/inbox',
          label: 'Inbox',
          icon: <MessageSquare size={16} />,
          pill: unreadCount > 0 ? String(unreadCount) : undefined,
          pillColor: 'green',
        },
        { id: 'ai', href: '/ai', label: 'AI Assistant', icon: <Sparkles size={16} /> },
      ],
    },
    {
      label: 'COMMERCE',
      items: [
        {
          id: 'orders',
          href: '/orders',
          label: 'Orders',
          icon: <ShoppingBag size={16} />,
          pill: pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined,
          pillColor: 'red',
        },
        { id: 'customers', href: '/customers', label: 'Customers', icon: <Users size={16} /> },
        { id: 'products', href: '/products', label: 'Products', icon: <Tag size={16} /> },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        { id: 'inventory', href: '/inventory', label: 'Inventory', icon: <Package size={16} /> },
        { id: 'warehouses', href: '/warehouses', label: 'Warehouses', icon: <Warehouse size={16} /> },
        { id: 'dispatch', href: '/dispatch', label: 'Dispatch', icon: <Truck size={16} /> },
      ],
    },
    {
      label: 'FINANCE',
      items: [
        { id: 'payments', href: '/payments', label: 'Payments', icon: <CreditCard size={16} /> },
        { id: 'expenses', href: '/expenses', label: 'Expenses', icon: <Receipt size={16} /> },
      ],
    },
    {
      label: 'INTELLIGENCE',
      items: [
        { id: 'crm', href: '/crm', label: 'CRM', icon: <Target size={16} /> },
        { id: 'analytics', href: '/analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
        { id: 'marketing', href: '/marketing', label: 'Marketing', icon: <Megaphone size={16} /> },
      ],
    },
    {
      label: 'TEAM',
      items: [
        { id: 'discussion', href: '/discussion', label: 'Discussion', icon: <MessagesSquare size={16} /> },
        { id: 'knowledge-base', href: '/knowledge-base', label: 'Knowledge Base', icon: <BookOpen size={16} /> },
        { id: 'hr', href: '/hr', label: 'HR', icon: <Briefcase size={16} /> },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { id: 'admin', href: '/admin', label: 'Administration', icon: <Shield size={16} /> },
        { id: 'settings', href: '/settings', label: 'Settings', icon: <Settings size={16} /> },
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <span>EcomVaultt</span>
          <small>Clarinda OS</small>
        </div>
        {onClose && (
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        )}
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
                    <span className={`pill ${item.pillColor || ''}`}>
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

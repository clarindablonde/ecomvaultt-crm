'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Customer, Order } from '@/types/database';
import {
  Target,
  Users,
  Search,
  Filter,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  PhoneCall,
  DollarSign,
  ChevronRight,
} from 'lucide-react';

interface CRMStage {
  id: string;
  name: string;
  count: number;
  totalValue: number;
  color: string;
}

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  const loadData = async () => {
    try {
      const [custRes, ordRes] = await Promise.all([
        supabase.from('customers').select('*').order('lifetime_spend', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
      ]);

      if (custRes.data) setCustomers(custRes.data as Customer[]);
      if (ordRes.data) setOrders(ordRes.data as Order[]);
    } catch (err) {
      console.error('Error fetching CRM data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('realtime:crm_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Compute CRM stages dynamically from Supabase database
  const vipCustomers = customers.filter(
    (c) => (c.tags && c.tags.includes('vip')) || Number(c.lifetime_spend || 0) >= 300000 || (c.lifetime_orders || 0) >= 5
  );
  const buyers = customers.filter(
    (c) => (c.lifetime_orders || 0) > 0 && !vipCustomers.some((v) => v.id === c.id)
  );
  const abandoned = orders.filter((o) => o.status === 'failed_unreachable' || o.status === 'failed_cancelled');
  const engaged = customers.filter(
    (c) => (c.tags && (c.tags.includes('ready_to_buy') || c.tags.includes('follow_up'))) || (c.lifetime_orders || 0) === 0
  );

  const stages: CRMStage[] = [
    {
      id: 'all',
      name: 'Total Audience',
      count: customers.length,
      totalValue: customers.reduce((sum, c) => sum + Number(c.lifetime_spend || 0), 0),
      color: 'var(--blue)',
    },
    {
      id: 'engaged',
      name: 'Inquiries & Leads',
      count: engaged.length,
      totalValue: engaged.length * 45000,
      color: 'var(--purple)',
    },
    {
      id: 'abandoned',
      name: 'Failed / Cancelled',
      count: abandoned.length,
      totalValue: abandoned.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      color: 'var(--gold)',
    },
    {
      id: 'buyers',
      name: 'Active Buyers',
      count: buyers.length,
      totalValue: buyers.reduce((sum, c) => sum + Number(c.lifetime_spend || 0), 0),
      color: 'var(--green)',
    },
    {
      id: 'vip',
      name: 'VIP High Lifetime Value',
      count: vipCustomers.length,
      totalValue: vipCustomers.reduce((sum, c) => sum + Number(c.lifetime_spend || 0), 0),
      color: 'var(--blue)',
    },
  ];

  const filteredCustomers = customers.filter((c) => {
    const isVip = vipCustomers.some((v) => v.id === c.id);
    const isBuyer = buyers.some((b) => b.id === c.id);
    const isEngaged = engaged.some((e) => e.id === c.id);

    const matchesStage =
      selectedStage === 'all'
        ? true
        : selectedStage === 'vip'
        ? isVip
        : selectedStage === 'buyers'
        ? isBuyer
        : selectedStage === 'engaged'
        ? isEngaged
        : true;

    const matchesSearch =
      searchQuery === '' ||
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone_number.includes(searchQuery) ||
      (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.instagram_handle && c.instagram_handle.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStage && matchesSearch;
  });

  return (
    <section className="page on" id="page-crm">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>INTELLIGENCE</b> · Pipeline & Leads
          </div>
          <h1>Omnichannel CRM & Customer Lifecycle</h1>
          <p>Live database synchronisation of customer relationships, order history, lifetime value, and WhatsApp contact stages.</p>
        </div>
        <Link href="/inbox" className="btn btn-pri">
          <MessageSquare size={15} />
          <span>Open Live Inbox</span>
        </Link>
      </div>

      {/* Stage Flow Pipeline */}
      <div className="grid g5" style={{ marginBottom: '24px' }}>
        {stages.map((s) => (
          <div
            key={s.id}
            className={`card kpi lift ${selectedStage === s.id ? 'active' : ''}`}
            onClick={() => setSelectedStage(s.id)}
            style={{
              cursor: 'pointer',
              borderTop: `3px solid ${s.color}`,
              background: selectedStage === s.id ? 'var(--blue-dim)' : 'var(--card)',
            }}
          >
            <div className="lbl">
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.name}</span>
            </div>
            <div className="val" style={{ fontSize: '20px', margin: '4px 0' }}>
              {s.count} <span style={{ fontSize: '12px', color: 'var(--t3)', fontWeight: 400 }}>contacts</span>
            </div>
            <span className="chg up" style={{ fontSize: '11px' }}>
              ₦{s.totalValue.toLocaleString()} pipeline
            </span>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          background: 'var(--card)',
          padding: '12px 16px',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={13} /> Showing:
          </span>
          <button
            className={`btn btn-sm ${selectedStage === 'all' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setSelectedStage('all')}
          >
            All Database Contacts ({customers.length})
          </button>
          <button
            className={`btn btn-sm ${selectedStage === 'vip' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setSelectedStage('vip')}
          >
            VIP High Spend ({vipCustomers.length})
          </button>
          <button
            className={`btn btn-sm ${selectedStage === 'buyers' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setSelectedStage('buyers')}
          >
            Confirmed Buyers ({buyers.length})
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input
            className="inp"
            placeholder="Search contact, phone number…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px', borderRadius: '8px', width: '100%' }}
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Contact Name</th>
              <th>Phone Number & Channel</th>
              <th>Location</th>
              <th>Health Score</th>
              <th>Lifetime Orders</th>
              <th>Total Realized Spend</th>
              <th>Status / Tags</th>
              <th>Quick Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  Loading database records…
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  No customer records found matching filter.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((c) => {
                const isVip = vipCustomers.some((v) => v.id === c.id);
                return (
                  <tr key={c.id}>
                    <td>
                      <b style={{ color: 'var(--t1)' }}>{c.full_name}</b>
                      {c.instagram_handle && (
                        <span style={{ fontSize: '11px', color: 'var(--t3)', display: 'block' }}>
                          {c.instagram_handle}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '12px', color: 'var(--blue)' }}>
                        {c.phone_number}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--t3)', display: 'block', textTransform: 'capitalize' }}>
                        Source: {c.source_channel || 'WhatsApp'}
                      </span>
                    </td>
                    <td>
                      <b style={{ fontSize: '12.5px', color: 'var(--t1)' }}>{c.city || 'Lagos'}</b>
                      <span style={{ fontSize: '11px', color: 'var(--t3)', display: 'block' }}>
                        {c.state || 'Lagos State'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          (c.health_score || 0) >= 80 ? 'b-green' : (c.health_score || 0) >= 60 ? 'b-gold' : 'b-red'
                        }`}
                      >
                        {c.health_score || 75}% Health
                      </span>
                    </td>
                    <td className="mono">
                      <b>{c.lifetime_orders || 0} orders</b>
                    </td>
                    <td className="mono">
                      <b style={{ color: 'var(--green)', fontSize: '13px' }}>
                        ₦{Number(c.lifetime_spend || 0).toLocaleString()}
                      </b>
                    </td>
                    <td>
                      {isVip ? (
                        <span className="badge b-purple">VIP Buyer</span>
                      ) : (c.lifetime_orders || 0) > 0 ? (
                        <span className="badge b-green">Active Customer</span>
                      ) : (
                        <span className="badge b-blue">New Prospect</span>
                      )}
                    </td>
                    <td>
                      <Link href="/inbox" className="btn btn-sm btn-sec" style={{ gap: '4px' }}>
                        <MessageSquare size={12} color="var(--green)" />
                        <span>Chat</span>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

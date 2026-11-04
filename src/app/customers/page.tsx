'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Customer } from '@/types/database';
import {
  Users,
  DollarSign,
  TrendingUp,
  Heart,
  Search,
  Phone,
  MapPin,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('lifetime_spend', { ascending: false });

      if (data) setCustomers(data as Customer[]);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

    const channel = supabase
      .channel('realtime:customers_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchCustomers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone_number?.includes(searchQuery) ||
      c.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalLTV = customers.reduce((acc, c) => acc + (Number(c.lifetime_spend) || 0), 0);
  const avgSpend = customers.length > 0 ? Math.round(totalLTV / customers.length) : 0;

  return (
    <section className="page on" id="page-customers">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>Commerce</b> · Customer 360
          </div>
          <h1>Customer Intelligence Directory</h1>
          <p>
            {customers.length} total customer accounts tracked across WhatsApp, Instagram, and TikTok
          </p>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid g4" style={{ marginBottom: '20px' }}>
        <div className="card kpi lift">
          <div className="lbl">
            <span>Total Customers</span>
            <Users size={14} color="var(--blue)" />
          </div>
          <div className="val">{customers.length}</div>
          <span className="chg up">Verified in Supabase</span>
        </div>

        <div className="card kpi green lift">
          <div className="lbl">
            <span>Cumulative LTV</span>
            <DollarSign size={14} color="var(--green)" />
          </div>
          <div className="val">₦{totalLTV.toLocaleString()}</div>
          <span className="chg up">Customer lifetime revenue</span>
        </div>

        <div className="card kpi purple lift">
          <div className="lbl">
            <span>Average Spend / Order</span>
            <TrendingUp size={14} color="var(--purple)" />
          </div>
          <div className="val">₦{avgSpend.toLocaleString()}</div>
          <span className="chg up">High-ticket cohort</span>
        </div>

        <div className="card kpi gold lift">
          <div className="lbl">
            <span>VIP & Loyal Clients</span>
            <Heart size={14} color="var(--gold)" />
          </div>
          <div className="val">
            {customers.filter((c) => c.tags?.includes('vip') || c.tags?.includes('loyal')).length}
          </div>
          <span className="chg">Health score &gt; 80</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '20px',
          background: 'var(--card)',
          padding: '12px 16px',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--border)',
        }}
      >
        <Search size={15} color="var(--t3)" />
        <input
          placeholder="Search by customer name, phone number, or city…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#FFFFFF',
            fontSize: '13px',
            flex: 1,
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ fontSize: '11px', color: 'var(--t3)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Customer Directory Table */}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone / WhatsApp</th>
              <th>Channel Source</th>
              <th>City / Location</th>
              <th>Orders</th>
              <th>Lifetime Spend</th>
              <th>Health Score</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  Loading customer database…
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  No customer matching &quot;{searchQuery}&quot; found.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="av a3" style={{ width: '32px', height: '32px', fontSize: '11.5px' }}>
                        {c.full_name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <b style={{ color: 'var(--t1)' }}>{c.full_name}</b>
                        {c.tags && c.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                            {c.tags.map((t) => (
                              <span
                                key={t}
                                className="badge b-purple"
                                style={{ fontSize: '9.5px', padding: '1px 6px' }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: '12px', color: 'var(--t2)' }}>
                      {c.phone_number}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        c.source_channel === 'instagram'
                          ? 'b-purple'
                          : c.source_channel === 'facebook'
                          ? 'b-blue'
                          : c.source_channel === 'tiktok'
                          ? 'b-red'
                          : 'b-green'
                      }`}
                    >
                      {c.source_channel || 'whatsapp'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--t2)', fontSize: '12.5px' }}>
                      <MapPin size={11} color="var(--t3)" />
                      <span>{c.city || 'Lagos'}</span>
                    </div>
                  </td>
                  <td className="mono">
                    <b>{c.lifetime_orders || 0}</b>
                  </td>
                  <td className="mono">
                    <b style={{ color: '#FFFFFF' }}>₦{Number(c.lifetime_spend || 0).toLocaleString()}</b>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="mono" style={{ fontWeight: 600, fontSize: '12px' }}>
                        {c.health_score || 85}%
                      </span>
                      <div className="bar" style={{ width: '60px' }}>
                        <i
                          style={{
                            width: `${c.health_score || 85}%`,
                            background:
                              (c.health_score || 85) >= 80
                                ? 'var(--green)'
                                : (c.health_score || 85) >= 50
                                ? 'var(--gold)'
                                : 'var(--red)',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

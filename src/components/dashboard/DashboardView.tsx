'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order, Customer, Warehouse } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  DollarSign,
  PackageCheck,
  Clock,
  Users,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Sparkles,
  Plus,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

interface DailyRevenue {
  day: string;
  total: number;
  count: number;
  heightPct: number;
}

interface WarehouseStat {
  id: string;
  name: string;
  ordersCount: number;
  deliveredCount: number;
  rate: number;
}

export function DashboardView() {
  const { profile, isSuperAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [conversationsCount, setConversationsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'revenue' | 'orders'>('revenue');

  const supabase = createClient();

  const loadData = async () => {
    try {
      const [ordersRes, custRes, whRes, convRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, customer:customers(*), warehouse:warehouses(*)')
          .order('created_at', { ascending: false }),
        supabase.from('customers').select('*'),
        supabase.from('warehouses').select('*'),
        supabase.from('conversations').select('id', { count: 'exact' }),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (custRes.data) setCustomers(custRes.data as Customer[]);
      if (whRes.data) setWarehouses(whRes.data as Warehouse[]);
      if (convRes.count !== null) setConversationsCount(convRes.count);
    } catch (err) {
      console.error('Error fetching Supabase dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to live order & customer updates
    const channel = supabase
      .channel('realtime:dashboard_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- 1. Compute Pipeline & Financial Metrics Directly from Database ---
  const totalSales = orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

  // Pipeline counts
  const awaitingDispatch = orders.filter((o) => o.status === 'awaiting_dispatch');
  const outForDelivery = orders.filter((o) => o.status === 'out_for_delivery');
  const deliveredPaid = orders.filter((o) => o.status === 'delivered_paid');
  const transferredBank = orders.filter((o) => o.status === 'transferred_to_bank');
  const failedOrders = orders.filter(
    (o) => o.status === 'failed_unreachable' || o.status === 'failed_cancelled'
  );

  // Cash holding by dispatchers (orders that are delivered_paid but not yet transferred to bank)
  const cashHolding = orders
    .filter((o) => o.status === 'delivered_paid' || o.payment_status === 'holding_by_dispatcher')
    .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

  // Delivered rate percentage
  const totalCompleted = deliveredPaid.length + transferredBank.length;
  const fulfillmentRate = orders.length > 0 ? Math.round((totalCompleted / orders.length) * 100) : 0;

  // --- 2. Dynamic 7-Day Revenue Graph from Database created_at timestamps ---
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const dailyStats: DailyRevenue[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const dayOrders = orders.filter((o) => o.created_at && o.created_at.startsWith(dateStr));
    const dayTotal = dayOrders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

    dailyStats.push({
      day: i === 0 ? 'Today' : dayNames[d.getDay()],
      total: dayTotal,
      count: dayOrders.length,
      heightPct: 0,
    });
  }

  const maxDailyMetric = Math.max(
    ...dailyStats.map((d) => (chartMode === 'revenue' ? d.total : d.count)),
    chartMode === 'revenue' ? 100000 : 5
  );

  dailyStats.forEach((d) => {
    const val = chartMode === 'revenue' ? d.total : d.count;
    d.heightPct = Math.max(14, Math.round((val / maxDailyMetric) * 92));
  });

  // --- 3. Compute Real Warehouse Performance from Live Orders ---
  const warehouseStats: WarehouseStat[] = warehouses.map((w) => {
    const whOrders = orders.filter((o) => o.warehouse_id === w.id);
    const delivered = whOrders.filter(
      (o) => o.status === 'delivered_paid' || o.status === 'transferred_to_bank'
    ).length;
    const rate = whOrders.length > 0 ? Math.round((delivered / whOrders.length) * 100) : 100;
    return {
      id: w.id,
      name: w.name,
      ordersCount: whOrders.length,
      deliveredCount: delivered,
      rate,
    };
  });

  // Today formatted string
  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <section className="page on" id="page-dashboard">
      {/* Executive Command Header */}
      <div className="phead">
        <div>
          <div className="crumb">
            <b>Executive Command Center</b> · Enterprise Overview
          </div>
          <h1>Welcome back, {profile?.full_name?.split(' ')[0] || 'Clarinda'}</h1>
          <p>
            {todayFormatted} · Live database sync active · {warehouses.length} regional hubs operational
          </p>
        </div>
        <div className="sp">
          <Link href="/orders" className="btn btn-sec">
            <ShoppingBag size={14} />
            <span>View All Orders</span>
          </Link>
          <Link href="/orders" className="btn btn-pri">
            <Plus size={15} />
            <span>Create Order</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards: Primary Row */}
      <div className="grid g4">
        <div className="card kpi lift">
          <div className="lbl">
            <span>Total Pipeline Revenue</span>
            <span style={{ padding: '6px', borderRadius: '8px', background: 'var(--blue-dim)', color: 'var(--blue)' }}>
              <DollarSign size={14} />
            </span>
          </div>
          <div className="val">₦{totalSales.toLocaleString()}</div>
          <span className="chg up">
            <ArrowUpRight size={13} />
            <span>{orders.length} orders recorded storewide</span>
          </span>
        </div>

        <div className="card kpi green lift">
          <div className="lbl">
            <span>Orders Fulfilled</span>
            <span style={{ padding: '6px', borderRadius: '8px', background: 'var(--green-dim)', color: 'var(--green)' }}>
              <PackageCheck size={14} />
            </span>
          </div>
          <div className="val">{totalCompleted}</div>
          <span className="chg up">
            <span>{fulfillmentRate}% fulfillment rate ({awaitingDispatch.length + outForDelivery.length} active)</span>
          </span>
        </div>

        <div className="card kpi gold lift">
          <div className="lbl">
            <span>COD Cash Held by Riders</span>
            <span style={{ padding: '6px', borderRadius: '8px', background: 'var(--gold-dim)', color: 'var(--gold)' }}>
              <Clock size={14} />
            </span>
          </div>
          <div className="val">₦{cashHolding.toLocaleString()}</div>
          <span className="chg dn">
            <span>{deliveredPaid.length} orders pending bank remittance</span>
          </span>
        </div>

        <div className="card kpi purple lift">
          <div className="lbl">
            <span>Customer Base</span>
            <span style={{ padding: '6px', borderRadius: '8px', background: 'var(--purple-dim)', color: 'var(--purple)' }}>
              <Users size={14} />
            </span>
          </div>
          <div className="val">{customers.length}</div>
          <span className="chg up">
            <span>{customers.filter((c) => c.tags?.includes('vip')).length} VIP accounts recognized</span>
          </span>
        </div>
      </div>

      {/* Secondary Operational Metrics */}
      <div className="grid g4" style={{ marginTop: '16px' }}>
        <div className="card kpi lift">
          <div className="lbl">
            <span>Awaiting Rider Pickup</span>
            <Truck size={14} color="var(--t3)" />
          </div>
          <div className="val">{awaitingDispatch.length}</div>
          <span className="chg">Ready at warehouse hubs</span>
        </div>

        <div className="card kpi gold lift">
          <div className="lbl">
            <span>Out for Delivery</span>
            <Clock size={14} color="var(--gold)" />
          </div>
          <div className="val">{outForDelivery.length}</div>
          <span className="chg">In transit with dispatchers</span>
        </div>

        <div className="card kpi red lift">
          <div className="lbl">
            <span>Failed Deliveries</span>
            <AlertTriangle size={14} color="var(--red)" />
          </div>
          <div className="val">{failedOrders.length}</div>
          <span className="chg" style={{ color: 'var(--red)' }}>Customer unreachable / cancelled</span>
        </div>

        {/* Super-admin verified bank revenue */}
        {isSuperAdmin && (
          <div className="card kpi green lift">
            <div className="lbl">
              <span>Verified in Bank</span>
              <span className="badge b-purple" style={{ fontSize: '9px', padding: '1px 6px' }}>
                Super Admin
              </span>
            </div>
            <div className="val">
              ₦{orders
                .filter((o) => o.status === 'transferred_to_bank')
                .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0)
                .toLocaleString()}
            </div>
            <span className="chg up" style={{ color: 'var(--green)' }}>
              <ShieldCheck size={12} /> 100% reconciled in bank
            </span>
          </div>
        )}
      </div>

      {/* 7-Day Performance Chart & Pipeline Bar Distribution */}
      <div className="grid g23" style={{ marginTop: '16px' }}>
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <h3>Activity — Last 7 Days</h3>
              <span className="sub">
                {chartMode === 'revenue' ? 'Daily revenue booked in Naira' : 'Daily order volume count'}
              </span>
            </div>
            <div className="tabs">
              <button
                className={chartMode === 'revenue' ? 'on' : ''}
                onClick={() => setChartMode('revenue')}
              >
                Revenue
              </button>
              <button
                className={chartMode === 'orders' ? 'on' : ''}
                onClick={() => setChartMode('orders')}
              >
                Orders
              </button>
            </div>
          </div>

          <div className="chart">
            {dailyStats.map((stat, idx) => (
              <div key={idx} className="col">
                <div
                  className={`stick ${stat.total > 0 ? 'g' : ''}`}
                  style={{ height: `${stat.heightPct}%` }}
                  title={`${stat.day}: ₦${stat.total.toLocaleString()} (${stat.count} orders)`}
                />
                <span className="cl">{stat.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Order Pipeline Stream */}
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <h3>Order Status Distribution</h3>
            <span className="sub">Live database transitions</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--t2)' }}>Omnichannel Conversations</span>
                <b className="mono">{conversationsCount}</b>
              </div>
              <div className="bar">
                <i style={{ width: `${Math.min(100, conversationsCount * 25)}%`, background: 'var(--blue)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--t2)' }}>Awaiting Dispatch</span>
                <b className="mono">{awaitingDispatch.length}</b>
              </div>
              <div className="bar">
                <i
                  style={{
                    width: `${orders.length > 0 ? (awaitingDispatch.length / orders.length) * 100 : 0}%`,
                    background: 'var(--blue)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--t2)' }}>Out for Delivery (Riders)</span>
                <b className="mono">{outForDelivery.length}</b>
              </div>
              <div className="bar">
                <i
                  style={{
                    width: `${orders.length > 0 ? (outForDelivery.length / orders.length) * 100 : 0}%`,
                    background: 'var(--gold)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--t2)' }}>Delivered & Paid (COD)</span>
                <b className="mono">{deliveredPaid.length}</b>
              </div>
              <div className="bar">
                <i
                  style={{
                    width: `${orders.length > 0 ? (deliveredPaid.length / orders.length) * 100 : 0}%`,
                    background: 'var(--green)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--t2)' }}>Transferred to Bank Account</span>
                <b className="mono">{transferredBank.length}</b>
              </div>
              <div className="bar">
                <i
                  style={{
                    width: `${orders.length > 0 ? (transferredBank.length / orders.length) * 100 : 0}%`,
                    background: 'var(--purple)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Warehouse Hubs & System Insights */}
      <div className="grid g2" style={{ marginTop: '16px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3>Regional Hub Delivery Performance</h3>
              <span className="sub">Real-time fulfillment metrics per hub</span>
            </div>
            <Link href="/inventory" className="btn btn-ghost btn-sm">
              <span>Manage Hubs</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {warehouseStats.map((wh) => (
              <div key={wh.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                  <b style={{ color: 'var(--t1)' }}>{wh.name}</b>
                  <span className="mono" style={{ color: wh.rate >= 80 ? 'var(--green)' : 'var(--gold)' }}>
                    {wh.ordersCount > 0 ? `${wh.deliveredCount}/${wh.ordersCount} (${wh.rate}%)` : 'No active orders'}
                  </span>
                </div>
                <div className="bar">
                  <i
                    style={{
                      width: `${wh.rate}%`,
                      background: wh.rate >= 80 ? 'var(--green)' : 'var(--gold)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Automated System Insights */}
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <h3>System Intelligence & Actionable Insights</h3>
            <span className="sub">Automated audit from live operational data</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--green)', marginTop: '2px' }}>
                <Sparkles size={14} />
              </span>
              <div>
                <b style={{ color: 'var(--t1)' }}>Database Sync Active:</b>
                <p style={{ color: 'var(--t2)', marginTop: '2px' }}>
                  Supabase Realtime WebSockets are maintaining active connection with <b>{customers.length} customer profiles</b> and <b>{orders.length} orders</b>.
                </p>
              </div>
            </div>

            {cashHolding > 0 && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--gold)', marginTop: '2px' }}>
                  <Clock size={14} />
                </span>
                <div>
                  <b style={{ color: 'var(--gold)' }}>Pending COD Remittance:</b>
                  <p style={{ color: 'var(--t2)', marginTop: '2px' }}>
                    ₦{cashHolding.toLocaleString()} is currently held by delivery riders awaiting bank transfer confirmation.
                  </p>
                </div>
              </div>
            )}

            {awaitingDispatch.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--blue)', marginTop: '2px' }}>
                  <Truck size={14} />
                </span>
                <div>
                  <b style={{ color: 'var(--blue)' }}>Fulfillment Action Required:</b>
                  <p style={{ color: 'var(--t2)', marginTop: '2px' }}>
                    {awaitingDispatch.length} orders packaged in regional warehouses require dispatch rider assignment.
                  </p>
                </div>
              </div>
            )}

            {failedOrders.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--red)', marginTop: '2px' }}>
                  <AlertTriangle size={14} />
                </span>
                <div>
                  <b style={{ color: 'var(--red)' }}>Customer Retention Follow-up:</b>
                  <p style={{ color: 'var(--t2)', marginTop: '2px' }}>
                    {failedOrders.length} failed or cancelled orders flagged. Re-engagement WhatsApp sequences available.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Ledger Table */}
      <div className="tbl-wrap" style={{ marginTop: '20px' }}>
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <b style={{ fontSize: '14.5px', color: 'var(--t1)' }}>Recent Orders Ledger</b>
            <span style={{ fontSize: '12px', color: 'var(--t3)', marginLeft: '10px' }}>
              Real-time synchronization via Supabase WebSockets
            </span>
          </div>
          <Link href="/orders" className="btn btn-ghost btn-sm" style={{ gap: '6px' }}>
            <span>View All ({orders.length})</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        <table>
          <thead>
            <tr>
              <th>Order Code</th>
              <th>Customer</th>
              <th>Destination</th>
              <th>Amount</th>
              <th>Fulfillment Status</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  Loading live orders from Supabase…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  No orders recorded yet. Click "Create Order" to book your first order.
                </td>
              </tr>
            ) : (
              orders.slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td className="mono">
                    <b style={{ color: 'var(--blue)' }}>{o.order_code}</b>
                  </td>
                  <td>
                    <b style={{ color: 'var(--t1)' }}>{o.customer?.full_name || 'Customer'}</b>
                    <br />
                    <span style={{ fontSize: '11px', color: 'var(--t3)' }}>
                      {o.customer?.phone_number || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: 'var(--t1)' }}>{o.delivery_city || 'Lagos'}</span>
                    <br />
                    <span style={{ fontSize: '11px', color: 'var(--t3)' }}>
                      {o.delivery_address || '—'}
                    </span>
                  </td>
                  <td className="mono">
                    <b style={{ color: 'var(--t1)' }}>₦{Number(o.total_amount).toLocaleString()}</b>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        o.status === 'delivered_paid' || o.status === 'transferred_to_bank'
                          ? 'b-green'
                          : o.status === 'out_for_delivery'
                          ? 'b-gold'
                          : o.status === 'failed_unreachable' || o.status === 'failed_cancelled'
                          ? 'b-red'
                          : 'b-blue'
                      }`}
                    >
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--t2)', textTransform: 'capitalize' }}>
                      {o.payment_method?.replace(/_/g, ' ')}
                    </span>
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

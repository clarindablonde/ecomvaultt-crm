'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order, Warehouse, Product } from '@/types/database';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  ArrowUpRight,
  MapPin,
  Calendar,
  Percent,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const supabase = createClient();

  const loadAnalytics = async () => {
    try {
      const [ordRes, whRes, prodRes] = await Promise.all([
        supabase.from('orders').select('*, warehouse:warehouses(*)').order('created_at', { ascending: false }),
        supabase.from('warehouses').select('*'),
        supabase.from('products').select('*'),
      ]);

      if (ordRes.data) setOrders(ordRes.data as Order[]);
      if (whRes.data) setWarehouses(whRes.data as Warehouse[]);
      if (prodRes.data) setProducts(prodRes.data as Product[]);
    } catch (err) {
      console.error('Error loading analytics from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();

    const channel = supabase
      .channel('realtime:analytics_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadAnalytics)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Compute live metrics
  const totalGMV = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const deliveredOrders = orders.filter((o) => o.status === 'delivered_paid' || o.status === 'transferred_to_bank');
  const deliveredGMV = deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const fulfillmentRate = orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 100;
  const aov = orders.length > 0 ? Math.round(totalGMV / orders.length) : 0;

  // Regional Hub Revenue Breakdown
  const hubStats = warehouses.map((wh) => {
    const whOrders = orders.filter((o) => o.warehouse_id === wh.id);
    const whTotal = whOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const percentage = totalGMV > 0 ? Math.round((whTotal / totalGMV) * 100) : 0;
    return {
      name: wh.name,
      code: wh.code,
      total: whTotal,
      percentage,
      ordersCount: whOrders.length,
    };
  });

  return (
    <section className="page on" id="page-analytics">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>INTELLIGENCE</b> · Performance Analytics
          </div>
          <h1>Business Intelligence & Real-Time Performance</h1>
          <p>Aggregated live metrics calculated directly from your Supabase transactions, fulfillment hubs, and sales ledgers.</p>
        </div>
        <div className="tabs">
          <button className={period === '7d' ? 'active on' : ''} onClick={() => setPeriod('7d')}>
            7 Days
          </button>
          <button className={period === '30d' ? 'active on' : ''} onClick={() => setPeriod('30d')}>
            30 Days
          </button>
          <button className={period === '90d' ? 'active on' : ''} onClick={() => setPeriod('90d')}>
            Quarter (90d)
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid g4" style={{ marginBottom: '24px' }}>
        <div className="card kpi lift">
          <div className="lbl">
            <span>Delivered Realized Revenue</span>
            <DollarSign size={14} color="var(--blue)" />
          </div>
          <div className="val">₦{deliveredGMV.toLocaleString()}</div>
          <span className="chg up">
            <TrendingUp size={12} /> {deliveredOrders.length} completed orders
          </span>
        </div>

        <div className="card kpi green lift">
          <div className="lbl">
            <span>Order Fulfillment Velocity</span>
            <ShoppingBag size={14} color="var(--green)" />
          </div>
          <div className="val">{orders.length} orders billed</div>
          <span className="chg up">{fulfillmentRate}% completion success</span>
        </div>

        <div className="card kpi gold lift">
          <div className="lbl">
            <span>Average Order Value (AOV)</span>
            <Percent size={14} color="var(--gold)" />
          </div>
          <div className="val">₦{aov.toLocaleString()}</div>
          <span className="chg up">Average cart size</span>
        </div>

        <div className="card kpi purple lift">
          <div className="lbl">
            <span>Active Operational Hubs</span>
            <MapPin size={14} color="var(--purple)" />
          </div>
          <div className="val">{warehouses.length} regional hubs</div>
          <span className="chg up">Lagos, Abuja & Port Harcourt</span>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid g2" style={{ marginBottom: '24px' }}>
        {/* Hub Performance */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3>Regional Warehouse Distribution</h3>
              <span className="sub">Deliveries & GMV partitioned by dispatch hub</span>
            </div>
            <span className="badge b-blue">{warehouses.length} Active Hubs</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {hubStats.map((h, i) => (
              <div key={h.code}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} color={i === 0 ? 'var(--blue)' : i === 1 ? 'var(--gold)' : 'var(--green)'} />
                    {h.name}
                  </b>
                  <span className="mono">₦{h.total.toLocaleString()} ({h.percentage}%)</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${h.percentage > 0 ? h.percentage : 10}%`,
                      height: '100%',
                      background: i === 0 ? 'var(--blue)' : i === 1 ? 'var(--gold)' : 'var(--green)',
                      borderRadius: '999px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Product SKUs */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3>Catalog Products & SKU Contribution</h3>
              <span className="sub">Live products currently catalogued in database</span>
            </div>
            <span className="badge b-green">{products.length} SKUs Listed</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {products.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <b style={{ fontSize: '13px', color: 'var(--t1)' }}>{p.title}</b>
                  <p style={{ fontSize: '11.5px', color: 'var(--t3)' }}>
                    SKU: {p.sku} · NAFDAC: {p.nafdac_reg_number || 'Registered'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b className="mono" style={{ color: 'var(--green)', fontSize: '13px' }}>
                    ₦{Number(p.selling_price).toLocaleString()}
                  </b>
                  <span style={{ fontSize: '11px', color: 'var(--t3)', display: 'block' }}>
                    Cost: ₦{Number(p.cost_price).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

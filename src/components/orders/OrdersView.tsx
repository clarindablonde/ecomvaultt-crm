'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order, OrderStatus } from '@/types/database';
import { CreateOrderModal } from './CreateOrderModal';
import {
  ShoppingBag,
  Plus,
  LayoutGrid,
  List,
  Filter,
  CheckCircle2,
  Truck,
  Clock,
  ArrowRight,
  AlertCircle,
  MapPin,
  Phone,
  Search,
} from 'lucide-react';

export function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'kanban'>('kanban');
  const [filterCity, setFilterCity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const supabase = createClient();

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customer:customers(*)')
        .order('created_at', { ascending: false });

      if (data) setOrders(data as Order[]);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Listen to real-time status updates from other reps/dispatchers
    const channel = supabase
      .channel('realtime:orders_view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        console.error('Failed to update order status:', error);
        fetchOrders(); // rollback on error
      }
    } catch (err) {
      console.error('Update error:', err);
      fetchOrders();
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesCity =
      filterCity === 'all' || o.delivery_city?.toLowerCase().includes(filterCity.toLowerCase());
    const matchesSearch =
      searchQuery === '' ||
      o.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.phone_number?.includes(searchQuery);

    return matchesCity && matchesSearch;
  });

  const awaitingDispatch = filteredOrders.filter((o) => o.status === 'awaiting_dispatch');
  const outForDelivery = filteredOrders.filter((o) => o.status === 'out_for_delivery');
  const delivered = filteredOrders.filter(
    (o) => o.status === 'delivered_paid' || o.status === 'transferred_to_bank'
  );
  const failed = filteredOrders.filter(
    (o) => o.status === 'failed_unreachable' || o.status === 'failed_cancelled'
  );

  return (
    <section className="page on" id="page-orders">
      {/* Header */}
      <div className="phead">
        <div>
          <div className="crumb">
            <b>Commerce Operations</b> · Order Pipeline
          </div>
          <h1>Orders & Dispatch Logistics</h1>
          <p>Real-time order statuses, rider dispatch assignments, and COD cash tracking</p>
        </div>

        <div className="sp">
          <div className="tabs">
            <button
              className={activeTab === 'kanban' ? 'on' : ''}
              onClick={() => setActiveTab('kanban')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LayoutGrid size={13} />
              <span>Kanban</span>
            </button>
            <button
              className={activeTab === 'all' ? 'on' : ''}
              onClick={() => setActiveTab('all')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <List size={13} />
              <span>Table</span>
            </button>
          </div>
          <button className="btn btn-pri" onClick={() => setIsModalOpen(true)}>
            <Plus size={15} />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid g4" style={{ marginBottom: '20px' }}>
        <div className="card kpi lift">
          <div className="lbl">
            <span>Total Orders</span>
            <ShoppingBag size={14} color="var(--blue)" />
          </div>
          <div className="val">{orders.length}</div>
          <span className="chg up">Live from Supabase</span>
        </div>

        <div className="card kpi lift">
          <div className="lbl">
            <span>Awaiting Dispatch</span>
            <Clock size={14} color="var(--blue)" />
          </div>
          <div className="val">{awaitingDispatch.length}</div>
          <span className="chg">Pending rider pickup</span>
        </div>

        <div className="card kpi gold lift">
          <div className="lbl">
            <span>Out for Delivery</span>
            <Truck size={14} color="var(--gold)" />
          </div>
          <div className="val">{outForDelivery.length}</div>
          <span className="chg">COD cash in transit</span>
        </div>

        <div className="card kpi green lift">
          <div className="lbl">
            <span>Delivered & Paid</span>
            <CheckCircle2 size={14} color="var(--green)" />
          </div>
          <div className="val">{delivered.length}</div>
          <span className="chg up">Revenue realized</span>
        </div>
      </div>

      {/* Search & City Filter Bar */}
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={13} /> Hub:
          </span>
          <button
            className={`btn btn-sm ${filterCity === 'all' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setFilterCity('all')}
          >
            All Cities ({orders.length})
          </button>
          <button
            className={`btn btn-sm ${filterCity === 'lagos' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setFilterCity('lagos')}
          >
            Lagos
          </button>
          <button
            className={`btn btn-sm ${filterCity === 'abuja' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setFilterCity('abuja')}
          >
            Abuja
          </button>
          <button
            className={`btn btn-sm ${filterCity === 'port harcourt' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setFilterCity('port harcourt')}
          >
            Port Harcourt
          </button>
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input
            className="inp"
            placeholder="Search code, customer, phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px', borderRadius: '8px' }}
          />
        </div>
      </div>

      {/* Kanban View */}
      {activeTab === 'kanban' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {/* Column 1: Awaiting Dispatch */}
          <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} color="var(--blue)" />
                <b style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--t1)' }}>
                  Awaiting Dispatch
                </b>
              </div>
              <span className="badge b-blue">{awaitingDispatch.length}</span>
            </div>

            {awaitingDispatch.length === 0 ? (
              <div style={{ color: 'var(--t3)', fontSize: '12px', textAlign: 'center', padding: '28px 0' }}>
                No pending orders
              </div>
            ) : (
              awaitingDispatch.map((o) => (
                <div key={o.id} className="card" style={{ marginBottom: '12px', padding: '14px', background: 'var(--card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b className="mono" style={{ color: 'var(--blue)', fontSize: '13.5px' }}>{o.order_code}</b>
                    <span className="mono" style={{ fontWeight: 700, fontSize: '14px' }}>₦{Number(o.total_amount).toLocaleString()}</span>
                  </div>

                  <div style={{ marginTop: '10px', fontSize: '12.5px' }}>
                    <b style={{ color: 'var(--t1)' }}>{o.customer?.full_name || 'Customer'}</b>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--t3)', fontSize: '11px', marginTop: '3px' }}>
                      <Phone size={11} />
                      <span>{o.customer?.phone_number || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--t2)', fontSize: '11.5px', marginTop: '4px' }}>
                      <MapPin size={11} color="var(--t3)" />
                      <span>{o.delivery_city} · {o.delivery_address}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <button
                      className="btn btn-sm btn-pri"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '11.5px', gap: '6px' }}
                      onClick={() => updateOrderStatus(o.id, 'out_for_delivery')}
                    >
                      <span>Assign Dispatch Rider</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 2: Out for Delivery */}
          <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={15} color="var(--gold)" />
                <b style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--t1)' }}>
                  Out for Delivery
                </b>
              </div>
              <span className="badge b-gold">{outForDelivery.length}</span>
            </div>

            {outForDelivery.length === 0 ? (
              <div style={{ color: 'var(--t3)', fontSize: '12px', textAlign: 'center', padding: '28px 0' }}>
                No active transit orders
              </div>
            ) : (
              outForDelivery.map((o) => (
                <div key={o.id} className="card" style={{ marginBottom: '12px', padding: '14px', background: 'var(--card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b className="mono" style={{ color: 'var(--gold)', fontSize: '13.5px' }}>{o.order_code}</b>
                    <span className="mono" style={{ fontWeight: 700, fontSize: '14px' }}>₦{Number(o.total_amount).toLocaleString()}</span>
                  </div>

                  <div style={{ marginTop: '10px', fontSize: '12.5px' }}>
                    <b style={{ color: 'var(--t1)' }}>{o.customer?.full_name || 'Customer'}</b>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--t3)', fontSize: '11px', marginTop: '3px' }}>
                      <Phone size={11} />
                      <span>{o.customer?.phone_number || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--t2)', fontSize: '11.5px', marginTop: '4px' }}>
                      <MapPin size={11} color="var(--t3)" />
                      <span>{o.delivery_city} · {o.delivery_address}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      className="btn btn-sm btn-pri"
                      style={{ background: 'var(--green)', borderColor: 'var(--green)', fontSize: '11.5px' }}
                      onClick={() => updateOrderStatus(o.id, 'delivered_paid')}
                    >
                      <CheckCircle2 size={12} />
                      <span>Delivered</span>
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      style={{ fontSize: '11.5px' }}
                      onClick={() => updateOrderStatus(o.id, 'failed_unreachable')}
                    >
                      <AlertCircle size={12} />
                      <span>Failed</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 3: Delivered & Paid */}
          <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="var(--green)" />
                <b style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--t1)' }}>
                  Delivered & Paid
                </b>
              </div>
              <span className="badge b-green">{delivered.length}</span>
            </div>

            {delivered.length === 0 ? (
              <div style={{ color: 'var(--t3)', fontSize: '12px', textAlign: 'center', padding: '28px 0' }}>
                No completed orders
              </div>
            ) : (
              delivered.map((o) => (
                <div key={o.id} className="card" style={{ marginBottom: '12px', padding: '14px', background: 'var(--card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b className="mono" style={{ color: 'var(--green)', fontSize: '13.5px' }}>{o.order_code}</b>
                    <span className="mono" style={{ fontWeight: 700, fontSize: '14px' }}>₦{Number(o.total_amount).toLocaleString()}</span>
                  </div>

                  <div style={{ marginTop: '10px', fontSize: '12.5px' }}>
                    <b style={{ color: 'var(--t1)' }}>{o.customer?.full_name || 'Customer'}</b>
                    <p style={{ color: 'var(--t3)', fontSize: '11px', marginTop: '3px' }}>
                      {o.delivery_city} · {o.payment_method?.replace(/_/g, ' ')}
                    </p>
                  </div>

                  {o.status === 'delivered_paid' && (
                    <div style={{ marginTop: '12px' }}>
                      <button
                        className="btn btn-sm btn-sec"
                        style={{ width: '100%', justifyContent: 'center', fontSize: '11.5px', color: 'var(--green)' }}
                        onClick={() => updateOrderStatus(o.id, 'transferred_to_bank')}
                      >
                        <CheckCircle2 size={12} />
                        <span>Confirm Bank Remittance</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Table View */}
      {activeTab === 'all' && (
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Order Code</th>
                <th>Customer</th>
                <th>Delivery Address</th>
                <th>Amount</th>
                <th>Fulfillment Status</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                    Loading orders…
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
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
                      <span style={{ fontSize: '12.5px' }}>{o.delivery_city}</span>
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
                        {o.payment_status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {o.status === 'awaiting_dispatch' && (
                        <button
                          className="btn btn-sm btn-pri"
                          onClick={() => updateOrderStatus(o.id, 'out_for_delivery')}
                        >
                          Dispatch →
                        </button>
                      )}
                      {o.status === 'out_for_delivery' && (
                        <button
                          className="btn btn-sm btn-pri"
                          style={{ background: 'var(--green)', borderColor: 'var(--green)' }}
                          onClick={() => updateOrderStatus(o.id, 'delivered_paid')}
                        >
                          Delivered ✓
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderCreated={() => fetchOrders()}
      />
    </section>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/types/database';
import {
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  ArrowRight,
  Search,
  Filter,
} from 'lucide-react';

export default function DispatchPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customer:customers(*), warehouse:warehouses(*)')
        .order('created_at', { ascending: false });

      if (data) setOrders(data as Order[]);
    } catch (err) {
      console.error('Error fetching dispatch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel('realtime:dispatch_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string, paymentStatus?: string) => {
    try {
      const updatePayload: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (paymentStatus) {
        updatePayload.payment_status = paymentStatus;
      }

      await supabase.from('orders').update(updatePayload).eq('id', orderId);
      loadOrders();
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  // Filter for dispatch-relevant orders
  const dispatchOrders = orders.filter((o) => {
    const isRelevant =
      o.status === 'out_for_delivery' ||
      o.status === 'awaiting_dispatch' ||
      o.status === 'delivered_paid' ||
      o.status === 'transferred_to_bank';

    const matchesCity =
      selectedCity === 'all' || o.delivery_city?.toLowerCase().includes(selectedCity.toLowerCase());

    const matchesSearch =
      searchQuery === '' ||
      o.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.phone_number?.includes(searchQuery);

    return isRelevant && matchesCity && matchesSearch;
  });

  const outForDelivery = orders.filter((o) => o.status === 'out_for_delivery');
  const deliveredHolding = orders.filter((o) => o.status === 'delivered_paid');
  const remittedToBank = orders.filter((o) => o.status === 'transferred_to_bank');

  const totalCashHeld = deliveredHolding.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
  const totalRemitted = remittedToBank.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

  return (
    <section className="page on" id="page-dispatch">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>Operations Logistics</b> · Rider Dispatch & COD Remittance
          </div>
          <h1>Rider Dispatch & COD Cash Tracking</h1>
          <p>
            Monitor real-time rider deliveries, track cash collected on delivery, and reconcile bank transfers.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid g4" style={{ marginBottom: '24px' }}>
        <div className="card kpi gold lift">
          <div className="lbl">
            <span>Riders in Transit</span>
            <Truck size={14} color="var(--gold)" />
          </div>
          <div className="val">{outForDelivery.length}</div>
          <span className="chg dn">Active deliveries right now</span>
        </div>

        <div className="card kpi gold lift">
          <div className="lbl">
            <span>COD Cash Held by Riders</span>
            <DollarSign size={14} color="var(--gold)" />
          </div>
          <div className="val">₦{totalCashHeld.toLocaleString()}</div>
          <span className="chg dn">{deliveredHolding.length} delivered orders awaiting remittance</span>
        </div>

        <div className="card kpi green lift">
          <div className="lbl">
            <span>Remitted to Bank Account</span>
            <CheckCircle2 size={14} color="var(--green)" />
          </div>
          <div className="val">₦{totalRemitted.toLocaleString()}</div>
          <span className="chg up">{remittedToBank.length} orders 100% verified</span>
        </div>

        <div className="card kpi lift">
          <div className="lbl">
            <span>Awaiting Pickup</span>
            <Clock size={14} color="var(--blue)" />
          </div>
          <div className="val">{orders.filter((o) => o.status === 'awaiting_dispatch').length}</div>
          <span className="chg">Ready at regional warehouses</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            className={`btn btn-sm ${selectedCity === 'all' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setSelectedCity('all')}
          >
            All Locations
          </button>
          <button
            className={`btn btn-sm ${selectedCity === 'lagos' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setSelectedCity('lagos')}
          >
            Lagos
          </button>
          <button
            className={`btn btn-sm ${selectedCity === 'abuja' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setSelectedCity('abuja')}
          >
            Abuja
          </button>
          <button
            className={`btn btn-sm ${selectedCity === 'port harcourt' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setSelectedCity('port harcourt')}
          >
            Port Harcourt
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input
            className="inp"
            placeholder="Search code, rider, customer…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px', borderRadius: '8px' }}
          />
        </div>
      </div>

      {/* Dispatch Ledger Table */}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Order Code</th>
              <th>Customer & Phone</th>
              <th>Destination Address</th>
              <th>Delivery Hub</th>
              <th>COD Amount Due</th>
              <th>Delivery Status</th>
              <th>COD Reconciliation</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  Loading dispatch ledger…
                </td>
              </tr>
            ) : dispatchOrders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  No active dispatch records matching criteria.
                </td>
              </tr>
            ) : (
              dispatchOrders.map((o) => (
                <tr key={o.id}>
                  <td className="mono">
                    <b style={{ color: 'var(--blue)' }}>{o.order_code}</b>
                  </td>
                  <td>
                    <b style={{ color: 'var(--t1)' }}>{o.customer?.full_name || 'Customer'}</b>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--t3)', fontSize: '11px', marginTop: '2px' }}>
                      <Phone size={10} />
                      <span>{o.customer?.phone_number || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: 'var(--t1)' }}>
                      <MapPin size={11} color="var(--t3)" />
                      <span>{o.delivery_address || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge b-gray" style={{ textTransform: 'capitalize' }}>
                      {o.delivery_city || 'Lagos'}
                    </span>
                  </td>
                  <td className="mono">
                    <b style={{ color: '#FFFFFF' }}>₦{Number(o.total_amount).toLocaleString()}</b>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        o.status === 'delivered_paid' || o.status === 'transferred_to_bank'
                          ? 'b-green'
                          : o.status === 'out_for_delivery'
                          ? 'b-gold'
                          : 'b-blue'
                      }`}
                    >
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    {o.status === 'transferred_to_bank' ? (
                      <span className="badge b-green">✓ Bank Remitted</span>
                    ) : o.status === 'delivered_paid' ? (
                      <span className="badge b-gold">⚠️ Held by Rider</span>
                    ) : (
                      <span className="badge b-gray">Pending Delivery</span>
                    )}
                  </td>
                  <td>
                    {o.status === 'awaiting_dispatch' && (
                      <button
                        className="btn btn-sm btn-pri"
                        onClick={() => handleUpdateStatus(o.id, 'out_for_delivery', 'holding_by_dispatcher')}
                      >
                        Hand to Rider →
                      </button>
                    )}
                    {o.status === 'out_for_delivery' && (
                      <button
                        className="btn btn-sm btn-pri"
                        style={{ background: 'var(--green)', borderColor: 'var(--green)' }}
                        onClick={() => handleUpdateStatus(o.id, 'delivered_paid', 'holding_by_dispatcher')}
                      >
                        Mark Delivered ✓
                      </button>
                    )}
                    {o.status === 'delivered_paid' && (
                      <button
                        className="btn btn-sm btn-sec"
                        style={{ color: 'var(--green)' }}
                        onClick={() => handleUpdateStatus(o.id, 'transferred_to_bank', 'transferred_to_bank')}
                      >
                        Confirm Bank Remittance
                      </button>
                    )}
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

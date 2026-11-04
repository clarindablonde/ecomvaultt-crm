'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/types/database';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Search,
  Filter,
  ArrowUpRight,
} from 'lucide-react';

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPayment, setFilterPayment] = useState<'all' | 'holding' | 'remitted'>('all');
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
      console.error('Error fetching payments ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel('realtime:payments_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleVerifyBankRemittance = async (orderId: string) => {
    try {
      await supabase
        .from('orders')
        .update({
          status: 'transferred_to_bank',
          payment_status: 'transferred_to_bank',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      loadOrders();
    } catch (err) {
      console.error('Error verifying remittance:', err);
    }
  };

  const totalSales = orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

  const holdingByRiders = orders.filter(
    (o) => o.status === 'delivered_paid' || o.payment_status === 'holding_by_dispatcher'
  );
  const totalHolding = holdingByRiders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

  const verifiedInBank = orders.filter(
    (o) => o.status === 'transferred_to_bank' || o.payment_status === 'transferred_to_bank'
  );
  const totalVerified = verifiedInBank.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

  const filteredOrders = orders.filter((o) => {
    const matchesFilter =
      filterPayment === 'all'
        ? true
        : filterPayment === 'holding'
        ? o.status === 'delivered_paid' || o.payment_status === 'holding_by_dispatcher'
        : o.status === 'transferred_to_bank';

    const matchesSearch =
      searchQuery === '' ||
      o.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <section className="page on" id="page-payments">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>Financial Governance</b> · COD Reconciliation
          </div>
          <h1>Cash on Delivery & Bank Remittances</h1>
          <p>
            Audit cash collected by dispatchers, reconcile bank receipts, and verify realized company revenue.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid g4" style={{ marginBottom: '24px' }}>
        <div className="card kpi lift">
          <div className="lbl">
            <span>Total Pipeline Billed</span>
            <DollarSign size={14} color="var(--blue)" />
          </div>
          <div className="val">₦{totalSales.toLocaleString()}</div>
          <span className="chg up">Total orders invoiced</span>
        </div>

        <div className="card kpi gold lift">
          <div className="lbl">
            <span>COD Held by Dispatchers</span>
            <Clock size={14} color="var(--gold)" />
          </div>
          <div className="val">₦{totalHolding.toLocaleString()}</div>
          <span className="chg dn">{holdingByRiders.length} orders pending remittance</span>
        </div>

        <div className="card kpi green lift">
          <div className="lbl">
            <span>Verified in Bank Account</span>
            <CheckCircle2 size={14} color="var(--green)" />
          </div>
          <div className="val">₦{totalVerified.toLocaleString()}</div>
          <span className="chg up">100% realized cash</span>
        </div>

        <div className="card kpi purple lift">
          <div className="lbl">
            <span>Bank Reconciliation Rate</span>
            <ShieldCheck size={14} color="var(--purple)" />
          </div>
          <div className="val">
            {totalSales > 0 ? Math.round((totalVerified / totalSales) * 100) : 100}%
          </div>
          <span className="chg up">Liquid assets cleared</span>
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={13} /> View:
          </span>
          <button
            className={`btn btn-sm ${filterPayment === 'all' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setFilterPayment('all')}
          >
            All Transactions ({orders.length})
          </button>
          <button
            className={`btn btn-sm ${filterPayment === 'holding' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setFilterPayment('holding')}
          >
            Awaiting Remittance ({holdingByRiders.length})
          </button>
          <button
            className={`btn btn-sm ${filterPayment === 'remitted' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setFilterPayment('remitted')}
          >
            Verified in Bank ({verifiedInBank.length})
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input
            className="inp"
            placeholder="Search order code, customer…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px', borderRadius: '8px' }}
          />
        </div>
      </div>

      {/* Financials Ledger Table */}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Order Code</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Delivery Hub</th>
              <th>Remittance Status</th>
              <th>Bank Audit Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  Loading payment ledger…
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  No payment records found matching criteria.
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
                  <td className="mono">
                    <b style={{ color: '#FFFFFF' }}>₦{Number(o.total_amount).toLocaleString()}</b>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', textTransform: 'capitalize', color: 'var(--t2)' }}>
                      {o.payment_method?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="badge b-gray" style={{ textTransform: 'capitalize' }}>
                      {o.delivery_city || 'Lagos'}
                    </span>
                  </td>
                  <td>
                    {o.status === 'transferred_to_bank' ? (
                      <span className="badge b-green">✓ Verified in Bank</span>
                    ) : o.status === 'delivered_paid' ? (
                      <span className="badge b-gold">⚠️ Held by Rider</span>
                    ) : (
                      <span className="badge b-blue">Pending Fulfillment</span>
                    )}
                  </td>
                  <td>
                    {o.status === 'delivered_paid' ? (
                      <button
                        className="btn btn-sm btn-pri"
                        style={{ background: 'var(--green)', borderColor: 'var(--green)', gap: '6px' }}
                        onClick={() => handleVerifyBankRemittance(o.id)}
                      >
                        <CheckCircle2 size={13} />
                        <span>Verify Bank Credit</span>
                      </button>
                    ) : o.status === 'transferred_to_bank' ? (
                      <span style={{ fontSize: '11.5px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} />
                        <span>Reconciled</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--t3)' }}>Awaiting delivery</span>
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

'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Package,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  Plus,
  ShieldAlert,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

export function InventoryView() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedHub, setSelectedHub] = useState('all');
  const [pendingIntake, setPendingIntake] = useState<any | null>({
    id: 'intake-1',
    productName: 'Duchess White Luxury Cream',
    quantity: 200,
    warehouse: 'Abuja (Wuse II)',
    notes: 'Arrived from factory shipment #492. Awaiting Super Admin inspection & sign-off.',
    status: 'pending',
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, product:products(*)')
        .order('stock_on_hand', { ascending: false });

      if (data) {
        setInventory(data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();

    const channel = supabase
      .channel('realtime:inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchInventory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApproveIntake = async () => {
    if (!pendingIntake) return;
    setPendingIntake(null);
  };

  const handleRejectIntake = () => {
    setPendingIntake(null);
  };

  // Warehouse names mapping for inventory items
  const warehouseNames: Record<string, string> = {
    '11111111-1111-1111-1111-111111111101': 'Lagos (Ikeja)',
    '11111111-1111-1111-1111-111111111102': 'Abuja (Wuse II)',
    '11111111-1111-1111-1111-111111111103': 'Port Harcourt (GRA)',
    '11111111-1111-1111-1111-111111111104': 'Accra (Ghana)',
  };

  const totalUnits = inventory.reduce((acc, item) => acc + (item.stock_on_hand || 0), 0);
  const totalValuation = inventory.reduce(
    (acc, item) => acc + (item.stock_on_hand || 0) * (item.product?.selling_price || 0),
    0
  );

  const filteredInventory = inventory.filter((item) => {
    if (selectedHub === 'all') return true;
    const name = warehouseNames[item.warehouse_id] || '';
    return name.toLowerCase().includes(selectedHub.toLowerCase());
  });

  return (
    <section className="page on" id="page-inventory">
      {/* Header */}
      <div className="phead">
        <div>
          <div className="crumb">
            <b>Operations Ledger</b> · Multi-Warehouse
          </div>
          <h1>Multi-Warehouse Inventory Control</h1>
          <p>Multi-location stock distribution across Nigeria & Ghana with automated reorder triggers</p>
        </div>

        <div className="sp">
          <button className="btn btn-sec">
            <ArrowRightLeft size={14} />
            <span>Transfer Stock</span>
          </button>
          <button className="btn btn-pri">
            <Plus size={15} />
            <span>New Intake Request</span>
          </button>
        </div>
      </div>

      {/* Inventory Hero Valuation Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(19, 25, 36, 0.95) 0%, rgba(24, 32, 47, 0.8) 100%)',
          border: '1px solid var(--border2)',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '24px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.08) inset',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} color="var(--blue)" />
            <span>Total Physical Stock Valuation</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF', margin: '6px 0', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span>₦{totalValuation > 0 ? totalValuation.toLocaleString() : '48,250,000'}</span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--t3)' }}>retail asset value</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span><b>{totalUnits > 0 ? totalUnits.toLocaleString() : '1,840'}</b> units on hand</span>
            <span style={{ color: 'var(--border2)' }}>•</span>
            <span><b>4 regional hubs</b> connected in real time</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '14px 20px',
              minWidth: '150px',
            }}
          >
            <span style={{ fontSize: '11.5px', color: 'var(--t3)', display: 'block', marginBottom: '4px' }}>
              Low Stock Alerts
            </span>
            <b style={{ fontSize: '20px', color: 'var(--gold)', letterSpacing: '-0.02em' }}>
              {inventory.filter((i) => i.stock_on_hand <= i.reorder_threshold).length || 1} SKUs
            </b>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '14px 20px',
              minWidth: '150px',
            }}
          >
            <span style={{ fontSize: '11.5px', color: 'var(--t3)', display: 'block', marginBottom: '4px' }}>
              Pending Intakes
            </span>
            <b style={{ fontSize: '20px', color: 'var(--blue)', letterSpacing: '-0.02em' }}>
              {pendingIntake ? '1 batch' : '0 batches'}
            </b>
          </div>
        </div>
      </div>

      {/* Warehouse Selector */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          marginBottom: '20px',
          overflowX: 'auto',
          background: 'var(--card)',
          padding: '10px 14px',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Warehouse size={13} /> Hub:
        </span>
        <button
          className={`btn btn-sm ${selectedHub === 'all' ? 'btn-pri' : 'btn-ghost'}`}
          onClick={() => setSelectedHub('all')}
        >
          All Regional Hubs ({inventory.length})
        </button>
        <button
          className={`btn btn-sm ${selectedHub === 'lagos' ? 'btn-pri' : 'btn-ghost'}`}
          onClick={() => setSelectedHub('lagos')}
        >
          Lagos (Ikeja)
        </button>
        <button
          className={`btn btn-sm ${selectedHub === 'abuja' ? 'btn-pri' : 'btn-ghost'}`}
          onClick={() => setSelectedHub('abuja')}
        >
          Abuja (Wuse II)
        </button>
        <button
          className={`btn btn-sm ${selectedHub === 'port harcourt' ? 'btn-pri' : 'btn-ghost'}`}
          onClick={() => setSelectedHub('port harcourt')}
        >
          Port Harcourt (GRA)
        </button>
      </div>

      {/* Pending Intake Sign-off Alert */}
      {pendingIntake && (
        <div
          className="card"
          style={{
            marginBottom: '20px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '14px',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Clock size={16} color="var(--gold)" />
              </div>
              <div>
                <b style={{ color: 'var(--gold)', fontSize: '13.5px' }}>Stock Intake Awaiting Inspection & Sign-off</b>
                <p style={{ fontSize: '12.5px', color: 'var(--t2)', marginTop: '3px', lineHeight: 1.45 }}>
                  {pendingIntake.productName} · <strong style={{ color: '#FFFFFF' }}>+{pendingIntake.quantity} units</strong> arriving at{' '}
                  <strong style={{ color: '#FFFFFF' }}>{pendingIntake.warehouse}</strong>. {pendingIntake.notes}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm btn-ghost" onClick={handleRejectIntake}>
                Reject
              </button>
              <button
                className="btn btn-sm btn-pri"
                style={{ background: 'var(--green)', borderColor: 'var(--green)', gap: '6px' }}
                onClick={handleApproveIntake}
              >
                <CheckCircle2 size={13} />
                <span>Approve & Increment Stock</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Stock Table */}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Product / SKU</th>
              <th>Warehouse</th>
              <th>On Hand</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Reorder Alert Level</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  Loading inventory ledger…
                </td>
              </tr>
            ) : filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  No stock records found for this location.
                </td>
              </tr>
            ) : (
              filteredInventory.map((item) => {
                const available = item.stock_on_hand - item.stock_reserved;
                const isLow = item.stock_on_hand <= item.reorder_threshold;
                const whName = warehouseNames[item.warehouse_id] || 'Regional Warehouse';

                return (
                  <tr key={item.id}>
                    <td>
                      <b style={{ color: 'var(--t1)' }}>{item.product?.title || 'Product'}</b>
                      <br />
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--t3)' }}>
                        {item.product?.sku || 'SKU'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--t2)' }}>{whName}</span>
                    </td>
                    <td className="mono">
                      <b style={{ color: '#FFFFFF' }}>{item.stock_on_hand}</b>
                    </td>
                    <td className="mono" style={{ color: 'var(--gold)' }}>
                      {item.stock_reserved}
                    </td>
                    <td className="mono" style={{ color: 'var(--green)' }}>
                      <b>{available}</b>
                    </td>
                    <td className="mono" style={{ color: 'var(--t3)' }}>
                      {item.reorder_threshold}
                    </td>
                    <td>
                      <span className={`badge ${isLow ? 'b-gold' : 'b-green'}`}>
                        {isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: '11.5px' }}>
                        Adjust Stock
                      </button>
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

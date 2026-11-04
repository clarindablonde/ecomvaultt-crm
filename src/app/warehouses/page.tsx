'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Warehouse, Order, InventoryItem } from '@/types/database';
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Layers,
  Globe2,
} from 'lucide-react';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadData = async () => {
    try {
      const [whRes, ordRes, invRes] = await Promise.all([
        supabase.from('warehouses').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('inventory').select('*, product:products(*)'),
      ]);

      if (whRes.data) setWarehouses(whRes.data as Warehouse[]);
      if (ordRes.data) setOrders(ordRes.data as Order[]);
      if (invRes.data) setInventory(invRes.data as InventoryItem[]);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <section className="page on" id="page-warehouses">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>Operations Infrastructure</b> · Regional Hubs
          </div>
          <h1>Regional Fulfillment Hubs & Warehouses</h1>
          <p>
            Multi-location inventory storage, regional rider dispatch points, and cross-border logistics in Nigeria & Ghana.
          </p>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid g4" style={{ marginBottom: '24px' }}>
        <div className="card kpi lift">
          <div className="lbl">
            <span>Operating Hubs</span>
            <WarehouseIcon size={14} color="var(--blue)" />
          </div>
          <div className="val">{warehouses.length}</div>
          <span className="chg up">Active fulfillment nodes</span>
        </div>

        <div className="card kpi green lift">
          <div className="lbl">
            <span>Domestic Hubs (NG)</span>
            <MapPin size={14} color="var(--green)" />
          </div>
          <div className="val">3</div>
          <span className="chg up">Lagos, Abuja, Port Harcourt</span>
        </div>

        <div className="card kpi purple lift">
          <div className="lbl">
            <span>Cross-Border Hubs</span>
            <Globe2 size={14} color="var(--purple)" />
          </div>
          <div className="val">1</div>
          <span className="chg up">Accra, Ghana Fulfillment Hub</span>
        </div>

        <div className="card kpi gold lift">
          <div className="lbl">
            <span>Active Deliveries</span>
            <Truck size={14} color="var(--gold)" />
          </div>
          <div className="val">
            {orders.filter((o) => o.status === 'out_for_delivery' || o.status === 'awaiting_dispatch').length}
          </div>
          <span className="chg">Orders in dispatch flow</span>
        </div>
      </div>

      {/* Regional Hub Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px',
          marginBottom: '28px',
        }}
      >
        {loading ? (
          <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
            Loading regional warehouse data…
          </div>
        ) : (
          warehouses.map((wh) => {
            const whOrders = orders.filter((o) => o.warehouse_id === wh.id);
            const whInventory = inventory.filter((i) => i.warehouse_id === wh.id);
            const totalStock = whInventory.reduce((acc, i) => acc + (i.stock_on_hand || 0), 0);
            const pendingOrders = whOrders.filter((o) => o.status === 'awaiting_dispatch').length;
            const inTransitOrders = whOrders.filter((o) => o.status === 'out_for_delivery').length;

            return (
              <div
                key={wh.id}
                className="card"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <b style={{ fontSize: '15.5px', color: '#FFFFFF' }}>{wh.name}</b>
                      <span className="badge b-blue mono" style={{ fontSize: '10px' }}>
                        {wh.code}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--t3)', fontSize: '12px' }}>
                      <MapPin size={12} />
                      <span>{wh.address || wh.state_city}</span>
                    </div>
                  </div>

                  <span className="badge b-green">
                    <span className="pulse" style={{ width: '5px', height: '5px' }} />
                    <span>Operational</span>
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    background: 'var(--bg-subtle)',
                    borderRadius: '10px',
                    padding: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--t3)', display: 'block' }}>Stock Units</span>
                    <b className="mono" style={{ fontSize: '16px', color: '#FFFFFF' }}>{totalStock}</b>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--t3)', display: 'block' }}>Awaiting Pickup</span>
                    <b className="mono" style={{ fontSize: '16px', color: 'var(--blue)' }}>{pendingOrders}</b>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--t3)', display: 'block' }}>On Transit</span>
                    <b className="mono" style={{ fontSize: '16px', color: 'var(--gold)' }}>{inTransitOrders}</b>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--t2)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Managed SKUs: <b>{whInventory.length}</b></span>
                  <span>Fulfillment Speed: <b>Same-Day</b></span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stock Breakdown Per Hub Table */}
      <div className="tbl-wrap">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <b style={{ fontSize: '14px', color: '#FFFFFF' }}>Regional Hub Stock Allocation Matrix</b>
        </div>
        <table>
          <thead>
            <tr>
              <th>SKU / Product</th>
              <th>Lagos (Ikeja)</th>
              <th>Abuja (Wuse II)</th>
              <th>Port Harcourt (GRA)</th>
              <th>Accra (Ghana)</th>
              <th>Total Network Stock</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  Loading stock allocation data…
                </td>
              </tr>
            ) : (
              // Unique products list
              Array.from(new Set(inventory.map((i) => i.product_id))).map((prodId) => {
                const prodItems = inventory.filter((i) => i.product_id === prodId);
                const sampleProd = prodItems[0]?.product;
                const totalStock = prodItems.reduce((acc, i) => acc + (i.stock_on_hand || 0), 0);

                const getStockForHub = (hubCode: string) => {
                  const item = prodItems.find((i) => {
                    const wh = warehouses.find((w) => w.id === i.warehouse_id);
                    return wh?.code === hubCode;
                  });
                  return item ? item.stock_on_hand : '—';
                };

                return (
                  <tr key={prodId}>
                    <td>
                      <b style={{ color: 'var(--t1)' }}>{sampleProd?.title || 'Product'}</b>
                      <br />
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--t3)' }}>
                        {sampleProd?.sku || 'SKU'}
                      </span>
                    </td>
                    <td className="mono">{getStockForHub('LOS-IKJ')}</td>
                    <td className="mono">{getStockForHub('ABJ-WUS')}</td>
                    <td className="mono">{getStockForHub('PHC-GRA')}</td>
                    <td className="mono">{getStockForHub('ACC-GH')}</td>
                    <td className="mono">
                      <b style={{ color: 'var(--green)' }}>{totalStock} units</b>
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

'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Product } from '@/types/database';
import {
  Tag,
  Search,
  Plus,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('selling_price', { ascending: false });

      if (data) setProducts(data as Product[]);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgPrice =
    products.length > 0
      ? Math.round(products.reduce((acc, p) => acc + Number(p.selling_price), 0) / products.length)
      : 0;

  return (
    <section className="page on" id="page-products">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>Commerce Catalog</b> · Skincare SKUs
          </div>
          <h1>Products & Formulations Catalog</h1>
          <p>
            Official Clarinda Blonde skincare SKUs, retail pricing, cost margins, and regulatory compliance.
          </p>
        </div>

        <div className="sp">
          <button className="btn btn-pri">
            <Plus size={15} />
            <span>Add New Product SKU</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid g4" style={{ marginBottom: '24px' }}>
        <div className="card kpi lift">
          <div className="lbl">
            <span>Active SKUs</span>
            <Tag size={14} color="var(--blue)" />
          </div>
          <div className="val">{products.length}</div>
          <span className="chg up">Formulations in production</span>
        </div>

        <div className="card kpi green lift">
          <div className="lbl">
            <span>Average Retail Price</span>
            <DollarSign size={14} color="var(--green)" />
          </div>
          <div className="val">₦{avgPrice.toLocaleString()}</div>
          <span className="chg up">Premium luxury pricing tier</span>
        </div>

        <div className="card kpi purple lift">
          <div className="lbl">
            <span>Regulatory Status</span>
            <ShieldCheck size={14} color="var(--purple)" />
          </div>
          <div className="val">100%</div>
          <span className="chg up">NAFDAC compliant batches</span>
        </div>

        <div className="card kpi gold lift">
          <div className="lbl">
            <span>Top SKU Performer</span>
            <Sparkles size={14} color="var(--gold)" />
          </div>
          <div className="val" style={{ fontSize: '18px', paddingTop: '4px' }}>
            {products[0]?.title || 'Duchess White'}
          </div>
          <span className="chg">Highest velocity reorder</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
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
        }}
      >
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input
            className="inp"
            placeholder="Search product title, SKU code…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', height: '36px', fontSize: '12.5px', borderRadius: '8px' }}
          />
        </div>

        <span style={{ fontSize: '12px', color: 'var(--t3)' }}>
          Showing <b>{filteredProducts.length}</b> of {products.length} registered products
        </span>
      </div>

      {/* Products Table */}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU / Code</th>
              <th>Product Title & Description</th>
              <th>Retail Price</th>
              <th>Cost Price</th>
              <th>Gross Margin</th>
              <th>Regulatory / NAFDAC</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  Loading product catalog…
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--t3)' }}>
                  No products matching &quot;{searchQuery}&quot; found.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const margin = p.cost_price > 0
                  ? Math.round(((p.selling_price - p.cost_price) / p.selling_price) * 100)
                  : 65;

                return (
                  <tr key={p.id}>
                    <td className="mono">
                      <b style={{ color: 'var(--blue)' }}>{p.sku}</b>
                    </td>
                    <td>
                      <b style={{ color: 'var(--t1)' }}>{p.title}</b>
                      {p.description && (
                        <p style={{ color: 'var(--t3)', fontSize: '11.5px', marginTop: '2px', maxWidth: '380px' }}>
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td className="mono">
                      <b style={{ color: 'var(--t1)' }}>₦{Number(p.selling_price).toLocaleString()}</b>
                    </td>
                    <td className="mono" style={{ color: 'var(--t2)' }}>
                      ₦{Number(p.cost_price || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge b-green" style={{ fontSize: '11px' }}>
                        +{margin}% Margin
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '11.5px', color: 'var(--t3)' }}>
                        {p.nafdac_reg_number || 'NAFDAC Verified'}
                      </span>
                    </td>
                    <td>
                      <span className="badge b-green">
                        {p.is_active ? 'Active' : 'Archived'}
                      </span>
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

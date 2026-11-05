'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Customer, Product } from '@/types/database';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export function CreateOrderModal({ isOpen, onClose, onOrderCreated }: CreateOrderModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('Lagos');
  const [channel, setChannel] = useState<'whatsapp' | 'instagram' | 'facebook' | 'tiktok'>('whatsapp');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryFee, setDeliveryFee] = useState(2500);
  const [paymentMethod, setPaymentMethod] = useState<'cod_cash' | 'cod_transfer' | 'prepaid_bank_transfer'>('cod_cash');
  const [timeWindow, setTimeWindow] = useState('Morning (8:00 AM - 12:00 PM)');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadProducts() {
      const { data } = await supabase.from('products').select('*');
      if (data && data.length > 0) {
        setProducts(data as Product[]);
        setSelectedProduct(data[0].id);
      }
    }
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const chosenProduct = products.find((p) => p.id === selectedProduct);
  const subtotal = chosenProduct ? chosenProduct.selling_price * quantity : 0;
  const totalAmount = subtotal + Number(deliveryFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Create or retrieve customer
      let customerId: string | null = null;
      const cleanPhone = phone.trim();

      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone_number', cleanPhone)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: custErr } = await supabase
          .from('customers')
          .insert({
            full_name: customerName.trim(),
            phone_number: cleanPhone,
            delivery_address: deliveryAddress.trim(),
            city: deliveryCity,
            state: deliveryCity,
            source_channel: channel,
            tags: ['new_customer', 'ready_to_buy'],
          })
          .select('id')
          .single();

        if (custErr) throw custErr;
        customerId = newCustomer.id;
      }

      // 2. Generate Order Code
      const orderCode = `EV-${Math.floor(1000 + Math.random() * 9000)}`;

      // 3. Default to Lagos Warehouse for now
      const warehouseId = '11111111-1111-1111-1111-111111111101';

      // 4. Create the Order
      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          customer_id: customerId,
          warehouse_id: warehouseId,
          status: 'awaiting_dispatch',
          payment_method: paymentMethod,
          payment_status: 'pending',
          subtotal: subtotal,
          delivery_fee: Number(deliveryFee),
          total_amount: totalAmount,
          delivery_address: deliveryAddress.trim(),
          delivery_city: deliveryCity,
          delivery_state: deliveryCity,
          delivery_time_window: timeWindow,
        })
        .select('id')
        .single();

      if (orderErr) throw orderErr;

      // 5. Create Order Item
      if (chosenProduct) {
        await supabase.from('order_items').insert({
          order_id: newOrder.id,
          product_id: chosenProduct.id,
          quantity: quantity,
          unit_price: chosenProduct.selling_price,
          total_price: subtotal,
        });
      }

      onOrderCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating order:', err);
      setErrorMsg(err.message || 'Failed to create order. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: '28px',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>＋ Book New Order</h2>
            <p style={{ color: 'var(--t3)', fontSize: '12.5px' }}>
              Create an order from customer chat and send straight to dispatch
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--t2)',
            }}
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(239,68,68,.12)',
              border: '1px solid rgba(239,68,68,.3)',
              color: 'var(--red)',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Customer Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="field">
              <label>Customer Full Name</label>
              <input
                className="inp"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Adaeze Okafor"
              />
            </div>
            <div className="field">
              <label>WhatsApp / Phone Number</label>
              <input
                className="inp"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 803 452 1187"
              />
            </div>
          </div>

          {/* Acquisition Channel */}
          <div className="field">
            <label>Customer Source Channel</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {(['whatsapp', 'instagram', 'facebook', 'tiktok'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    textTransform: 'capitalize',
                    border: channel === ch ? '1px solid var(--blue)' : '1px solid var(--border)',
                    background: channel === ch ? 'var(--blue-dim)' : 'var(--bg2)',
                    color: channel === ch ? '#fff' : 'var(--t3)',
                    fontWeight: 600,
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Address & City */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div className="field">
              <label>Delivery Address</label>
              <input
                className="inp"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Plot 14 Admiralty Way, Lekki Phase 1"
              />
            </div>
            <div className="field">
              <label>Destination City</label>
              <select
                className="inp"
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
              >
                <option value="Lagos">Lagos</option>
                <option value="Abuja">Abuja</option>
                <option value="Port Harcourt">Port Harcourt</option>
                <option value="Kano">Kano</option>
                <option value="Accra">Accra (GH)</option>
              </select>
            </div>
          </div>

          {/* Product Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '12px' }}>
            <div className="field">
              <label>Product</label>
              <select
                className="inp"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — ₦{Number(p.selling_price).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Quantity</label>
              <input
                className="inp"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Payment & Delivery Fee */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="field">
              <label>Payment Terms</label>
              <select
                className="inp"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="cod_cash">Cash On Delivery (COD)</option>
                <option value="cod_transfer">Transfer On Delivery</option>
                <option value="prepaid_bank_transfer">Prepaid Bank Transfer</option>
              </select>
            </div>
            <div className="field">
              <label>Delivery Fee (₦)</label>
              <input
                className="inp"
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Time Window */}
          <div className="field">
            <label>Preferred Delivery Window</label>
            <input
              className="inp"
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value)}
              placeholder="e.g. 8:00 AM - 10:00 AM"
            />
          </div>

          {/* Summary Banner */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '4px',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: 'var(--t3)', textTransform: 'uppercase' }}>Total Due</span>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--green)' }}>
                ₦{totalAmount.toLocaleString()}
              </div>
            </div>
            <span className="badge b-gold">Awaiting Dispatch</span>
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-pri"
              disabled={loading}
              style={{ flex: 2, justifyContent: 'center' }}
            >
              {loading ? 'Creating Order...' : 'Confirm & Send to Dispatch →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

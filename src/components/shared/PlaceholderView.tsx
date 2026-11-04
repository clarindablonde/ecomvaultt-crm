'use client';

import React from 'react';
import Link from 'next/link';

interface PlaceholderProps {
  title: string;
  description: string;
  actionText?: string;
}

export function PlaceholderView({ title, description, actionText = 'Back to Dashboard' }: PlaceholderProps) {
  return (
    <section className="page on">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>EcomVaultt</b> · Module
          </div>
          <h1 style={{ textTransform: 'capitalize' }}>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '640px', margin: '30px auto', textAlign: 'center', padding: '36px 20px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛠</div>
        <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{title} Module Connected</h3>
        <p style={{ color: 'var(--t3)', fontSize: '13px', maxWidth: '440px', margin: '0 auto 20px' }}>
          This route is configured with your Supabase schema and ready for full component implementation.
        </p>
        <Link href="/dashboard" className="btn btn-pri">
          ← {actionText}
        </Link>
      </div>
    </section>
  );
}

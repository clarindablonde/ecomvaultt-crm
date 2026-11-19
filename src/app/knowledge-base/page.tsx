'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { KnowledgeArticle } from '@/types/database';
import {
  BookOpen,
  Search,
  FileText,
  ShieldAlert,
  Truck,
  CreditCard,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react';

const FALLBACK_ARTICLES: KnowledgeArticle[] = [
  {
    id: '1',
    category: 'logistics',
    title: 'Standard Operating Procedure: Rider Same-Day Dispatch & Delivery Escalations',
    excerpt: 'Detailed workflow for assigning orders to Lagos and Abuja hubs, handling uncontactable customers, and recording delivery attempts.',
    read_time: '4 min read',
    updated_at: new Date(Date.now() - 604800000).toISOString(),
    content: `1. Order Verification: Before dispatching any rider, confirm customer availability by calling 30 minutes prior to departure.
2. In-Transit Delays: If a customer does not pick up at the location after 3 attempts, rider must log a "Delivery Attempt Failed" status in the Clarinda OS Dispatch portal.
3. Package Handover: Cash-On-Delivery packages must only be handed over after physical cash or instant bank transfer confirmation. Never leave parcels on promise to transfer later.`,
  },
  {
    id: '2',
    category: 'finance',
    title: 'Cash-on-Delivery (COD) Reconciliation & Daily Bank Remittance Policy',
    excerpt: 'Accounting controls for auditing cash held by dispatchers and confirming remittance into Zenith/Access accounts.',
    read_time: '3 min read',
    updated_at: new Date(Date.now() - 950400000).toISOString(),
    content: `1. Daily Cash Drop: All riders must remit cash collected from delivered COD orders before 6:30 PM daily at their respective warehouse hub.
2. Bank Transfer Verification: For customers paying via bank transfer on delivery, riders must demand payment receipt with valid session ID, confirmed by warehouse finance officer.
3. Audit Clearance: Once funds reflect in corporate bank statement, mark order as "Verified in Bank" in the Payments module.`,
  },
  {
    id: '3',
    category: 'sales',
    title: 'WhatsApp Sales Scripts: Handling Objections on Delivery Fees & Pricing',
    excerpt: 'High-converting objection handling playbooks for customer service representatives when closing WhatsApp leads.',
    read_time: '5 min read',
    updated_at: new Date(Date.now() - 345600000).toISOString(),
    content: `1. Objection: "Is delivery free to Port Harcourt?"
Response: "Hello lovely! All Lagos orders qualify for subsidised ₦2,000 same-day dispatch. For Port Harcourt, we offer insured air cargo at ₦3,500. However, if you purchase our Royal Velvet Suite Duo today, we cover your delivery 100% free!"

2. Objection: "Can I pay after testing the fragrance?"
Response: "Our products arrive factory sealed with holographic authenticity seals. You can inspect the intact packaging upon delivery with our dedicated rider before settling your payment!"`,
  },
  {
    id: '4',
    category: 'policy',
    title: 'Damaged Goods & Return Replacement Guidelines',
    excerpt: 'Customer satisfaction protocol for transit damage, broken perfume atomizers, and exchange authorization.',
    read_time: '3 min read',
    updated_at: new Date(Date.now() - 1209600000).toISOString(),
    content: `1. Reporting Window: Customers must notify customer support with photo/video evidence within 24 hours of package receipt.
2. Immediate Replacement: For verified transit leaks or broken glass, dispatch replacement immediately from the nearest regional warehouse hub at company expense.
3. Reverse Logistics: The rider collects the damaged unit for quality inspection logging.`,
  },
];

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setArticles(data as KnowledgeArticle[]);
      } else {
        setArticles(FALLBACK_ARTICLES);
      }
    } catch {
      setArticles(FALLBACK_ARTICLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();

    const channel = supabase
      .channel('realtime:knowledge_articles_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_articles' }, loadArticles)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredArticles = articles.filter((a) => {
    const matchesCat = activeCategory === 'all' || a.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.excerpt && a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <section className="page on" id="page-knowledge-base">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>TEAM</b> · SOPs & Playbooks
          </div>
          <h1>Knowledge Base & Standard Operating Procedures</h1>
          <p>Database documentation for company protocols, objection scripts, dispatch policies, and fulfillment rules.</p>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          background: 'var(--card)',
          padding: '12px 16px',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className={`btn btn-sm ${activeCategory === 'all' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setActiveCategory('all')}
          >
            All Guides ({articles.length})
          </button>
          <button
            className={`btn btn-sm ${activeCategory === 'logistics' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setActiveCategory('logistics')}
          >
            Rider Logistics
          </button>
          <button
            className={`btn btn-sm ${activeCategory === 'finance' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setActiveCategory('finance')}
          >
            COD & Finance
          </button>
          <button
            className={`btn btn-sm ${activeCategory === 'sales' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setActiveCategory('sales')}
          >
            Sales Scripts
          </button>
          <button
            className={`btn btn-sm ${activeCategory === 'policy' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setActiveCategory('policy')}
          >
            Policies
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input
            className="inp"
            placeholder="Search guides, SOPs, policies…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px', borderRadius: '8px', width: '100%' }}
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid g2" style={{ gap: '20px' }}>
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            className="card lift"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            onClick={() => setSelectedArticle(art)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  className={`badge ${
                    art.category === 'logistics'
                      ? 'b-gold'
                      : art.category === 'finance'
                      ? 'b-green'
                      : art.category === 'sales'
                      ? 'b-purple'
                      : 'b-blue'
                  }`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {art.category}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--t3)' }}>{art.read_time || '3 min read'}</span>
              </div>

              <b style={{ fontSize: '14px', color: 'var(--t1)', display: 'block', lineHeight: 1.4, marginBottom: '6px' }}>
                {art.title}
              </b>

              <p style={{ fontSize: '12.5px', color: 'var(--t3)', lineHeight: 1.5 }}>
                {art.excerpt}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--t3)' }}>
                {art.updated_at ? `Updated ${new Date(art.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : 'Updated recently'}
              </span>
              <span style={{ fontSize: '12.5px', color: 'var(--blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                Read Guide <ChevronRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '28px',
              background: 'var(--card-elevated)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="badge b-blue" style={{ textTransform: 'capitalize', marginBottom: '8px' }}>
                  {selectedArticle.category} SOP
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.3 }}>{selectedArticle.title}</h2>
                <span style={{ fontSize: '11.5px', color: 'var(--t3)', marginTop: '4px', display: 'block' }}>
                  {selectedArticle.read_time || '3 min read'}
                </span>
              </div>
              <button className="icon-btn" style={{ width: '32px', height: '32px' }} onClick={() => setSelectedArticle(null)}>
                <X size={15} />
              </button>
            </div>

            <div
              style={{
                fontSize: '13.5px',
                lineHeight: 1.8,
                color: 'var(--t2)',
                background: 'var(--bg-subtle)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                whiteSpace: 'pre-line',
              }}
            >
              {selectedArticle.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-pri" onClick={() => setSelectedArticle(null)}>
                Close SOP
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

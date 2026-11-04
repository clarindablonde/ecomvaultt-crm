'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  Zap,
  TrendingUp,
  ShieldCheck,
  Send,
} from 'lucide-react';

export default function AICoachPage() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [testScenario, setTestScenario] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [generating, setGenerating] = useState(false);

  const scripts = [
    {
      title: 'High-Ticket Bundle Confirmation (Skin Repair + Duchess White)',
      category: 'Closing Script',
      text: 'Perfect ma! 🎉 That’s the Skin Repair Set + Duchess White Luxury Cream = ₦79,900, with pay-on-delivery included. We have your order reserved and scheduled for delivery tomorrow. Could you kindly confirm your street address and active phone number for the rider?',
    },
    {
      title: 'Handling Price / "It’s Too Expensive" Objection',
      category: 'Objection Handling',
      text: 'I completely understand ma! Quality skincare is an investment in your skin health. Clarinda Blonde formulations use imported medical-grade organic actives with zero harmful steroids or hydroquinone. Most clients spend twice as much trying 5 different ineffective creams before switching to us and getting living marble skin within 14 days.',
    },
    {
      title: 'Instant Upsell: Add CB Moroccan Whitening Soap (+₦6,500)',
      category: 'Upsell / Order Value Boost',
      text: 'Before I dispatch your package ma, our Moroccan Clarifying Herbal Soap is on special promo today for just ₦6,500 (usually ₦9,500). When used together with your cream, it clears dead skin cells so the cream absorbs 3x faster. Should I pack one inside your box?',
    },
    {
      title: 'COD Delivery Reassurance (Trust & Fake Product Fears)',
      category: 'Trust Building',
      text: 'No worries at all ma! You do not need to pay anything upfront. Our dedicated dispatch rider will deliver the sealed box directly to your doorstep. You can inspect the holographic security seal and packaging before making payment via cash or instant transfer.',
    },
    {
      title: 'Re-engagement: Inactive / Abandoned Cart Follow-up',
      category: 'Retargeting',
      text: 'Hello ma! Just checking in on your radiant skin routine. We noticed you were interested in the Snow White Set yesterday. We have only 4 units remaining in our Lagos warehouse for dispatch today. Would you like me to reserve a set for you with free delivery?',
    },
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2500);
  };

  const handleGenerateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testScenario.trim()) return;

    setGenerating(true);
    setTimeout(() => {
      setGeneratedScript(
        `Hello ma! Thank you so much for reaching out to Clarinda Blonde. Regarding your concern about "${testScenario.trim()}", our certified skincare formulation is designed specifically for your skin tone without any irritation. We guarantee visible radiance in 10-14 days, and you can pay conveniently on delivery. Can I confirm your delivery city to check rider availability for you today?`
      );
      setGenerating(false);
    }, 400);
  };

  return (
    <section className="page on" id="page-ai">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>Intelligence OS</b> · AI Sales Coach
          </div>
          <h1>AI Sales Coach & Objection Playbook</h1>
          <p>
            Battle-tested WhatsApp high-conversion objection handling scripts and instant reply generators for sales reps.
          </p>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid g4" style={{ marginBottom: '24px' }}>
        <div className="card kpi purple lift">
          <div className="lbl">
            <span>Average Conversion Lift</span>
            <TrendingUp size={14} color="var(--purple)" />
          </div>
          <div className="val">+38.5%</div>
          <span className="chg up">With AI-suggested chips</span>
        </div>

        <div className="card kpi green lift">
          <div className="lbl">
            <span>Verified Scripts</span>
            <ShieldCheck size={14} color="var(--green)" />
          </div>
          <div className="val">12</div>
          <span className="chg up">Clarinda Blonde approved</span>
        </div>

        <div className="card kpi gold lift">
          <div className="lbl">
            <span>Upsell Acceptance</span>
            <Zap size={14} color="var(--gold)" />
          </div>
          <div className="val">42%</div>
          <span className="chg">Moroccan Soap add-ons</span>
        </div>

        <div className="card kpi lift">
          <div className="lbl">
            <span>Response Velocity</span>
            <Sparkles size={14} color="var(--blue)" />
          </div>
          <div className="val">&lt; 90s</div>
          <span className="chg up">First reply speed</span>
        </div>
      </div>

      <div className="grid g23">
        {/* Left: High-Conversion Script Playbook */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ marginBottom: '6px' }}>
            <h3 style={{ fontSize: '16px', color: '#FFFFFF', marginBottom: '2px' }}>
              Standard WhatsApp Closing Playbook
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--t3)' }}>
              Click "Copy Script" to immediately paste into customer WhatsApp chats
            </span>
          </div>

          {scripts.map((script, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="badge b-purple" style={{ fontSize: '10.5px' }}>
                  {script.category}
                </span>
                <button
                  className="btn btn-sm btn-sec"
                  style={{ gap: '6px', fontSize: '11.5px', color: copiedIdx === idx ? 'var(--green)' : 'var(--t1)' }}
                  onClick={() => handleCopy(script.text, idx)}
                >
                  {copiedIdx === idx ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedIdx === idx ? 'Copied to Clipboard!' : 'Copy Script'}</span>
                </button>
              </div>

              <b style={{ fontSize: '14px', color: '#FFFFFF', display: 'block', marginBottom: '8px' }}>
                {script.title}
              </b>

              <p style={{ fontSize: '13px', color: 'var(--t2)', lineHeight: 1.5, margin: 0, background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {script.text}
              </p>
            </div>
          ))}
        </div>

        {/* Right: Custom AI Objection Generator */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sparkles size={18} color="var(--purple)" />
            <h3 style={{ fontSize: '15px', margin: 0 }}>Instant AI Objection Solver</h3>
          </div>

          <p style={{ color: 'var(--t3)', fontSize: '12px', marginBottom: '16px', lineHeight: 1.45 }}>
            Type any customer objection or question below to generate a polite, high-converting WhatsApp reply.
          </p>

          <form onSubmit={handleGenerateCustom} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="field">
              <label>Customer Objection or Message</label>
              <textarea
                className="inp"
                rows={4}
                value={testScenario}
                onChange={(e) => setTestScenario(e.target.value)}
                placeholder="e.g. She says she has dark spots on her knuckles and is afraid the cream will bleach her skin white."
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-pri"
              disabled={generating || !testScenario.trim()}
              style={{ gap: '6px', justifyContent: 'center' }}
            >
              <Sparkles size={14} />
              <span>{generating ? 'Crafting Reply…' : 'Generate Objection Script'}</span>
            </button>
          </form>

          {generatedScript && (
            <div
              style={{
                marginTop: '20px',
                background: 'var(--bg-subtle)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--border2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <b style={{ fontSize: '12px', color: 'var(--purple)' }}>AI Generated Response:</b>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ gap: '4px', fontSize: '11px' }}
                  onClick={() => handleCopy(generatedScript, 99)}
                >
                  {copiedIdx === 99 ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
                  <span>{copiedIdx === 99 ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--t1)', lineHeight: 1.5, margin: 0 }}>
                {generatedScript}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

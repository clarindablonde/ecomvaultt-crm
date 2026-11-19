'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { DiscussionChannel, DiscussionMessage } from '@/types/database';
import {
  MessagesSquare,
  Send,
  Hash,
  Users,
  Search,
  Bell,
  CheckCheck,
  Pin,
  Clock,
  Plus,
} from 'lucide-react';

const FALLBACK_CHANNELS: DiscussionChannel[] = [
  { id: 'general-ops', name: 'general-ops', description: 'Company announcements & general staff updates' },
  { id: 'dispatch-alerts', name: 'dispatch-alerts', description: 'Rider delays, failed addresses & transit notes' },
  { id: 'vip-escalations', name: 'vip-escalations', description: 'High-value customer requests & urgent changes' },
  { id: 'shift-handover', name: 'shift-handover', description: 'Morning / evening sales rep order handovers' },
];

const FALLBACK_MESSAGES: DiscussionMessage[] = [
  {
    id: '1',
    channel_id: 'dispatch-alerts',
    author: 'Tunde Dispatch',
    author_role: 'Lagos Fleet Lead',
    avatar_color: 'a2',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    content: '🚨 Notice: Heavy traffic along Lekki-Epe expressway due to road maintenance. Riders assigned to Ajah and Sangotedo deliveries might experience a 30-45 minute delay.',
    is_pinned: true,
  },
  {
    id: '2',
    channel_id: 'dispatch-alerts',
    author: 'Clarinda O.',
    author_role: 'Administrator',
    avatar_color: 'a1',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    content: 'Thanks for the update Tunde. Please let customer service know so we can send proactive WhatsApp notifications to the 6 customers in that delivery zone.',
  },
  {
    id: '3',
    channel_id: 'vip-escalations',
    author: 'Sarah Rep',
    author_role: 'Sales Specialist',
    avatar_color: 'a4',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    content: 'Chief Kenneth Okoli just requested an additional Duchess White 50ml added to his order #ORD-8821. Added the item and confirmed updated total ₦108,000.',
  },
  {
    id: '4',
    channel_id: 'shift-handover',
    author: 'Fatima Rep',
    author_role: 'Customer Rep',
    avatar_color: 'a3',
    created_at: new Date(Date.now() - 14400000).toISOString(),
    content: 'Morning shift started! All 14 pending morning inquiries have been answered. 8 converted to orders and dispatched to Ikeja warehouse.',
  },
];

export default function DiscussionPage() {
  const [channels, setChannels] = useState<DiscussionChannel[]>(FALLBACK_CHANNELS);
  const [activeChannel, setActiveChannel] = useState('dispatch-alerts');
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const loadDiscussion = async () => {
    try {
      const [chRes, msgRes] = await Promise.all([
        supabase.from('discussion_channels').select('*'),
        supabase.from('discussion_messages').select('*').order('created_at', { ascending: true }),
      ]);

      if (chRes.data && chRes.data.length > 0) {
        setChannels(chRes.data as DiscussionChannel[]);
      } else {
        setChannels(FALLBACK_CHANNELS);
      }

      if (msgRes.data && msgRes.data.length > 0) {
        setMessages(msgRes.data as DiscussionMessage[]);
      } else {
        setMessages(FALLBACK_MESSAGES);
      }
    } catch {
      setChannels(FALLBACK_CHANNELS);
      setMessages(FALLBACK_MESSAGES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscussion();

    const channel = supabase
      .channel('realtime:discussion_chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discussion_messages' }, () => {
        loadDiscussion();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  const currentMessages = messages.filter(
    (m) => m.channel_id === activeChannel || m.is_pinned
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const msgPayload = {
      channel_id: activeChannel,
      author: profile?.full_name || 'Clarinda O.',
      author_role: profile?.role ? profile.role.replace(/_/g, ' ') : 'Administrator',
      avatar_color: profile?.avatar_color || 'a1',
      content: newMsg.trim(),
      is_pinned: false,
    };

    try {
      const { data, error } = await supabase.from('discussion_messages').insert([msgPayload]).select();
      if (!error && data && data.length > 0) {
        setMessages([...messages, data[0] as DiscussionMessage]);
      } else {
        setMessages([...messages, { id: Date.now().toString(), ...msgPayload, created_at: new Date().toISOString() }]);
      }
    } catch {
      setMessages([...messages, { id: Date.now().toString(), ...msgPayload, created_at: new Date().toISOString() }]);
    }

    setNewMsg('');
  };

  const channelObj = channels.find((c) => c.id === activeChannel) || channels[0] || FALLBACK_CHANNELS[0];

  return (
    <section className="page on" id="page-discussion">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>TEAM</b> · Internal Communication
          </div>
          <h1>Team Discussion & Shift Handover</h1>
          <p>Collaborate across warehouse managers, dispatch fleet, and sales reps in real-time database channels.</p>
        </div>
      </div>

      {/* Discussion Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '20px',
          height: 'calc(100vh - 220px)',
          minHeight: '520px',
        }}
      >
        {/* Channels Sidebar */}
        <div
          className="card"
          style={{
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px 10px', borderBottom: '1px solid var(--border)' }}>
            <b style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--t3)', letterSpacing: '0.05em' }}>
              Channels
            </b>
            <span className="badge b-blue" style={{ fontSize: '10px' }}>{channels.length} channels</span>
          </div>

          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeChannel === ch.id ? 'var(--blue-dim)' : 'transparent',
                color: activeChannel === ch.id ? 'var(--blue)' : 'var(--t2)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: activeChannel === ch.id ? 600 : 450,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hash size={15} color={activeChannel === ch.id ? 'var(--blue)' : 'var(--t3)'} />
                <span style={{ fontSize: '13px' }}>{ch.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Message Thread Panel */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
          }}
        >
          {/* Channel Header */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-subtle)',
            }}
          >
            <div>
              <b style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash size={16} color="var(--blue)" /> {channelObj.name}
              </b>
              <p style={{ fontSize: '11.5px', color: 'var(--t3)', marginTop: '2px' }}>
                {channelObj.description}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--t3)' }}>
              <Users size={14} /> Live Realtime Chat
            </div>
          </div>

          {/* Messages Feed */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {currentMessages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  padding: m.is_pinned ? '12px 14px' : '0',
                  borderRadius: m.is_pinned ? '10px' : '0',
                  background: m.is_pinned ? 'var(--blue-dim)' : 'transparent',
                  border: m.is_pinned ? '1px solid var(--card-border-active)' : 'none',
                }}
              >
                <div className={`av ${m.avatar_color || 'a1'}`} style={{ width: '34px', height: '34px', fontSize: '11px' }}>
                  {m.author.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <b style={{ fontSize: '13px', color: 'var(--t1)' }}>{m.author}</b>
                    <span className="badge b-gray" style={{ fontSize: '10px', padding: '1px 6px' }}>
                      {m.author_role}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} />{' '}
                      {m.created_at
                        ? new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : 'Just now'}
                    </span>
                    {m.is_pinned && (
                      <span style={{ fontSize: '10.5px', color: 'var(--blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}>
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--t2)', lineHeight: 1.5 }}>{m.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '10px',
              background: 'var(--bg-subtle)',
            }}
          >
            <input
              className="inp"
              placeholder={`Post to #${channelObj.name}…`}
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              style={{ flex: 1, height: '40px' }}
            />
            <button type="submit" className="btn btn-pri" style={{ padding: '0 18px', height: '40px' }}>
              <Send size={14} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

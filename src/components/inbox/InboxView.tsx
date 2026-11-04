'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Conversation, Message, Customer } from '@/types/database';
import { CreateOrderModal } from '@/components/orders/CreateOrderModal';

export function InboxView() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [showCoach, setShowCoach] = useState(true);
  const [filterChannel, setFilterChannel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // 1. Fetch conversations list
  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, customer:customers(*)')
        .order('last_message_at', { ascending: false });

      if (data && data.length > 0) {
        setConversations(data as Conversation[]);
        if (!activeConvId) {
          setActiveConvId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  // 2. Fetch messages for active conversation
  const fetchMessages = async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data as Message[]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Subscribe to new inbound/outbound messages across all conversations
    const messageChannel = supabase
      .channel('realtime:inbox_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.conversation_id === activeConvId) {
          setMessages((prev) => [...prev, newMsg]);
        }
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [activeConvId]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);

      // Automatically clear unread count for the active conversation in DB and local state
      supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', activeConvId)
        .then(() => {
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConvId ? { ...c, unread_count: 0 } : c))
          );
        });
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!inputMsg.trim() || !activeConvId) return;
    const body = inputMsg.trim();
    setInputMsg('');

    // Optimistic UI update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId,
      sender_type: 'rep',
      body,
      is_voice_note: false,
      is_edited: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await supabase.from('messages').insert({
        conversation_id: activeConvId,
        sender_type: 'rep',
        body,
      });

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: body,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', activeConvId);
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const activeCustomer = activeConversation?.customer as Customer | undefined;

  const filteredConversations = conversations.filter((c) => {
    const matchesChannel = filterChannel === 'all' || c.channel === filterChannel;
    const matchesSearch =
      searchQuery === '' ||
      c.customer?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer?.phone_number.includes(searchQuery) ||
      c.last_message?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  return (
    <section className="page full on" id="page-inbox" style={{ height: 'calc(100vh - 58px)' }}>
      <div className="wa" id="waShell">
        {/* Left Chat List */}
        <div className="wa-list">
          <div className="wa-list-head">
            <div className="av a2 sm">CL</div>
            <b>Omnichannel Inbox</b>
            <span className="wa-tag wt-ai">✦ Live Realtime</span>
          </div>

          <div className="wa-search">
            ⌕
            <input
              placeholder="Search chats, messages, phone numbers…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="wa-filters">
            <button
              className={filterChannel === 'all' ? 'on' : ''}
              onClick={() => setFilterChannel('all')}
            >
              All ({conversations.length})
            </button>
            <button
              className={filterChannel === 'whatsapp' ? 'on' : ''}
              onClick={() => setFilterChannel('whatsapp')}
            >
              WhatsApp
            </button>
            <button
              className={filterChannel === 'instagram' ? 'on' : ''}
              onClick={() => setFilterChannel('instagram')}
            >
              Instagram
            </button>
            <button
              className={filterChannel === 'tiktok' ? 'on' : ''}
              onClick={() => setFilterChannel('tiktok')}
            >
              TikTok
            </button>
          </div>

          <div className="wa-chats">
            {filteredConversations.map((conv) => {
              const cust = conv.customer as Customer;
              const isSelected = conv.id === activeConvId;

              return (
                <div
                  key={conv.id}
                  className={`wa-chat ${isSelected ? 'on' : ''}`}
                  onClick={() => setActiveConvId(conv.id)}
                >
                  <div className="av a3">
                    {cust?.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || 'CU'}
                  </div>
                  <div className="meta">
                    <div className="r1">
                      <b>{cust?.full_name || 'Customer'}</b>
                      <span className={conv.unread_count > 0 ? 'new' : ''}>
                        {new Date(conv.last_message_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="r2">
                      <p>{conv.last_message || 'No messages yet'}</p>
                      {conv.unread_count > 0 && <span className="ub">{conv.unread_count}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                      <span
                        className={`wa-tag ${
                          conv.channel === 'instagram'
                            ? 'wt-ig'
                            : conv.channel === 'facebook'
                            ? 'wt-fb'
                            : conv.channel === 'tiktok'
                            ? 'wt-tt'
                            : 'wt-wa'
                        }`}
                      >
                        {conv.channel}
                      </span>
                      {conv.priority_flag && (
                        <span
                          className="wa-tag"
                          style={{
                            background:
                              conv.priority_flag === 'ready_to_buy'
                                ? 'rgba(34,197,94,.15)'
                                : conv.priority_flag === 'at_risk'
                                ? 'rgba(239,68,68,.18)'
                                : 'rgba(244,180,0,.15)',
                            color:
                              conv.priority_flag === 'ready_to_buy'
                                ? '#4ADE80'
                                : conv.priority_flag === 'at_risk'
                                ? '#FCA5A5'
                                : '#FCD34D',
                          }}
                        >
                          {conv.priority_flag.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Conversation */}
        <div className="wa-conv">
          {activeCustomer ? (
            <>
              <div className="wa-conv-head">
                <div className="av a3">
                  {activeCustomer.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="nm">
                  <b>{activeCustomer.full_name}</b>
                  <span>online · active session</span>
                </div>
                <div className="acts">
                  <a
                    className="wa-ic"
                    href={`https://wa.me/${activeCustomer.phone_number.replace(/\+/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open WhatsApp directly"
                    style={{ background: 'rgba(37,211,102,.15)', color: 'var(--wa-accent)' }}
                  >
                    ✆
                  </a>
                  <button
                    className="wa-ic"
                    title="Convert to Order"
                    style={{ background: 'rgba(37,211,102,.15)', color: 'var(--wa-accent)' }}
                    onClick={() => setIsOrderModalOpen(true)}
                  >
                    🧾
                  </button>
                </div>
              </div>

              {/* Message Feed */}
              <div className="wa-msgs">
                <div className="wa-day">Conversation History</div>
                {loadingMsgs ? (
                  <div style={{ textAlign: 'center', color: 'var(--t3)', padding: '20px' }}>
                    Loading messages...
                  </div>
                ) : (
                  messages.map((m) => {
                    if (m.sender_type === 'system') {
                      return (
                        <div key={m.id} className="msg ai-note">
                          {m.body}
                        </div>
                      );
                    }
                    const isOut = m.sender_type === 'rep';
                    return (
                      <div key={m.id} className={`msg ${isOut ? 'out' : 'in'}`}>
                        {isOut && <span className="who">You · Rep</span>}
                        <span>{m.body}</span>
                        <div className="mt">
                          <span>
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isOut && <span className="tick">✓✓</span>}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* AI Sales Coach Suggestions */}
              {showCoach && (
                <div className="ai-coach">
                  <div className="hd">
                    <span>✦ AI Sales Coach</span>
                    <span className="coach-meta">smart conversion chips</span>
                    <button
                      className="coach-x"
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => setShowCoach(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="chips">
                    <button
                      className="chip"
                      onClick={() =>
                        setInputMsg(
                          'Perfect ma! 🎉 That’s the Skin Repair Set + Duchess White = ₦79,900, pay on delivery. I’ll book delivery for tomorrow. Can I confirm your address please?'
                        )
                      }
                    >
                      ✓ Confirm bundle ₦79,900
                    </button>
                    <button
                      className="chip"
                      onClick={() =>
                        setInputMsg(
                          'Would you like to add our Glow Clarifying Soap for just ₦6,500? It enhances results with the Skin Repair Set!'
                        )
                      }
                    >
                      ＋ Upsell: Glow Soap ₦6,500
                    </button>
                    <button
                      className="chip"
                      onClick={() => setIsOrderModalOpen(true)}
                    >
                      🧾 Convert to order
                    </button>
                  </div>
                </div>
              )}

              {/* Input Bar */}
              <div className="wa-input">
                <button className="wa-ic" title="Attach file">
                  ＋
                </button>
                <input
                  placeholder="Type a message… ( / for quick replies )"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                />
                <button className="wa-send" onClick={handleSendMessage}>
                  ➤
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--t3)' }}>
              Select a conversation to start chatting
            </div>
          )}
        </div>

        {/* Right Customer 360 Sidebar */}
        {activeCustomer && (
          <div className="wa-crm">
            <div style={{ textAlign: 'center', paddingBottom: '6px' }}>
              <div className="av a3 lg" style={{ margin: '0 auto 10px' }}>
                {activeCustomer.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <b style={{ fontSize: '15px', color: '#E9EDEF' }}>{activeCustomer.full_name}</b>
              <div style={{ fontSize: '12px', color: '#8696A0' }} className="mono">
                {activeCustomer.phone_number}
              </div>
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                <span className="wa-tag" style={{ background: 'rgba(244,180,0,.2)', color: '#FCD34D' }}>
                  Health: {activeCustomer.health_score || 85}/100
                </span>
                {activeCustomer.instagram_handle && (
                  <span className="wa-tag wt-ig">{activeCustomer.instagram_handle}</span>
                )}
              </div>
            </div>

            <h4>Customer Metrics</h4>
            <div className="card-dark">
              <div className="crm-row">
                <span>Lifetime Revenue</span>
                <b className="mono">₦{Number(activeCustomer.lifetime_spend || 0).toLocaleString()}</b>
              </div>
              <div className="crm-row">
                <span>Orders Fulfilled</span>
                <b className="mono">{activeCustomer.lifetime_orders || 0}</b>
              </div>
              <div className="crm-row">
                <span>Preferred Channel</span>
                <b style={{ textTransform: 'capitalize' }}>{activeCustomer.source_channel || 'WhatsApp'}</b>
              </div>
            </div>

            <h4 style={{ marginTop: '16px' }}>Delivery Address</h4>
            <div className="card-dark" style={{ fontSize: '12.5px', color: '#AEBAC1', lineHeight: 1.4 }}>
              {activeCustomer.delivery_address || 'No address saved yet'}
              {activeCustomer.city && <div style={{ color: 'var(--t3)', marginTop: '4px' }}>City: {activeCustomer.city}</div>}
            </div>

            <button
              className="btn btn-pri"
              style={{ width: '100%', justifyContent: 'center', marginTop: '18px', padding: '10px' }}
              onClick={() => setIsOrderModalOpen(true)}
            >
              🧾 Book Order for Customer
            </button>
          </div>
        )}
      </div>

      {/* Convert to Order Modal */}
      <CreateOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onOrderCreated={() => {
          fetchConversations();
        }}
      />
    </section>
  );
}

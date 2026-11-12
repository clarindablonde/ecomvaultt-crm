import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Helper to lazily instantiate Supabase admin client
function getSupabaseClient() {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fxkidmxnjwzqolenswdk.supabase.co').trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RDKWGjTMxv9e_pHzrWsCfg_lX4Jk_R9').trim();
  return createClient(url, key);
}

// WhatsApp Verify Token for Meta Webhook setup
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'ecomvaultt_cb_secret_token_live';

/**
 * 1. Webhook Verification (Meta WhatsApp Cloud API Handshake)
 * Meta makes a GET request with hub.mode, hub.verify_token, and hub.challenge
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Handshake verified successfully with Meta');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

/**
 * 2. Inbound Message Handler
 * Meta posts inbound customer WhatsApp messages here in real time.
 * We extract the sender's phone, name, and message, match or create
 * the customer and conversation in Supabase, and insert the message.
 * This instantly triggers Supabase WebSockets to stream to reps' screens in /inbox.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify WhatsApp message payload structure
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messageData = value?.messages?.[0];

    if (!messageData) {
      // Could be a status receipt (delivered, read), acknowledge with 200 OK
      return NextResponse.json({ status: 'ignored_or_status_ack' }, { status: 200 });
    }

    const fromPhone = messageData.from; // e.g. "2348030000000"
    const formattedPhone = fromPhone.startsWith('+') ? fromPhone : `+${fromPhone}`;
    const contactProfile = value?.contacts?.[0]?.profile?.name || 'WhatsApp Customer';
    const messageText =
      messageData.text?.body ||
      (messageData.type === 'image' ? '[Customer sent an image]' : '[Customer sent media]');

    console.log(`[WhatsApp Inbound] Received message from ${formattedPhone}: "${messageText}"`);

    const supabase = getSupabaseClient();

    // 1. Find or create customer by phone number
    let { data: customer } = await supabase
      .from('customers')
      .select('id, full_name')
      .eq('phone_number', formattedPhone)
      .maybeSingle();

    if (!customer) {
      const { data: newCustomer, error: custErr } = await supabase
        .from('customers')
        .insert({
          full_name: contactProfile,
          phone_number: formattedPhone,
          source_channel: 'whatsapp',
          health_score: 85,
          tags: ['new_lead', 'whatsapp'],
          lifetime_orders: 0,
          lifetime_spend: 0,
        })
        .select('id, full_name')
        .single();

      if (custErr) throw custErr;
      customer = newCustomer;
    }

    // 2. Find or create active conversation for this customer
    let { data: conv } = await supabase
      .from('conversations')
      .select('id, unread_count')
      .eq('customer_id', customer.id)
      .maybeSingle();

    if (!conv) {
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          customer_id: customer.id,
          channel: 'whatsapp',
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          unread_count: 1,
          priority_flag: 'ready_to_buy',
        })
        .select('id, unread_count')
        .single();

      if (convErr) throw convErr;
      conv = newConv;
    } else {
      // Update last message and increment unread count
      await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          unread_count: (conv.unread_count || 0) + 1,
        })
        .eq('id', conv.id);
    }

    // 3. Insert inbound message into Supabase
    // Because Realtime is enabled on 'messages', this immediately triggers the
    // WebSocket channel in /inbox, displaying the new message live on every rep's screen!
    const { error: msgErr } = await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_type: 'customer',
      body: messageText,
      is_voice_note: messageData.type === 'audio',
      is_edited: false,
    });

    if (msgErr) throw msgErr;

    return NextResponse.json({ success: true, message: 'Message routed to live inbox' }, { status: 200 });
  } catch (err: any) {
    console.error('[WhatsApp Webhook Error]:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}

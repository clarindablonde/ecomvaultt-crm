export type UserRole =
  | 'super_admin'
  | 'representative'
  | 'logistics_officer'
  | 'finance'
  | 'warehouse_manager';

export type ChannelType =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'phone'
  | 'walk_in';

export type OrderStatus =
  | 'in_conversation'
  | 'confirmed'
  | 'awaiting_dispatch'
  | 'out_for_delivery'
  | 'delivered_paid'
  | 'transferred_to_bank'
  | 'failed_unreachable'
  | 'failed_cancelled'
  | 'rescheduled';

export type PaymentMethod =
  | 'cod_cash'
  | 'cod_transfer'
  | 'prepaid_bank_transfer'
  | 'prepaid_paystack'
  | 'prepaid_flutterwave';

export type PaymentStatus =
  | 'pending'
  | 'holding_by_dispatcher'
  | 'transferred_to_bank'
  | 'verified_by_finance'
  | 'refunded';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_code: string;
  avatar_color: string;
  phone_number?: string;
  is_online: boolean;
  last_seen_at?: string;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  state_city: string;
  address?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  description?: string;
  selling_price: number;
  cost_price: number;
  nafdac_reg_number?: string;
  image_url?: string;
  is_active: boolean;
}

export interface InventoryItem {
  id: string;
  warehouse_id: string;
  product_id: string;
  stock_on_hand: number;
  stock_reserved: number;
  reorder_threshold: number;
  product?: Product;
  warehouse?: Warehouse;
}

export interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  alternate_phone?: string;
  email?: string;
  instagram_handle?: string;
  delivery_address?: string;
  city?: string;
  state?: string;
  health_score: number;
  tags: string[];
  source_channel: ChannelType;
  lifetime_orders: number;
  lifetime_spend: number;
  last_purchase_date?: string;
  notes?: string;
}

export interface Order {
  id: string;
  order_code: string;
  customer_id: string;
  assigned_rep_id?: string;
  warehouse_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_scheduled_for?: string;
  delivery_time_window?: string;
  follow_up_note?: string;
  created_at: string;
  customer?: Customer;
  warehouse?: Warehouse;
  assigned_rep?: Profile;
}

export interface Conversation {
  id: string;
  customer_id: string;
  assigned_rep_id?: string;
  channel: ChannelType;
  last_message?: string;
  last_message_at: string;
  unread_count: number;
  priority_flag?: string;
  customer?: Customer;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'rep' | 'ai' | 'system';
  sender_id?: string;
  body: string;
  media_url?: string;
  is_voice_note: boolean;
  voice_transcript?: string;
  is_edited: boolean;
  edited_at?: string;
  ai_coaching_suggestion?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  code?: string;
  title: string;
  category: 'logistics' | 'packaging' | 'marketing' | 'warehousing' | 'utilities' | string;
  amount: number;
  paid_via?: string;
  warehouse_id?: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  recorded_by?: string;
  expense_date?: string;
  notes?: string;
  created_at?: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  channel: string;
  audience_size: number;
  delivery_rate: string;
  click_rate: string;
  orders_generated: number;
  revenue: number;
  status: 'active' | 'completed' | 'scheduled' | string;
  created_at?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  description?: string;
  min_order_amount?: number;
  usage_count: number;
  is_active: boolean;
  created_at?: string;
}

export interface DiscussionChannel {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface DiscussionMessage {
  id: string;
  channel_id: string;
  author: string;
  author_role: string;
  avatar_color: string;
  content: string;
  is_pinned?: boolean;
  created_at: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'logistics' | 'finance' | 'sales' | 'policy' | string;
  excerpt?: string;
  content: string;
  read_time?: string;
  updated_at?: string;
  created_at?: string;
}

export interface StaffMember {
  id: string;
  profile_id?: string;
  name: string;
  role: string;
  department: 'Operations' | 'Sales' | 'Logistics' | 'Executive' | string;
  hub: string;
  phone: string;
  status: 'Active' | 'On Delivery' | 'Offline' | string;
  rating: number;
  avatar_color: string;
  created_at?: string;
}

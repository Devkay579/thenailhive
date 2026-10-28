export type BookingStatus =
  | "pending_payment"
  | "deposit_paid"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type ServicePriceRow = {
  id: string;
  service_id: string;
  length_label: string;
  price_ngn: number;
  duration_minutes: number;
  active: boolean;
  sort_order: number;
};

export type AddonRow = {
  id: string;
  name: string;
  price_ngn: number;
  suffix: string | null;
  category: string;
  active: boolean;
  sort_order: number;
};

export type GalleryMediaType = "image" | "video";

export type GalleryItemRow = {
  id: string;
  category: string;
  title: string;
  image_url: string | null;
  media_type: GalleryMediaType;
  service_slug: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type ClientRow = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  created_at: string;
};

export type PaymentMethod = "bank_transfer" | "cash" | "pos" | "other";

export type BookingRow = {
  id: string;
  booking_ref: string;
  client_id: string;
  service_id: string;
  service_price_id: string | null;
  followup_service_price_id: string | null;
  addon_ids: string[];
  booking_date: string;
  start_time: string;
  end_time: string;
  subtotal_ngn: number;
  deposit_ngn: number;
  balance_ngn: number;
  status: BookingStatus;
  inspiration_image_urls: string[];
  policy_accepted_at: string | null;
  deposit_paid_at: string | null;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessHoursRow = {
  weekday: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

export type BlockedSlotRow = {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
};

export type ReviewRow = {
  id: string;
  client_id: string | null;
  author_name: string;
  rating: number;
  body: string;
  image_url: string | null;
  approved: boolean;
  created_at: string;
};

export type SettingsRow = {
  id: 1;
  deposit_percent: number;
  late_fee_ngn: number;
  policy_text: string;
  whatsapp_number: string;
  phone_display: string;
  instagram_handle: string;
  tiktok_handle: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  nail_art_image_url: string | null;
  about_content: unknown;
  updated_at: string;
};

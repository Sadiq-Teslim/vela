export type InvoiceStatus = "DRAFT" | "SENT" | "PENDING" | "PAID" | "OVERDUE";

export type FollowUpType = "reminder_before" | "due_date" | "overdue";

// Application-level types (used in components, not Supabase generics)
export type PdfTheme = "light" | "dark";

export interface Profile {
  id: string;
  email: string;
  name: string;
  business_name: string | null;
  raenest_wallet: string | null;
  pdf_theme: PdfTheme;
  created_at: string;
}

export interface LineItem {
  label: string;
  amount: number;
  qty: number;
}

export interface Invoice {
  id: string;
  number: string;
  user_id: string;
  client_name: string;
  client_email: string;
  job_description: string;
  line_items: LineItem[];
  total: number;
  currency: string;
  due_date: string;
  status: InvoiceStatus;
  payment_tx_hash: string | null;
  pdf_url: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface ContractContent {
  scope_of_work: string;
  payment_schedule: string;
  revision_policy: string;
  kill_fee: string;
  ip_ownership: string;
  governing_law: string;
  confidentiality: string;
}

export interface Contract {
  id: string;
  invoice_id: string;
  content: ContractContent;
  accepted: boolean;
  accepted_at: string | null;
  created_at: string;
}

export interface FollowUp {
  id: string;
  invoice_id: string;
  type: FollowUpType;
  sent_at: string | null;
  job_id: string | null;
  created_at: string;
}

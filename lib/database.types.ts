export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DeactivationReason =
  | "desligamento"
  | "pedido de baixa"
  | "a pedido"
  | "dever";

export type WithdrawalStatus = "completed" | "deletion_requested" | "cancelled";
export type CancellationStatus = "pending" | "approved" | "rejected";
export type PaymentStatus =
  | "pending"
  | "approved"
  | "rejected_divergent"
  | "rejected_unpaid";

type ProfilesRow = {
  id: string;
  full_name: string;
  document: string;
  role: "user" | "admin";
  is_active: boolean;
  deactivation_reason: DeactivationReason | null;
  must_change_password: boolean;
  created_at: string;
};

type LocationsRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

type ProductsRow = {
  id: string;
  name: string;
  is_active: boolean;
  category: string | null;
  image_url: string | null;
  price: number;
  promo_price: number | null;
  created_at: string;
};

type InventoryRow = {
  id: string;
  location_id: string;
  product_id: string;
  quantity: number;
};

type WithdrawalsRow = {
  id: string;
  user_id: string;
  product_id: string;
  location_id: string;
  unit_price_at_withdrawal: number;
  quantity: number;
  status: WithdrawalStatus;
  payment_id: string | null;
  created_at: string;
};

type WithdrawalCancellationRequestsRow = {
  id: string;
  withdrawal_id: string;
  user_id: string;
  reason: string | null;
  status: CancellationStatus;
  reviewed_by: string | null;
  created_at: string;
};

type PaymentsRow = {
  id: string;
  user_id: string;
  expected_amount: number;
  user_declared_amount: number;
  is_partial: boolean;
  status: PaymentStatus;
  admin_typed_amount: number | null;
  divergence_notes: string | null;
  divergence_notified_at: string | null;
  created_at: string;
  reviewed_at: string | null;
};

type StockAuditsRow = {
  id: string;
  location_id: string;
  admin_id: string;
  notes: string | null;
  created_at: string;
};

type StockAuditItemsRow = {
  id: string;
  audit_id: string;
  product_id: string;
  expected_quantity: number;
  physical_quantity: number;
  difference: number;
};

type NotificationsRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type AuditLogsRow = {
  id: string;
  actor_id: string | null;
  target_user_id: string | null;
  action: string;
  details: Json | null;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: Partial<ProfilesRow> & Pick<ProfilesRow, "id" | "full_name" | "document">;
        Update: Partial<ProfilesRow>;
        Relationships: [];
      };
      locations: {
        Row: LocationsRow;
        Insert: Partial<LocationsRow> & Pick<LocationsRow, "name">;
        Update: Partial<LocationsRow>;
        Relationships: [];
      };
      products: {
        Row: ProductsRow;
        Insert: Partial<ProductsRow> & Pick<ProductsRow, "name">;
        Update: Partial<ProductsRow>;
        Relationships: [];
      };
      inventory: {
        Row: InventoryRow;
        Insert: Partial<InventoryRow> & Pick<InventoryRow, "location_id" | "product_id">;
        Update: Partial<InventoryRow>;
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      withdrawals: {
        Row: WithdrawalsRow;
        Insert: Partial<WithdrawalsRow>;
        Update: Partial<WithdrawalsRow>;
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "withdrawals_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "withdrawals_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "withdrawals_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      withdrawal_cancellation_requests: {
        Row: WithdrawalCancellationRequestsRow;
        Insert: Partial<WithdrawalCancellationRequestsRow>;
        Update: Partial<WithdrawalCancellationRequestsRow>;
        Relationships: [
          {
            foreignKeyName: "withdrawal_cancellation_requests_withdrawal_id_fkey";
            columns: ["withdrawal_id"];
            isOneToOne: false;
            referencedRelation: "withdrawals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "withdrawal_cancellation_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "withdrawal_cancellation_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: PaymentsRow;
        Insert: Partial<PaymentsRow>;
        Update: Partial<PaymentsRow>;
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_audits: {
        Row: StockAuditsRow;
        Insert: Partial<StockAuditsRow>;
        Update: Partial<StockAuditsRow>;
        Relationships: [
          {
            foreignKeyName: "stock_audits_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_audits_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_audit_items: {
        Row: StockAuditItemsRow;
        Insert: Partial<StockAuditItemsRow>;
        Update: Partial<StockAuditItemsRow>;
        Relationships: [
          {
            foreignKeyName: "stock_audit_items_audit_id_fkey";
            columns: ["audit_id"];
            isOneToOne: false;
            referencedRelation: "stock_audits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_audit_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: NotificationsRow;
        Insert: Partial<NotificationsRow>;
        Update: Partial<NotificationsRow>;
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: AuditLogsRow;
        Insert: Partial<AuditLogsRow>;
        Update: Partial<AuditLogsRow>;
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_balance: {
        Args: Record<string, never>;
        Returns: number;
      };
      compute_user_balance: {
        Args: { p_user_id: string };
        Returns: number;
      };
      get_total_open_balance: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_spending_ranking: {
        Args: Record<string, never>;
        Returns: { user_id: string; full_name: string; total_spent: number }[];
      };
      create_withdrawal: {
        Args: { p_product_id: string; p_location_id: string; p_quantity?: number };
        Returns: WithdrawalsRow;
      };
      checkout_withdrawal_cart: {
        Args: { p_items: Json };
        Returns: WithdrawalsRow[];
      };
      request_withdrawal_cancellation: {
        Args: { p_withdrawal_id: string; p_reason: string };
        Returns: WithdrawalCancellationRequestsRow;
      };
      review_cancellation_request: {
        Args: { p_request_id: string; p_approve: boolean };
        Returns: undefined;
      };
      declare_payment: {
        Args: { p_user_declared_amount: number; p_is_partial?: boolean };
        Returns: PaymentsRow;
      };
      review_payment: {
        Args: {
          p_payment_id: string;
          p_admin_typed_amount: number;
          p_decision: PaymentStatus;
          p_notes?: string | null;
        };
        Returns: undefined;
      };
      mark_divergence_seen: {
        Args: { p_payment_id: string };
        Returns: undefined;
      };
      create_stock_audit: {
        Args: { p_location_id: string; p_notes: string | null; p_items: Json };
        Returns: string;
      };
      apply_stock_audit: {
        Args: { p_audit_id: string };
        Returns: undefined;
      };
      restock_inventory: {
        Args: {
          p_location_id: string;
          p_product_id: string;
          p_quantity: number;
          p_notes?: string | null;
        };
        Returns: undefined;
      };
      transfer_inventory: {
        Args: {
          p_from_location_id: string;
          p_to_location_id: string;
          p_product_id: string;
          p_quantity: number;
          p_notes?: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

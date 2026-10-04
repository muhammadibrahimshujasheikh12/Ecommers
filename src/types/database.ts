// Generated from the database schema (supabase/migrations) with Supabase's type generator.
// Regenerate after changing migrations: npm run db:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          country: string
          created_at: string
          first_name: string
          id: string
          is_default: boolean
          last_name: string
          phone: string
          postal_code: string | null
          province: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          country?: string
          created_at?: string
          first_name: string
          id?: string
          is_default?: boolean
          last_name: string
          phone: string
          postal_code?: string | null
          province?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country?: string
          created_at?: string
          first_name?: string
          id?: string
          is_default?: boolean
          last_name?: string
          phone?: string
          postal_code?: string | null
          province?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          position: number
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          position?: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          position?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          position: number
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          position?: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          created_at: string
          email: string | null
          id: string
          order_id: string
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          email?: string | null
          id?: string
          order_id: string
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          email?: string | null
          id?: string
          order_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          maximum_discount: number | null
          minimum_order: number
          starts_at: string | null
          times_used: number
          type: Database["public"]["Enums"]["coupon_type"]
          usage_limit: number | null
          usage_limit_per_customer: number | null
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          maximum_discount?: number | null
          minimum_order?: number
          starts_at?: string | null
          times_used?: number
          type: Database["public"]["Enums"]["coupon_type"]
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          maximum_discount?: number | null
          minimum_order?: number
          starts_at?: string | null
          times_used?: number
          type?: Database["public"]["Enums"]["coupon_type"]
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
          value?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          status: Database["public"]["Enums"]["subscriber_status"]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"]
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color: string | null
          id: string
          image_url: string | null
          line_total: number | null
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          product_slug: string | null
          quantity: number
          size: string | null
          sku: string
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          color?: string | null
          id?: string
          image_url?: string | null
          line_total?: never
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          product_slug?: string | null
          quantity: number
          size?: string | null
          sku: string
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          color?: string | null
          id?: string
          image_url?: string | null
          line_total?: never
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          product_slug?: string | null
          quantity?: number
          size?: string | null
          sku?: string
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_token: string
          billing_address: NonNullable<Json>
          coupon_code: string | null
          created_at: string
          currency: string
          discount: number
          email: string
          id: string
          notes: string | null
          order_number: string
          payment_method: string
          payment_provider: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          phone: string | null
          shipping_address: NonNullable<Json>
          shipping_cost: number
          shipping_method: string | null
          shipping_method_name: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token?: string
          billing_address: NonNullable<Json>
          coupon_code?: string | null
          created_at?: string
          currency?: string
          discount?: number
          email: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method: string
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          shipping_address: NonNullable<Json>
          shipping_cost?: number
          shipping_method?: string | null
          shipping_method_name?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax?: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string
          billing_address?: NonNullable<Json>
          coupon_code?: string | null
          created_at?: string
          currency?: string
          discount?: number
          email?: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          shipping_address?: NonNullable<Json>
          shipping_cost?: number
          shipping_method?: string | null
          shipping_method_name?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_published: boolean
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_collections: {
        Row: {
          collection_id: string
          position: number
          product_id: string
        }
        Insert: {
          collection_id: string
          position?: number
          product_id: string
        }
        Update: {
          collection_id?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_collections_collection_id_fkey"
            columns: ["collection_id"]
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_collections_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          position: number
          product_id: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string | null
          color_hex: string | null
          created_at: string
          id: string
          name: string
          position: number
          price: number | null
          product_id: string
          size: string | null
          sku: string
          stock_quantity: number
        }
        Insert: {
          color?: string | null
          color_hex?: string | null
          created_at?: string
          id?: string
          name: string
          position?: number
          price?: number | null
          product_id: string
          size?: string | null
          sku: string
          stock_quantity?: number
        }
        Update: {
          color?: string | null
          color_hex?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          price?: number | null
          product_id?: string
          size?: string | null
          sku?: string
          stock_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          care_instructions: string | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          details: NonNullable<Json>
          featured: boolean
          id: string
          material: string | null
          name: string
          price: number
          rating_avg: number
          rating_count: number
          sales_count: number
          short_description: string | null
          sku: string
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          care_instructions?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          details?: NonNullable<Json>
          featured?: boolean
          id?: string
          material?: string | null
          name: string
          price: number
          rating_avg?: number
          rating_count?: number
          sales_count?: number
          short_description?: string | null
          sku: string
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          care_instructions?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          details?: NonNullable<Json>
          featured?: boolean
          id?: string
          material?: string | null
          name?: string
          price?: number
          rating_avg?: number
          rating_count?: number
          sales_count?: number
          short_description?: string | null
          sku?: string
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      review_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          position: number
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          position?: number
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          position?: number
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          product_id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          title: string
          updated_at: string
          user_id: string
          verified_purchase: boolean
        }
        Insert: {
          author_name?: string
          content: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          title: string
          updated_at?: string
          user_id: string
          verified_purchase?: boolean
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          title?: string
          updated_at?: string
          user_id?: string
          verified_purchase?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_methods: {
        Row: {
          code: string
          countries: string[] | null
          description: string | null
          free_shipping_threshold: number | null
          id: string
          is_active: boolean
          max_days: number
          min_days: number
          name: string
          position: number
          price: number
        }
        Insert: {
          code: string
          countries?: string[] | null
          description?: string | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          max_days?: number
          min_days?: number
          name: string
          position?: number
          price: number
        }
        Update: {
          code?: string
          countries?: string[] | null
          description?: string | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          max_days?: number
          min_days?: number
          name?: string
          position?: number
          price?: number
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_cart: {
        Args: {
          p_country?: string
          p_coupon_code?: string
          p_email?: string
          p_items: Json
          p_shipping_method?: string
          p_tax_rate?: number
          p_user_id?: string
        }
        Returns: Json
      }
      catalog_facets: {
        Args: {
          p_category_slugs?: string[]
          p_collection_slugs?: string[]
          p_on_sale?: boolean
          p_query?: string
        }
        Returns: Json
      }
      escape_like: { Args: { p_value: string }; Returns: string }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_privileged_request: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      place_order: {
        Args: {
          p_billing_address: Json
          p_coupon_code: string
          p_email: string
          p_initial_status?: Database["public"]["Enums"]["order_status"]
          p_items: Json
          p_notes?: string
          p_payment_method: string
          p_payment_provider: string
          p_phone: string
          p_shipping_address: Json
          p_shipping_method: string
          p_tax_rate?: number
          p_user_id: string
        }
        Returns: Json
      }
      product_available_quantity: {
        Args: { p_product_id: string }
        Returns: number
      }
      search_catalog: {
        Args: { p_limit?: number; p_query: string }
        Returns: Json
      }
      search_products: {
        Args: {
          p_availability?: string
          p_category_slugs?: string[]
          p_collection_slugs?: string[]
          p_colors?: string[]
          p_ids?: string[]
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_min_rating?: number
          p_offset?: number
          p_on_sale?: boolean
          p_query?: string
          p_sizes?: string[]
          p_sort?: string
        }
        Returns: {
          id: string
          total_count: number
        }[]
      }
    }
    Enums: {
      coupon_type: "percentage" | "fixed"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "returned"
        | "refunded"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      product_status: "draft" | "active" | "archived"
      review_status: "pending" | "approved" | "rejected"
      subscriber_status: "subscribed" | "unsubscribed"
      user_role: "customer" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      coupon_type: ["percentage", "fixed"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
      product_status: ["draft", "active", "archived"],
      review_status: ["pending", "approved", "rejected"],
      subscriber_status: ["subscribed", "unsubscribed"],
      user_role: ["customer", "admin"],
    },
  },
} as const


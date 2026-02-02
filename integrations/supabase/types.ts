export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string | null
          created_at: string
          full_name: string
          id: string
          is_default: boolean | null
          phone: string
          postal_code: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean | null
          phone: string
          postal_code: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean | null
          phone?: string
          postal_code?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_records: {
        Row: {
          bill_number: string
          billing_address: Json | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_gstin: string | null
          customer_name: string
          customer_phone: string | null
          discount_amount: number | null
          id: string
          items: Json
          notes: string | null
          order_id: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          bill_number: string
          billing_address?: Json | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_gstin?: string | null
          customer_name: string
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          items?: Json
          notes?: string | null
          order_id?: string | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          bill_number?: string
          billing_address?: Json | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_gstin?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          items?: Json
          notes?: string | null
          order_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_billing_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "billing_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_orders_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "billing_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_quotations_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "billing_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_stock_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "billing_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string | null
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      branch_credentials: {
        Row: {
          branch_id: string
          created_at: string
          email: string
          encrypted_password: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          email: string
          encrypted_password: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          email?: string
          encrypted_password?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_credentials_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branch_billing_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "branch_credentials_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branch_orders_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "branch_credentials_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branch_quotations_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "branch_credentials_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branch_stock_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "branch_credentials_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_users: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_billing_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "branch_users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_orders_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "branch_users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_quotations_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "branch_users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_stock_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "branch_users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          code: string
          created_at: string
          display_order: number | null
          email: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          map_embed_url: string | null
          name: string
          phone: string
          postal_code: string
          slug: string | null
          state: string
          updated_at: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          code: string
          created_at?: string
          display_order?: number | null
          email?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          map_embed_url?: string | null
          name: string
          phone: string
          postal_code: string
          slug?: string | null
          state?: string
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          code?: string
          created_at?: string
          display_order?: number | null
          email?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          map_embed_url?: string | null
          name?: string
          phone?: string
          postal_code?: string
          slug?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          replied_at: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          replied_at?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          replied_at?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      custom_order_messages: {
        Row: {
          created_at: string
          custom_order_id: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          custom_order_id: string
          id?: string
          is_read?: boolean
          message: string
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          custom_order_id?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_order_messages_custom_order_id_fkey"
            columns: ["custom_order_id"]
            isOneToOne: false
            referencedRelation: "custom_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_orders: {
        Row: {
          admin_deleted_at: string | null
          admin_notes: string | null
          budget_range: string | null
          created_at: string
          customer_deleted_at: string | null
          deleted_by_admin: boolean
          deleted_by_customer: boolean
          dimensions: string | null
          email: string
          engraving_text: string | null
          finish_type: string | null
          id: string
          name: string
          phone: string | null
          product_type: string
          quoted_price: number | null
          reference_images: string[] | null
          special_requirements: string | null
          status: string | null
          timeline: string | null
          updated_at: string
          user_id: string | null
          wood_type: string | null
        }
        Insert: {
          admin_deleted_at?: string | null
          admin_notes?: string | null
          budget_range?: string | null
          created_at?: string
          customer_deleted_at?: string | null
          deleted_by_admin?: boolean
          deleted_by_customer?: boolean
          dimensions?: string | null
          email: string
          engraving_text?: string | null
          finish_type?: string | null
          id?: string
          name: string
          phone?: string | null
          product_type: string
          quoted_price?: number | null
          reference_images?: string[] | null
          special_requirements?: string | null
          status?: string | null
          timeline?: string | null
          updated_at?: string
          user_id?: string | null
          wood_type?: string | null
        }
        Update: {
          admin_deleted_at?: string | null
          admin_notes?: string | null
          budget_range?: string | null
          created_at?: string
          customer_deleted_at?: string | null
          deleted_by_admin?: boolean
          deleted_by_customer?: boolean
          dimensions?: string | null
          email?: string
          engraving_text?: string | null
          finish_type?: string | null
          id?: string
          name?: string
          phone?: string | null
          product_type?: string
          quoted_price?: number | null
          reference_images?: string[] | null
          special_requirements?: string | null
          status?: string | null
          timeline?: string | null
          updated_at?: string
          user_id?: string | null
          wood_type?: string | null
        }
        Relationships: []
      }
      damaged_stock: {
        Row: {
          branch_id: string
          created_at: string
          damage_notes: string | null
          from_branch_id: string
          id: string
          product_id: string
          quantity: number
          recorded_at: string
          recorded_by: string
          transfer_item_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          damage_notes?: string | null
          from_branch_id: string
          id?: string
          product_id: string
          quantity: number
          recorded_at?: string
          recorded_by: string
          transfer_item_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          damage_notes?: string | null
          from_branch_id?: string
          id?: string
          product_id?: string
          quantity?: number
          recorded_at?: string
          recorded_by?: string
          transfer_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "damaged_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_billing_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "damaged_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_orders_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "damaged_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_quotations_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "damaged_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_stock_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "damaged_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damaged_stock_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branch_billing_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "damaged_stock_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branch_orders_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "damaged_stock_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branch_quotations_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "damaged_stock_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branch_stock_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "damaged_stock_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damaged_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damaged_stock_transfer_item_id_fkey"
            columns: ["transfer_item_id"]
            isOneToOne: false
            referencedRelation: "stock_transfer_items"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          dimensions: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          is_featured: boolean | null
          title: string
          updated_at: string
          wood_type: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          dimensions?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          is_featured?: boolean | null
          title: string
          updated_at?: string
          wood_type?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          dimensions?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          title?: string
          updated_at?: string
          wood_type?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          branch_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          delivered_at: string | null
          id: string
          notes: string | null
          order_number: string
          out_for_delivery_at: string | null
          packed_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_screenshot_url: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          payment_verified_at: string | null
          shipped_at: string | null
          shipping_address: Json
          shipping_amount: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
          upi_transaction_id: string | null
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          branch_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_number: string
          out_for_delivery_at?: string | null
          packed_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_screenshot_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_verified_at?: string | null
          shipped_at?: string | null
          shipping_address: Json
          shipping_amount?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          upi_transaction_id?: string | null
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          branch_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          out_for_delivery_at?: string | null
          packed_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_screenshot_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_verified_at?: string | null
          shipped_at?: string | null
          shipping_address?: Json
          shipping_amount?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          upi_transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_billing_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_orders_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_quotations_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_stock_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      page_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          page_name: string
          section_name: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          page_name: string
          section_name: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          page_name?: string
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          benefits: Json | null
          branch_id: string | null
          category_id: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          description: string | null
          difference_from_others: Json | null
          dimensions: Json | null
          faq: Json | null
          how_we_make: Json | null
          id: string
          images: string[] | null
          ingredients: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price: number
          short_description: string | null
          sku: string | null
          slug: string
          stock_quantity: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          benefits?: Json | null
          branch_id?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          difference_from_others?: Json | null
          dimensions?: Json | null
          faq?: Json | null
          how_we_make?: Json | null
          id?: string
          images?: string[] | null
          ingredients?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price: number
          short_description?: string | null
          sku?: string | null
          slug: string
          stock_quantity?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          benefits?: Json | null
          branch_id?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          difference_from_others?: Json | null
          dimensions?: Json | null
          faq?: Json | null
          how_we_make?: Json | null
          id?: string
          images?: string[] | null
          ingredients?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price?: number
          short_description?: string | null
          sku?: string | null
          slug?: string
          stock_quantity?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_billing_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "products_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_orders_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "products_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_quotations_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "products_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_stock_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "products_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          customer_address: Json | null
          customer_email: string | null
          customer_gstin: string | null
          customer_name: string
          customer_phone: string | null
          discount_amount: number | null
          id: string
          items: Json
          notes: string | null
          quotation_number: string
          status: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: Json | null
          customer_email?: string | null
          customer_gstin?: string | null
          customer_name: string
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          items?: Json
          notes?: string | null
          quotation_number: string
          status?: string | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: Json | null
          customer_email?: string | null
          customer_gstin?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          items?: Json
          notes?: string | null
          quotation_number?: string
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_billing_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "quotations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_orders_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "quotations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_quotations_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "quotations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch_stock_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "quotations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      return_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          return_id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          return_id: string
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          return_id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_messages_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          admin_notes: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          order_id: string
          processed_at: string | null
          reason: string
          refund_amount: number | null
          requested_at: string
          status: Database["public"]["Enums"]["return_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id: string
          processed_at?: string | null
          reason: string
          refund_amount?: number | null
          requested_at?: string
          status?: Database["public"]["Enums"]["return_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string
          processed_at?: string | null
          reason?: string
          refund_amount?: number | null
          requested_at?: string
          status?: Database["public"]["Enums"]["return_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_log: {
        Row: {
          action: string
          changed_by_user_id: string
          created_at: string
          id: string
          new_role: Database["public"]["Enums"]["app_role"]
          notes: string | null
          old_role: Database["public"]["Enums"]["app_role"] | null
          target_user_id: string
        }
        Insert: {
          action: string
          changed_by_user_id: string
          created_at?: string
          id?: string
          new_role: Database["public"]["Enums"]["app_role"]
          notes?: string | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          target_user_id: string
        }
        Update: {
          action?: string
          changed_by_user_id?: string
          created_at?: string
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"]
          notes?: string | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          target_user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      stock_transfer_items: {
        Row: {
          created_at: string
          damaged_quantity: number | null
          id: string
          product_id: string
          received_quantity: number | null
          requested_quantity: number
          sent_quantity: number | null
          transfer_id: string
        }
        Insert: {
          created_at?: string
          damaged_quantity?: number | null
          id?: string
          product_id: string
          received_quantity?: number | null
          requested_quantity: number
          sent_quantity?: number | null
          transfer_id: string
        }
        Update: {
          created_at?: string
          damaged_quantity?: number | null
          id?: string
          product_id?: string
          received_quantity?: number | null
          requested_quantity?: number
          sent_quantity?: number | null
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          challan_created_at: string | null
          completed_at: string | null
          created_at: string
          from_branch_id: string
          id: string
          notes: string | null
          received_at: string | null
          requested_at: string
          requested_by: string
          shipped_at: string | null
          status: Database["public"]["Enums"]["stock_transfer_status"]
          to_branch_id: string
          transfer_number: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          challan_created_at?: string | null
          completed_at?: string | null
          created_at?: string
          from_branch_id: string
          id?: string
          notes?: string | null
          received_at?: string | null
          requested_at?: string
          requested_by: string
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["stock_transfer_status"]
          to_branch_id: string
          transfer_number: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          challan_created_at?: string | null
          completed_at?: string | null
          created_at?: string
          from_branch_id?: string
          id?: string
          notes?: string | null
          received_at?: string | null
          requested_at?: string
          requested_by?: string
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["stock_transfer_status"]
          to_branch_id?: string
          transfer_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branch_billing_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "stock_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branch_orders_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "stock_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branch_quotations_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "stock_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branch_stock_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "stock_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branch_billing_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "stock_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branch_orders_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "stock_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branch_quotations_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "stock_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branch_stock_summary"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "stock_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_challans: {
        Row: {
          actual_delivery_date: string | null
          challan_number: string
          created_at: string
          created_by: string
          dispatch_date: string | null
          driver_name: string | null
          driver_phone: string | null
          expected_delivery_date: string | null
          id: string
          is_signed: boolean | null
          notes: string | null
          signature_data: string | null
          signed_at: string | null
          signed_by: string | null
          transfer_id: string
          updated_at: string
          vehicle_number: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          challan_number: string
          created_at?: string
          created_by: string
          dispatch_date?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          expected_delivery_date?: string | null
          id?: string
          is_signed?: boolean | null
          notes?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by?: string | null
          transfer_id: string
          updated_at?: string
          vehicle_number?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          challan_number?: string
          created_at?: string
          created_by?: string
          dispatch_date?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          expected_delivery_date?: string | null
          id?: string
          is_signed?: boolean | null
          notes?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by?: string | null
          transfer_id?: string
          updated_at?: string
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_challans_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      branch_billing_summary: {
        Row: {
          branch_code: string | null
          branch_id: string | null
          branch_name: string | null
          total_amount: number | null
          total_bills: number | null
          total_discounts: number | null
          total_subtotal: number | null
          total_tax: number | null
        }
        Relationships: []
      }
      branch_orders_summary: {
        Row: {
          branch_code: string | null
          branch_id: string | null
          branch_name: string | null
          cancelled_count: number | null
          delivered_count: number | null
          pending_count: number | null
          total_orders: number | null
          total_sales: number | null
        }
        Relationships: []
      }
      branch_quotations_summary: {
        Row: {
          accepted_count: number | null
          branch_code: string | null
          branch_id: string | null
          branch_name: string | null
          draft_count: number | null
          rejected_count: number | null
          sent_count: number | null
          total_quotations: number | null
          total_value: number | null
        }
        Relationships: []
      }
      branch_stock_summary: {
        Row: {
          branch_code: string | null
          branch_id: string | null
          branch_name: string | null
          low_stock_count: number | null
          out_of_stock_count: number | null
          total_cost_value: number | null
          total_products: number | null
          total_retail_value: number | null
          total_units: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_branch_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_branch_manager: {
        Args: { _branch_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "moderator" | "branch_manager"
      order_status:
        | "order_placed"
        | "payment_verification_pending"
        | "payment_confirmed"
        | "product_packed"
        | "shipped"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
      payment_method: "cod" | "upi"
      payment_status:
        | "pending"
        | "verification_pending"
        | "verified"
        | "failed"
        | "refunded"
      return_status:
        | "requested"
        | "approved"
        | "rejected"
        | "processing"
        | "completed"
      stock_transfer_status:
        | "requested"
        | "challan_created"
        | "approved"
        | "in_transit"
        | "received"
        | "completed"
        | "rejected"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "customer", "moderator", "branch_manager"],
      order_status: [
        "order_placed",
        "payment_verification_pending",
        "payment_confirmed",
        "product_packed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      payment_method: ["cod", "upi"],
      payment_status: [
        "pending",
        "verification_pending",
        "verified",
        "failed",
        "refunded",
      ],
      return_status: [
        "requested",
        "approved",
        "rejected",
        "processing",
        "completed",
      ],
      stock_transfer_status: [
        "requested",
        "challan_created",
        "approved",
        "in_transit",
        "received",
        "completed",
        "rejected",
      ],
    },
  },
} as const

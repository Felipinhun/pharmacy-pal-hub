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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_icon: string | null
          description: string | null
          earned_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          badge_icon?: string | null
          description?: string | null
          earned_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          badge_icon?: string | null
          description?: string | null
          earned_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          goal_type: string
          id: string
          is_active: boolean
          start_date: string
          target_role: Database["public"]["Enums"]["app_role"]
          target_value: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean
          start_date?: string
          target_role: Database["public"]["Enums"]["app_role"]
          target_value?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean
          start_date?: string
          target_role?: Database["public"]["Enums"]["app_role"]
          target_value?: number
          title?: string
        }
        Relationships: []
      }
      prescribers: {
        Row: {
          best_visit_day: string | null
          best_visit_time: string | null
          city: string | null
          clinic_name: string | null
          created_at: string
          crm_crf: string | null
          full_name: string
          id: string
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          number: string | null
          partnership_potential:
            | Database["public"]["Enums"]["partnership_potential"]
            | null
          prescritor_user_id: string | null
          specialization: string | null
          specialty: string | null
          state: string | null
          street: string | null
          updated_at: string
          visitadora_id: string | null
          zip_code: string | null
        }
        Insert: {
          best_visit_day?: string | null
          best_visit_time?: string | null
          city?: string | null
          clinic_name?: string | null
          created_at?: string
          crm_crf?: string | null
          full_name: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          partnership_potential?:
            | Database["public"]["Enums"]["partnership_potential"]
            | null
          prescritor_user_id?: string | null
          specialization?: string | null
          specialty?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          visitadora_id?: string | null
          zip_code?: string | null
        }
        Update: {
          best_visit_day?: string | null
          best_visit_time?: string | null
          city?: string | null
          clinic_name?: string | null
          created_at?: string
          crm_crf?: string | null
          full_name?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          partnership_potential?:
            | Database["public"]["Enums"]["partnership_potential"]
            | null
          prescritor_user_id?: string | null
          specialization?: string | null
          specialty?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          visitadora_id?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount: number
          atendente_id: string | null
          created_at: string
          description: string | null
          id: string
          prescriber_id: string | null
          sale_date: string
        }
        Insert: {
          amount?: number
          atendente_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          prescriber_id?: string | null
          sale_date?: string
        }
        Update: {
          amount?: number
          atendente_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          prescriber_id?: string | null
          sale_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_prescriber_id_fkey"
            columns: ["prescriber_id"]
            isOneToOne: false
            referencedRelation: "prescribers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          checkin_at: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          prescriber_id: string
          status: string
          visit_date: string
          visitadora_id: string
        }
        Insert: {
          checkin_at?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          prescriber_id: string
          status?: string
          visit_date?: string
          visitadora_id: string
        }
        Update: {
          checkin_at?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          prescriber_id?: string
          status?: string
          visit_date?: string
          visitadora_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_prescriber_id_fkey"
            columns: ["prescriber_id"]
            isOneToOne: false
            referencedRelation: "prescribers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "visitadora" | "prescritor" | "atendente" | "admin"
      partnership_potential: "baixo" | "medio" | "alto"
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
      app_role: ["visitadora", "prescritor", "atendente", "admin"],
      partnership_potential: ["baixo", "medio", "alto"],
    },
  },
} as const

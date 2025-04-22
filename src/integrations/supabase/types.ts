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
      campaign_versions: {
        Row: {
          campaign_id: string
          campaign_name: string
          duration_days: number
          id: string
          marketing_objective: string
          media_channel: string
          start_date: string
          status: string
          target_audience: string
          total_budget: number
          user_id: string | null
          version_date: string
          version_name: string | null
          version_notes: string | null
        }
        Insert: {
          campaign_id: string
          campaign_name: string
          duration_days: number
          id?: string
          marketing_objective: string
          media_channel: string
          start_date: string
          status: string
          target_audience: string
          total_budget: number
          user_id?: string | null
          version_date?: string
          version_name?: string | null
          version_notes?: string | null
        }
        Update: {
          campaign_id?: string
          campaign_name?: string
          duration_days?: number
          id?: string
          marketing_objective?: string
          media_channel?: string
          start_date?: string
          status?: string
          target_audience?: string
          total_budget?: number
          user_id?: string | null
          version_date?: string
          version_name?: string | null
          version_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_versions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          campaign_name: string
          created_at: string
          duration_days: number
          id: string
          marketing_objective: string
          media_channel: string
          start_date: string
          status: string
          target_audience: string
          total_budget: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          campaign_name: string
          created_at?: string
          duration_days: number
          id?: string
          marketing_objective: string
          media_channel: string
          start_date: string
          status: string
          target_audience: string
          total_budget: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          campaign_name?: string
          created_at?: string
          duration_days?: number
          id?: string
          marketing_objective?: string
          media_channel?: string
          start_date?: string
          status?: string
          target_audience?: string
          total_budget?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      weekly_budget_versions: {
        Row: {
          actual_amount: number | null
          campaign_version_id: string
          id: string
          percentage: number | null
          planned_amount: number
          version_date: string
          week: string
        }
        Insert: {
          actual_amount?: number | null
          campaign_version_id: string
          id?: string
          percentage?: number | null
          planned_amount?: number
          version_date?: string
          week: string
        }
        Update: {
          actual_amount?: number | null
          campaign_version_id?: string
          id?: string
          percentage?: number | null
          planned_amount?: number
          version_date?: string
          week?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_budget_versions_campaign_version_id_fkey"
            columns: ["campaign_version_id"]
            isOneToOne: false
            referencedRelation: "campaign_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_budgets: {
        Row: {
          actual_amount: number | null
          campaign_id: string
          created_at: string
          id: string
          percentage: number | null
          planned_amount: number
          updated_at: string
          week: string
        }
        Insert: {
          actual_amount?: number | null
          campaign_id: string
          created_at?: string
          id?: string
          percentage?: number | null
          planned_amount?: number
          updated_at?: string
          week: string
        }
        Update: {
          actual_amount?: number | null
          campaign_id?: string
          created_at?: string
          id?: string
          percentage?: number | null
          planned_amount?: number
          updated_at?: string
          week?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_budgets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

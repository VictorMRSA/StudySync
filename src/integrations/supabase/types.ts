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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_summaries: {
        Row: {
          content: string
          created_at: string | null
          generated_by: string | null
          id: string
          material_id: string | null
          summary_type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          generated_by?: string | null
          id?: string
          material_id?: string | null
          summary_type: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          generated_by?: string | null
          id?: string
          material_id?: string | null
          summary_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_summaries_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          class_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          type: Database["public"]["Enums"]["assignment_type"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          class_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          type: Database["public"]["Enums"]["assignment_type"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          class_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          type?: Database["public"]["Enums"]["assignment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["class_role"]
          user_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["class_role"]
          user_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["class_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          invite_code: string
          name: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          invite_code?: string
          name: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string
          name?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      error_reports: {
        Row: {
          area: string
          created_at: string
          description: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          technical_details: Json | null
          updated_at: string | null
          user_email: string
          user_id: string | null
        }
        Insert: {
          area?: string
          created_at?: string
          description: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          technical_details?: Json | null
          updated_at?: string | null
          user_email: string
          user_id?: string | null
        }
        Update: {
          area?: string
          created_at?: string
          description?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          technical_details?: Json | null
          updated_at?: string | null
          user_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          priority: number | null
          start_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          priority?: number | null
          start_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          priority?: number | null
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          class_id: string
          created_at: string
          description: string | null
          file_name: string | null
          file_size: string | null
          file_type: string | null
          file_url: string | null
          id: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[] | null
          title: string
          uploaded_by: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          class_id: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title: string
          uploaded_by: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          class_id?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          pending_reports: number
          total_classes: number
          total_profiles: number
          total_reports: number
          total_users: number
        }[]
      }
      get_class_by_invite: {
        Args: { invite_code: string }
        Returns: {
          created_at: string
          created_by: string
          description: string
          id: string
          invite_code: string
          name: string
          subject: string
          updated_at: string
        }[]
      }
      get_class_members: {
        Args: { _class_id: string }
        Returns: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["class_role"]
          user_id: string
        }[]
      }
      get_error_reports_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          area: string
          created_at: string
          description: string
          id: string
          resolved_at: string
          status: string
          technical_details: Json
        }[]
      }
      get_error_reports_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          pending_reports: number
          reports_by_area: Json
          resolved_reports: number
          total_reports: number
        }[]
      }
      get_member_counts: {
        Args: { _class_ids: string[] }
        Returns: {
          class_id: string
          member_count: number
        }[]
      }
      is_admin: {
        Args: { _class_id: string }
        Returns: boolean
      }
      is_member: {
        Args: { _class_id: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      promote_member_to_admin: {
        Args: { _member_id: string }
        Returns: {
          class_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["class_role"]
          user_id: string
        }
      }
      update_error_report_status_admin: {
        Args: { _new_status: string; _report_id: string }
        Returns: {
          id: string
          resolved_at: string
          resolved_by: string
          status: string
        }[]
      }
    }
    Enums: {
      assignment_type: "exam" | "homework" | "project"
      class_role: "admin" | "member"
      content_status: "pending" | "approved" | "rejected"
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
      assignment_type: ["exam", "homework", "project"],
      class_role: ["admin", "member"],
      content_status: ["pending", "approved", "rejected"],
    },
  },
} as const

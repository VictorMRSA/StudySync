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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_summaries: {
        Row: {
          content: string
          created_at: string
          generated_by: string
          id: string
          material_id: number | null
          summary_type: string
          user_feedback: string | null
        }
        Insert: {
          content: string
          created_at?: string
          generated_by: string
          id?: string
          material_id?: number | null
          summary_type: string
          user_feedback?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          generated_by?: string
          id?: string
          material_id?: number | null
          summary_type?: string
          user_feedback?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      class_memberships: {
        Row: {
          class_id: number
          id: number
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          class_id: number
          id?: never
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          class_id?: number
          id?: never
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_memberships_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
          owner_id?: string
          updated_at?: string | null
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
          status: string
          technical_details: Json | null
          user_email: string
          user_id: string
        }
        Insert: {
          area?: string
          created_at?: string
          description: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          technical_details?: Json | null
          user_email: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          description?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          technical_details?: Json | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          class: string
          created_at: string
          date: string
          id: string
          location: string
          time: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class: string
          created_at?: string
          date: string
          id?: string
          location: string
          time: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class?: string
          created_at?: string
          date?: string
          id?: string
          location?: string
          time?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          class_id: number
          created_at: string | null
          description: string | null
          extracted_text: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: number
          status: string | null
          storage_path: string
          title: string
          uploaded_by: string
        }
        Insert: {
          class_id: number
          created_at?: string | null
          description?: string | null
          extracted_text?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: never
          status?: string | null
          storage_path: string
          title: string
          uploaded_by: string
        }
        Update: {
          class_id?: number
          created_at?: string | null
          description?: string | null
          extracted_text?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: never
          status?: string | null
          storage_path?: string
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
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          current_level: number
          experience_points: number
          full_name: string | null
          id: number
          next_level_xp: number
          role: string | null
          streak_days: number
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_level?: number
          experience_points?: number
          full_name?: string | null
          id?: never
          next_level_xp?: number
          role?: string | null
          streak_days?: number
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_level?: number
          experience_points?: number
          full_name?: string | null
          id?: never
          next_level_xp?: number
          role?: string | null
          streak_days?: number
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      streaks: {
        Row: {
          best_streak: number
          current_streak: number
          id: number
          last_active_at: string | null
          user_id: string
        }
        Insert: {
          best_streak?: number
          current_streak?: number
          id?: never
          last_active_at?: string | null
          user_id: string
        }
        Update: {
          best_streak?: number
          current_streak?: number
          id?: never
          last_active_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      student_points: {
        Row: {
          class_id: number | null
          earned_at: string | null
          id: number
          points: number
          user_id: string
        }
        Insert: {
          class_id?: number | null
          earned_at?: string | null
          id?: never
          points?: number
          user_id: string
        }
        Update: {
          class_id?: number | null
          earned_at?: string | null
          id?: never
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_points_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_stats: {
        Args: never
        Returns: {
          pending_reports: number
          total_classes: number
          total_profiles: number
          total_reports: number
          total_users: number
        }[]
      }
      is_user_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

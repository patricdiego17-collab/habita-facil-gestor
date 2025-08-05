export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      documents: {
        Row: {
          document_name: string
          document_type: string
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          observations: string | null
          social_registration_id: string | null
          status: string | null
          upload_date: string
          user_id: string
        }
        Insert: {
          document_name: string
          document_type: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          observations?: string | null
          social_registration_id?: string | null
          status?: string | null
          upload_date?: string
          user_id: string
        }
        Update: {
          document_name?: string
          document_type?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          observations?: string | null
          social_registration_id?: string | null
          status?: string | null
          upload_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_social_registration_id_fkey"
            columns: ["social_registration_id"]
            isOneToOne: false
            referencedRelation: "social_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      family_compositions: {
        Row: {
          age: number | null
          cpf: string | null
          created_at: string
          disability_description: string | null
          education: string | null
          has_disability: boolean | null
          id: string
          income: number | null
          member_name: string
          profession: string | null
          relationship: string
          social_registration_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          cpf?: string | null
          created_at?: string
          disability_description?: string | null
          education?: string | null
          has_disability?: boolean | null
          id?: string
          income?: number | null
          member_name: string
          profession?: string | null
          relationship: string
          social_registration_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          cpf?: string | null
          created_at?: string
          disability_description?: string | null
          education?: string | null
          has_disability?: boolean | null
          id?: string
          income?: number | null
          member_name?: string
          profession?: string | null
          relationship?: string
          social_registration_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_compositions_social_registration_id_fkey"
            columns: ["social_registration_id"]
            isOneToOne: false
            referencedRelation: "social_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registration_tracking: {
        Row: {
          created_at: string
          id: string
          message: string | null
          social_registration_id: string
          status: string
          updated_at: string
          updated_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          social_registration_id: string
          status: string
          updated_at?: string
          updated_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          social_registration_id?: string
          status?: string
          updated_at?: string
          updated_by?: string
          user_id?: string
        }
        Relationships: []
      }
      social_registrations: {
        Row: {
          address: string | null
          assigned_social_worker_id: string | null
          benefits_description: string | null
          birth_date: string | null
          city: string | null
          cpf: string
          created_at: string
          education: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          has_children: boolean | null
          housing_situation: string | null
          id: string
          income: number | null
          marital_status: string | null
          name: string
          neighborhood: string | null
          observations: string | null
          phone: string | null
          profession: string | null
          receives_benefits: boolean | null
          rg: string | null
          state: string | null
          status: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          assigned_social_worker_id?: string | null
          benefits_description?: string | null
          birth_date?: string | null
          city?: string | null
          cpf: string
          created_at?: string
          education?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          has_children?: boolean | null
          housing_situation?: string | null
          id?: string
          income?: number | null
          marital_status?: string | null
          name: string
          neighborhood?: string | null
          observations?: string | null
          phone?: string | null
          profession?: string | null
          receives_benefits?: boolean | null
          rg?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          assigned_social_worker_id?: string | null
          benefits_description?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string
          created_at?: string
          education?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          has_children?: boolean | null
          housing_situation?: string | null
          id?: string
          income?: number | null
          marital_status?: string | null
          name?: string
          neighborhood?: string | null
          observations?: string | null
          phone?: string | null
          profession?: string | null
          receives_benefits?: boolean | null
          rg?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      terms_agreements: {
        Row: {
          acceptance_date: string
          id: string
          ip_address: string | null
          social_registration_id: string | null
          terms_accepted: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          acceptance_date?: string
          id?: string
          ip_address?: string | null
          social_registration_id?: string | null
          terms_accepted?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          acceptance_date?: string
          id?: string
          ip_address?: string | null
          social_registration_id?: string | null
          terms_accepted?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_agreements_social_registration_id_fkey"
            columns: ["social_registration_id"]
            isOneToOne: false
            referencedRelation: "social_registrations"
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

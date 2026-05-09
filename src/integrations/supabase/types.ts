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
      agent_runs: {
        Row: {
          agent_id: string
          created_at: string
          duration_ms: number | null
          id: string
          input_payload: Json | null
          output_summary: string | null
          status: Database["public"]["Enums"]["run_status"]
          triggered_by: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          input_payload?: Json | null
          output_summary?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          triggered_by: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          input_payload?: Json | null
          output_summary?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["agent_status"]
          updated_at: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
          webhook_url?: string
        }
        Relationships: []
      }
      assistant_teams: {
        Row: {
          assistant_id: string
          created_at: string
          id: string
          team_id: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          id?: string
          team_id: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          assistant_id: string | null
          concurso: string | null
          created_at: string
          delivery_date: string | null
          due_date: string | null
          id: string
          link_entrega: string | null
          professor_id: string
          qtde_aulas: number | null
          solicitacao_id: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assistant_id?: string | null
          concurso?: string | null
          created_at?: string
          delivery_date?: string | null
          due_date?: string | null
          id?: string
          link_entrega?: string | null
          professor_id: string
          qtde_aulas?: number | null
          solicitacao_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assistant_id?: string | null
          concurso?: string | null
          created_at?: string
          delivery_date?: string | null
          due_date?: string | null
          id?: string
          link_entrega?: string | null
          professor_id?: string
          qtde_aulas?: number | null
          solicitacao_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_steps: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          delivery_id: string
          id: string
          order_index: number
          status: Database["public"]["Enums"]["step_status"]
          title: string
          type: Database["public"]["Enums"]["step_type"]
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_id: string
          id?: string
          order_index?: number
          status?: Database["public"]["Enums"]["step_status"]
          title: string
          type?: Database["public"]["Enums"]["step_type"]
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_id?: string
          id?: string
          order_index?: number
          status?: Database["public"]["Enums"]["step_status"]
          title?: string
          type?: Database["public"]["Enums"]["step_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_steps_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          amount: number
          created_at: string
          delivery_id: string | null
          id: string
          paginas_teoria: number | null
          paid_at: string | null
          professor_id: string
          questoes_concurso_ce: number | null
          questoes_concurso_mc: number | null
          questoes_ineditas_ce: number | null
          questoes_ineditas_mc: number | null
          reference_month: string | null
          status: Database["public"]["Enums"]["financial_status"]
          team_id: string | null
          updated_at: string
          valor_override: number | null
          valor_questoes: number | null
          valor_teoria: number | null
        }
        Insert: {
          amount?: number
          created_at?: string
          delivery_id?: string | null
          id?: string
          paginas_teoria?: number | null
          paid_at?: string | null
          professor_id: string
          questoes_concurso_ce?: number | null
          questoes_concurso_mc?: number | null
          questoes_ineditas_ce?: number | null
          questoes_ineditas_mc?: number | null
          reference_month?: string | null
          status?: Database["public"]["Enums"]["financial_status"]
          team_id?: string | null
          updated_at?: string
          valor_override?: number | null
          valor_questoes?: number | null
          valor_teoria?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          delivery_id?: string | null
          id?: string
          paginas_teoria?: number | null
          paid_at?: string | null
          professor_id?: string
          questoes_concurso_ce?: number | null
          questoes_concurso_mc?: number | null
          questoes_ineditas_ce?: number | null
          questoes_ineditas_mc?: number | null
          reference_month?: string | null
          status?: Database["public"]["Enums"]["financial_status"]
          team_id?: string | null
          updated_at?: string
          valor_override?: number | null
          valor_questoes?: number | null
          valor_teoria?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_rules: {
        Row: {
          active: boolean
          amount: number
          created_at: string
          id: string
          professor_id: string | null
          rule_type: Database["public"]["Enums"]["rule_type"]
          team_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number
          created_at?: string
          id?: string
          professor_id?: string | null
          rule_type?: Database["public"]["Enums"]["rule_type"]
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          created_at?: string
          id?: string
          professor_id?: string | null
          rule_type?: Database["public"]["Enums"]["rule_type"]
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_rules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          created_by: string
          error_message: string | null
          finished_at: string | null
          id: string
          input_file_path: string | null
          input_text: string | null
          linked_request_id: string | null
          metadata: Json | null
          output_file_path: string | null
          status: Database["public"]["Enums"]["job_status"]
          type: Database["public"]["Enums"]["job_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input_file_path?: string | null
          input_text?: string | null
          linked_request_id?: string | null
          metadata?: Json | null
          output_file_path?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          type: Database["public"]["Enums"]["job_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input_file_path?: string | null
          input_text?: string | null
          linked_request_id?: string | null
          metadata?: Json | null
          output_file_path?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          type?: Database["public"]["Enums"]["job_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_linked_request_id_fkey"
            columns: ["linked_request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_teams: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          professor_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          professor_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          professor_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_teams_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          admin_notes: string | null
          attachment_path: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["request_priority"]
          professor_id: string
          status: Database["public"]["Enums"]["request_status"]
          team_id: string | null
          title: string
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          attachment_path?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          professor_id: string
          status?: Database["public"]["Enums"]["request_status"]
          team_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          attachment_path?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          professor_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          team_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          approved_date: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          linked_request_id: string | null
          professor_id: string
          proposed_date: string
          status: Database["public"]["Enums"]["schedule_status"]
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approved_date?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          linked_request_id?: string | null
          professor_id: string
          proposed_date: string
          status?: Database["public"]["Enums"]["schedule_status"]
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approved_date?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          linked_request_id?: string | null
          professor_id?: string
          proposed_date?: string
          status?: Database["public"]["Enums"]["schedule_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_linked_request_id_fkey"
            columns: ["linked_request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes: {
        Row: {
          attachment_path: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["request_priority"]
          professor_id: string
          status: Database["public"]["Enums"]["solicitacao_status"]
          team_id: string | null
          title: string
          type: Database["public"]["Enums"]["solicitacao_type"]
          updated_at: string
        }
        Insert: {
          attachment_path?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          professor_id: string
          status?: Database["public"]["Enums"]["solicitacao_status"]
          team_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["solicitacao_type"]
          updated_at?: string
        }
        Update: {
          attachment_path?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          professor_id?: string
          status?: Database["public"]["Enums"]["solicitacao_status"]
          team_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["solicitacao_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          has_custom_steps: boolean
          has_triage: boolean
          id: string
          is_legislacao: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          has_custom_steps?: boolean
          has_triage?: boolean
          id?: string
          is_legislacao?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          has_custom_steps?: boolean
          has_triage?: boolean
          id?: string
          is_legislacao?: boolean
          name?: string
        }
        Relationships: []
      }
      triage_items: {
        Row: {
          assistant_id: string | null
          banca: string | null
          concurso: string | null
          created_at: string
          data_envio: string | null
          data_prova: string | null
          decided_at: string | null
          disponibilidade: string | null
          id: string
          nivel: string | null
          notes: string | null
          professor_responsavel_id: string | null
          qtde_questoes_legislacao: number | null
          solicitacao_id: string
          status: Database["public"]["Enums"]["triage_status"]
          updated_at: string
        }
        Insert: {
          assistant_id?: string | null
          banca?: string | null
          concurso?: string | null
          created_at?: string
          data_envio?: string | null
          data_prova?: string | null
          decided_at?: string | null
          disponibilidade?: string | null
          id?: string
          nivel?: string | null
          notes?: string | null
          professor_responsavel_id?: string | null
          qtde_questoes_legislacao?: number | null
          solicitacao_id: string
          status?: Database["public"]["Enums"]["triage_status"]
          updated_at?: string
        }
        Update: {
          assistant_id?: string | null
          banca?: string | null
          concurso?: string | null
          created_at?: string
          data_envio?: string | null
          data_prova?: string | null
          decided_at?: string | null
          disponibilidade?: string | null
          id?: string
          nivel?: string | null
          notes?: string | null
          professor_responsavel_id?: string | null
          qtde_questoes_legislacao?: number | null
          solicitacao_id?: string
          status?: Database["public"]["Enums"]["triage_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "triage_items_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes"
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_any_professor: { Args: { _user_id: string }; Returns: boolean }
      is_assistant_of_team: { Args: { _team_id: string }; Returns: boolean }
    }
    Enums: {
      agent_status: "active" | "paused"
      app_role:
        | "admin"
        | "professor"
        | "assistant"
        | "professor_managed"
        | "professor_autonomous"
      delivery_status:
        | "pendente"
        | "em_producao"
        | "em_revisao"
        | "entregue"
        | "cancelada"
      financial_status: "pendente" | "pago" | "cancelado"
      job_status: "pending" | "processing" | "done" | "error"
      job_type: "gerar_pptx" | "formatar_questoes" | "revisar_docx"
      notification_type: "info" | "sucesso" | "alerta" | "erro"
      request_priority: "normal" | "urgente"
      request_status: "aberta" | "em_andamento" | "concluida" | "cancelada"
      request_type:
        | "formatacao_questoes"
        | "gerar_slides"
        | "revisao_material"
        | "outro"
      rule_type: "fixo" | "percentual" | "por_entrega"
      run_status: "pending" | "success" | "error"
      schedule_status:
        | "pendente_aprovacao"
        | "aprovado"
        | "entregue"
        | "atrasado"
        | "cancelado"
      solicitacao_status:
        | "aberta"
        | "em_triagem"
        | "aprovada"
        | "convertida"
        | "rejeitada"
        | "cancelada"
      solicitacao_type:
        | "material"
        | "slide"
        | "revisao"
        | "outro"
        | "revisao_formato"
        | "gerar_slides"
        | "selecao_questoes"
        | "atualizar_questoes_bo"
      step_status: "pendente" | "em_andamento" | "concluida" | "bloqueada"
      step_type: "triagem" | "producao" | "revisao" | "entrega" | "custom"
      triage_status:
        | "pendente"
        | "em_analise"
        | "aprovada"
        | "rejeitada"
        | "analise_interesse"
        | "lancado"
        | "restringido"
        | "redirecionado"
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
      agent_status: ["active", "paused"],
      app_role: [
        "admin",
        "professor",
        "assistant",
        "professor_managed",
        "professor_autonomous",
      ],
      delivery_status: [
        "pendente",
        "em_producao",
        "em_revisao",
        "entregue",
        "cancelada",
      ],
      financial_status: ["pendente", "pago", "cancelado"],
      job_status: ["pending", "processing", "done", "error"],
      job_type: ["gerar_pptx", "formatar_questoes", "revisar_docx"],
      notification_type: ["info", "sucesso", "alerta", "erro"],
      request_priority: ["normal", "urgente"],
      request_status: ["aberta", "em_andamento", "concluida", "cancelada"],
      request_type: [
        "formatacao_questoes",
        "gerar_slides",
        "revisao_material",
        "outro",
      ],
      rule_type: ["fixo", "percentual", "por_entrega"],
      run_status: ["pending", "success", "error"],
      schedule_status: [
        "pendente_aprovacao",
        "aprovado",
        "entregue",
        "atrasado",
        "cancelado",
      ],
      solicitacao_status: [
        "aberta",
        "em_triagem",
        "aprovada",
        "convertida",
        "rejeitada",
        "cancelada",
      ],
      solicitacao_type: [
        "material",
        "slide",
        "revisao",
        "outro",
        "revisao_formato",
        "gerar_slides",
        "selecao_questoes",
        "atualizar_questoes_bo",
      ],
      step_status: ["pendente", "em_andamento", "concluida", "bloqueada"],
      step_type: ["triagem", "producao", "revisao", "entrega", "custom"],
      triage_status: [
        "pendente",
        "em_analise",
        "aprovada",
        "rejeitada",
        "analise_interesse",
        "lancado",
        "restringido",
        "redirecionado",
      ],
    },
  },
} as const

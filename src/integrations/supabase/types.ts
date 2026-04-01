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
      avisos: {
        Row: {
          congresso_id: string
          conteudo: string | null
          created_at: string
          created_by: string
          destaque: boolean
          id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          congresso_id: string
          conteudo?: string | null
          created_at?: string
          created_by: string
          destaque?: boolean
          id?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          congresso_id?: string
          conteudo?: string | null
          created_at?: string
          created_by?: string
          destaque?: boolean
          id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_congresso_id_fkey"
            columns: ["congresso_id"]
            isOneToOne: false
            referencedRelation: "congressos"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          congresso_id: string
          created_at: string
          created_by: string
          id: string
          nome: string | null
          tipo: string
        }
        Insert: {
          congresso_id: string
          created_at?: string
          created_by: string
          id?: string
          nome?: string | null
          tipo?: string
        }
        Update: {
          congresso_id?: string
          created_at?: string
          created_by?: string
          id?: string
          nome?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_congresso_id_fkey"
            columns: ["congresso_id"]
            isOneToOne: false
            referencedRelation: "congressos"
            referencedColumns: ["id"]
          },
        ]
      }
      congresso_members: {
        Row: {
          congresso_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          congresso_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          congresso_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "congresso_members_congresso_id_fkey"
            columns: ["congresso_id"]
            isOneToOne: false
            referencedRelation: "congressos"
            referencedColumns: ["id"]
          },
        ]
      }
      congressos: {
        Row: {
          codigo: string
          created_at: string
          created_by: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          created_by: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          created_by?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      escala_musicas: {
        Row: {
          artista: string | null
          created_at: string
          escala_id: string
          id: string
          nome: string
          ordem: number
          tom: string | null
        }
        Insert: {
          artista?: string | null
          created_at?: string
          escala_id: string
          id?: string
          nome: string
          ordem?: number
          tom?: string | null
        }
        Update: {
          artista?: string | null
          created_at?: string
          escala_id?: string
          id?: string
          nome?: string
          ordem?: number
          tom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escala_musicas_escala_id_fkey"
            columns: ["escala_id"]
            isOneToOne: false
            referencedRelation: "escalas"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_participantes: {
        Row: {
          confirmado: boolean | null
          created_at: string
          escala_id: string
          id: string
          user_id: string
        }
        Insert: {
          confirmado?: boolean | null
          created_at?: string
          escala_id: string
          id?: string
          user_id: string
        }
        Update: {
          confirmado?: boolean | null
          created_at?: string
          escala_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escala_participantes_escala_id_fkey"
            columns: ["escala_id"]
            isOneToOne: false
            referencedRelation: "escalas"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_roteiro: {
        Row: {
          created_at: string
          descricao: string | null
          escala_id: string
          hora: string | null
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          escala_id: string
          hora?: string | null
          id?: string
          ordem?: number
          titulo: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          escala_id?: string
          hora?: string | null
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "escala_roteiro_escala_id_fkey"
            columns: ["escala_id"]
            isOneToOne: false
            referencedRelation: "escalas"
            referencedColumns: ["id"]
          },
        ]
      }
      escalas: {
        Row: {
          confirmacao: boolean
          congresso_id: string
          created_at: string
          created_by: string
          data: string | null
          hora: string | null
          id: string
          observacoes: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          confirmacao?: boolean
          congresso_id: string
          created_at?: string
          created_by: string
          data?: string | null
          hora?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          confirmacao?: boolean
          congresso_id?: string
          created_at?: string
          created_by?: string
          data?: string | null
          hora?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalas_congresso_id_fkey"
            columns: ["congresso_id"]
            isOneToOne: false
            referencedRelation: "congressos"
            referencedColumns: ["id"]
          },
        ]
      }
      funcoes: {
        Row: {
          congresso_id: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          congresso_id: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          congresso_id?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcoes_congresso_id_fkey"
            columns: ["congresso_id"]
            isOneToOne: false
            referencedRelation: "congressos"
            referencedColumns: ["id"]
          },
        ]
      }
      membro_funcoes: {
        Row: {
          congresso_id: string
          created_at: string
          funcao_id: string
          id: string
          user_id: string
        }
        Insert: {
          congresso_id: string
          created_at?: string
          funcao_id: string
          id?: string
          user_id: string
        }
        Update: {
          congresso_id?: string
          created_at?: string
          funcao_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membro_funcoes_congresso_id_fkey"
            columns: ["congresso_id"]
            isOneToOne: false
            referencedRelation: "congressos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membro_funcoes_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          congresso_id: string
          conteudo: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          congresso_id: string
          conteudo: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          congresso_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_congresso_id_fkey"
            columns: ["congresso_id"]
            isOneToOne: false
            referencedRelation: "congressos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      repertorio: {
        Row: {
          album: string | null
          artista: string | null
          audio_url: string | null
          bpm: string | null
          cifra: string | null
          classificacao: string | null
          congresso_id: string
          created_at: string
          created_by: string
          duracao: string | null
          id: string
          letra: string | null
          letra_url: string | null
          nome: string
          tom: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          album?: string | null
          artista?: string | null
          audio_url?: string | null
          bpm?: string | null
          cifra?: string | null
          classificacao?: string | null
          congresso_id: string
          created_at?: string
          created_by: string
          duracao?: string | null
          id?: string
          letra?: string | null
          letra_url?: string | null
          nome: string
          tom?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          album?: string | null
          artista?: string | null
          audio_url?: string | null
          bpm?: string | null
          cifra?: string | null
          classificacao?: string | null
          congresso_id?: string
          created_at?: string
          created_by?: string
          duracao?: string | null
          id?: string
          letra?: string | null
          letra_url?: string | null
          nome?: string
          tom?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repertorio_congresso_id_fkey"
            columns: ["congresso_id"]
            isOneToOne: false
            referencedRelation: "congressos"
            referencedColumns: ["id"]
          },
        ]
      }
      roteiro_modelos: {
        Row: {
          congresso_id: string
          created_at: string
          created_by: string
          id: string
          itens: Json
          nome: string
        }
        Insert: {
          congresso_id: string
          created_at?: string
          created_by: string
          id?: string
          itens?: Json
          nome: string
        }
        Update: {
          congresso_id?: string
          created_at?: string
          created_by?: string
          id?: string
          itens?: Json
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "roteiro_modelos_congresso_id_fkey"
            columns: ["congresso_id"]
            isOneToOne: false
            referencedRelation: "congressos"
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

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nickname: string
          profile_image: string | null
          manner_score: number
          department: string | null
          student_id: string | null
          bio: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nickname: string
          profile_image?: string | null
          manner_score?: number
          department?: string | null
          student_id?: string | null
          bio?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nickname?: string
          profile_image?: string | null
          manner_score?: number
          department?: string | null
          student_id?: string | null
          bio?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sport_profiles: {
        Row: {
          id: string
          user_id: string
          sport: string
          level: string
          position: string | null
          career: string | null
          available_days: string[]
          available_times: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sport: string
          level: string
          position?: string | null
          career?: string | null
          available_days?: string[]
          available_times?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sport?: string
          level?: string
          position?: string | null
          career?: string | null
          available_days?: string[]
          available_times?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contest_profiles: {
        Row: {
          id: string
          user_id: string
          skills: string[]
          portfolio_url: string | null
          awards: string | null
          preferred_roles: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skills?: string[]
          portfolio_url?: string | null
          awards?: string | null
          preferred_roles?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skills?: string[]
          portfolio_url?: string | null
          awards?: string | null
          preferred_roles?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          host_id: string
          title: string
          sport: string
          match_type: string
          level: string
          location: string
          scheduled_at: string
          max_players: number
          reserve_slots: number
          current_players: number
          description: string | null
          status: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          title: string
          sport: string
          match_type?: string
          level?: string
          location: string
          scheduled_at: string
          max_players?: number
          reserve_slots?: number
          current_players?: number
          description?: string | null
          status?: string
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          title?: string
          sport?: string
          match_type?: string
          level?: string
          location?: string
          scheduled_at?: string
          max_players?: number
          reserve_slots?: number
          current_players?: number
          description?: string | null
          status?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_applications: {
        Row: {
          id: string
          match_id: string
          applicant_id: string
          message: string | null
          slot_type: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          applicant_id: string
          message?: string | null
          slot_type?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          applicant_id?: string
          message?: string | null
          slot_type?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_rooms: {
        Row: {
          id: string
          match_id: string
          user1_id: string
          user2_id: string
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          user1_id: string
          user2_id: string
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          match_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_id: string
          reason: string
          detail: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_id: string
          reason: string
          detail?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_id?: string
          reason?: string
          detail?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      contest_teams: {
        Row: {
          id: string
          contest_id: string
          leader_id: string
          team_name: string
          description: string | null
          max_members: number
          current_members: number
          required_skills: string[]
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contest_id: string
          leader_id: string
          team_name: string
          description?: string | null
          max_members?: number
          current_members?: number
          required_skills?: string[]
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contest_id?: string
          leader_id?: string
          team_name?: string
          description?: string | null
          max_members?: number
          current_members?: number
          required_skills?: string[]
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contest_team_applications: {
        Row: {
          id: string
          team_id: string
          applicant_id: string
          message: string | null
          role: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          applicant_id: string
          message?: string | null
          role?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          applicant_id?: string
          message?: string | null
          role?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contest_chat_rooms: {
        Row: {
          id: string
          team_id: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          created_at?: string
        }
        Relationships: []
      }
      contest_chat_members: {
        Row: {
          id: string
          room_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          joined_at?: string
        }
        Relationships: []
      }
      contest_chat_messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      sports_reservations: {
        Row: {
          id: string
          facility_name: string
          facility_type: string
          location: string
          available_date: string
          available_slots: Json
          source_url: string | null
          crawled_at: string
        }
        Insert: {
          id?: string
          facility_name: string
          facility_type: string
          location: string
          available_date: string
          available_slots?: Json
          source_url?: string | null
          crawled_at?: string
        }
        Update: {
          id?: string
          facility_name?: string
          facility_type?: string
          location?: string
          available_date?: string
          available_slots?: Json
          source_url?: string | null
          crawled_at?: string
        }
        Relationships: []
      }
      external_contests: {
        Row: {
          id: string
          title: string
          organizer: string
          category: string
          region: string
          deadline: string
          prize: string | null
          description: string | null
          url: string | null
          ai_summary: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          organizer: string
          category: string
          region: string
          deadline: string
          prize?: string | null
          description?: string | null
          url?: string | null
          ai_summary?: string | null
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          organizer?: string
          category?: string
          region?: string
          deadline?: string
          prize?: string | null
          description?: string | null
          url?: string | null
          ai_summary?: string | null
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_match_list: {
        Row: {
          id: string
          host_id: string
          title: string
          sport: string
          match_type: string
          level: string
          location: string
          scheduled_at: string
          max_players: number
          reserve_slots: number
          current_players: number
          status: string
          expires_at: string
          created_at: string
          host_nickname: string
          host_manner_score: number
          host_profile_image: string | null
        }
        Insert: { [_ in never]: never }
        Update: { [_ in never]: never }
        Relationships: []
      }
      v_applicant_detail: {
        Row: {
          id: string
          match_id: string
          applicant_id: string
          message: string | null
          slot_type: string
          status: string
          applicant_nickname: string
          applicant_manner_score: number
        }
        Insert: { [_ in never]: never }
        Update: { [_ in never]: never }
        Relationships: []
      }
      v_contest_team_list: {
        Row: {
          id: string
          contest_id: string
          leader_id: string
          team_name: string
          description: string | null
          max_members: number
          current_members: number
          required_skills: string[]
          status: string
          created_at: string
          leader_nickname: string
          leader_manner_score: number
        }
        Insert: { [_ in never]: never }
        Update: { [_ in never]: never }
        Relationships: []
      }
    }
    Functions: {
      fn_is_nickname_available: {
        Args: { p_nickname: string }
        Returns: boolean
      }
      fn_cleanup_expired_matches: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fn_cleanup_expired_external_contests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type MatchApplication = Database['public']['Tables']['match_applications']['Row']
export type ContestTeam = Database['public']['Tables']['contest_teams']['Row']
export type ContestTeamApplication = Database['public']['Tables']['contest_team_applications']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type MessageRoom = Database['public']['Tables']['message_rooms']['Row']
export type ContestChatMessage = Database['public']['Tables']['contest_chat_messages']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type VMatchList = Database['public']['Views']['v_match_list']['Row']
export type VContestTeamList = Database['public']['Views']['v_contest_team_list']['Row']

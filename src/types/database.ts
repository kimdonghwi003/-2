export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nickname: string
          student_id: string
          full_name: string
          department: string
          avatar_url: string | null
          manner_score: number
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nickname: string
          student_id?: string
          full_name?: string
          department?: string
          avatar_url?: string | null
          manner_score?: number
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nickname?: string
          student_id?: string
          full_name?: string
          department?: string
          avatar_url?: string | null
          manner_score?: number
          role?: string
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
          skill_level: string
          position: string | null
          gender: string | null
          age: number | null
          career_years: number
          is_pro: boolean
          intro: string | null
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sport: string
          skill_level: string
          position?: string | null
          gender?: string | null
          age?: number | null
          career_years?: number
          is_pro?: boolean
          intro?: string | null
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sport?: string
          skill_level?: string
          position?: string | null
          gender?: string | null
          age?: number | null
          career_years?: number
          is_pro?: boolean
          intro?: string | null
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contest_profiles: {
        Row: {
          id: string
          user_id: string
          department: string
          gender: string | null
          age: number | null
          contest_count: number
          certificates: string[]
          fields: string[]
          intro: string | null
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          department?: string
          gender?: string | null
          age?: number | null
          contest_count?: number
          certificates?: string[]
          fields?: string[]
          intro?: string | null
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          department?: string
          gender?: string | null
          age?: number | null
          contest_count?: number
          certificates?: string[]
          fields?: string[]
          intro?: string | null
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          author_id: string
          team_name: string
          sport: string
          match_size: string
          location: string
          description: string | null
          required_level: string
          status: string
          match_datetime: string
          max_players: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          team_name: string
          sport: string
          match_size: string
          location: string
          description?: string | null
          required_level: string
          status?: string
          match_datetime: string
          max_players?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          team_name?: string
          sport?: string
          match_size?: string
          location?: string
          description?: string | null
          required_level?: string
          status?: string
          match_datetime?: string
          max_players?: number
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
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          applicant_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          applicant_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_rooms: {
        Row: {
          id: string
          application_id: string
          participant_1: string
          participant_2: string
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          participant_1: string
          participant_2: string
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          participant_1?: string
          participant_2?: string
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
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string
          content?: string
          is_read?: boolean
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
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          message: string
          is_read: boolean
          related_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          message: string
          is_read?: boolean
          related_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          message?: string
          is_read?: boolean
          related_id?: string | null
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
          contest_id: number
          leader_id: string
          team_name: string
          description: string | null
          required_roles: string[]
          max_size: number
          current_count: number
          is_recruiting: boolean
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          contest_id: number
          leader_id: string
          team_name: string
          description?: string | null
          required_roles?: string[]
          max_size?: number
          current_count?: number
          is_recruiting?: boolean
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          contest_id?: number
          leader_id?: string
          team_name?: string
          description?: string | null
          required_roles?: string[]
          max_size?: number
          current_count?: number
          is_recruiting?: boolean
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      contest_team_applications: {
        Row: {
          id: string
          team_id: string
          applicant_id: string
          message: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          applicant_id: string
          message?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          applicant_id?: string
          message?: string | null
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
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name?: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
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
          facility: string
          reservation_date: string
          start_time: string
          end_time: string
          status: string
          last_crawled_at: string
        }
        Insert: {
          id?: string
          facility: string
          reservation_date: string
          start_time: string
          end_time: string
          status?: string
          last_crawled_at?: string
        }
        Update: {
          id?: string
          facility?: string
          reservation_date?: string
          start_time?: string
          end_time?: string
          status?: string
          last_crawled_at?: string
        }
        Relationships: []
      }
      external_contests: {
        Row: {
          id: string
          title: string
          url: string
          category: string | null
          organizer: string | null
          deadline: string
          source: string | null
          description: string | null
          thumbnail_url: string | null
          is_active: boolean
          last_crawled_at: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          url: string
          category?: string | null
          organizer?: string | null
          deadline: string
          source?: string | null
          description?: string | null
          thumbnail_url?: string | null
          is_active?: boolean
          last_crawled_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          url?: string
          category?: string | null
          organizer?: string | null
          deadline?: string
          source?: string | null
          description?: string | null
          thumbnail_url?: string | null
          is_active?: boolean
          last_crawled_at?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_match_list: {
        Row: {
          id: string
          author_id: string
          author_nickname: string
          author_manner_score: number
          team_name: string
          sport: string
          match_size: string
          location: string
          description: string | null
          required_level: string
          status: string
          match_datetime: string
          max_players: number
          created_at: string
          pending_count: number
          accepted_count: number
          display_count: number
        }
        Relationships: []
      }
      v_applicant_detail: {
        Row: {
          application_id: string
          match_id: string
          status: string
          applied_at: string
          applicant_id: string
          nickname: string
          manner_score: number
          sport: string | null
          skill_level: string | null
          position: string | null
          career_years: number | null
          is_pro: boolean | null
          is_skill_unregistered: boolean
        }
        Relationships: []
      }
      v_contest_team_list: {
        Row: {
          id: string
          contest_id: number
          leader_id: string
          leader_nickname: string
          team_name: string
          description: string | null
          required_roles: string[]
          max_size: number
          current_count: number
          remaining_slots: number
          is_recruiting: boolean
          status: string
          created_at: string
          pending_applications: number
        }
        Relationships: []
      }
    }
    Functions: {
      fn_is_nickname_available: {
        Args: { p_nickname: string }
        Returns: boolean
      }
      fn_cleanup_expired_matches: {
        Args: Record<string, never>
        Returns: number
      }
      fn_cleanup_expired_external_contests: {
        Args: Record<string, never>
        Returns: number
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}

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
      blog_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          comments_count: number
          content: string
          cover_image_url: string | null
          created_at: string
          id: string
          likes_count: number
          published: boolean
          shares_count: number
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id: string
          comments_count?: number
          content: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          likes_count?: number
          published?: boolean
          shares_count?: number
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string
          comments_count?: number
          content?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          likes_count?: number
          published?: boolean
          shares_count?: number
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          from_user_id: string | null
          id: string
          message: string
          read: boolean
          type: string
          user_id: string
          video_id: string | null
        }
        Insert: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          message: string
          read?: boolean
          type: string
          user_id: string
          video_id?: string | null
        }
        Update: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          viewed_on: string
          viewed_user_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          viewed_on?: string
          viewed_user_id: string
          viewer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          viewed_on?: string
          viewed_user_id?: string
          viewer_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apg: number | null
          avatar_url: string | null
          bio: string | null
          comment_privacy: string
          comparison_player: string | null
          created_at: string
          display_name: string | null
          dob: string | null
          dominant_hand: string | null
          followers_count: number
          following_count: number
          ft_pct: number | null
          gpa: number | null
          graduation_year: number | null
          height_cm: number | null
          highlights_link: string | null
          id: string
          league: string | null
          notify_comments: boolean
          notify_followers: boolean
          notify_likes: boolean
          notify_messages: boolean
          position: string | null
          ppg: number | null
          private_profile: boolean
          rpg: number | null
          secondary_position: string | null
          sprint_20m_sec: number | null
          status: Database["public"]["Enums"]["user_status"]
          team: string | null
          three_pt_pct: number | null
          top_traits: string | null
          updated_at: string
          user_id: string
          verified: boolean
          vertical_leap_cm: number | null
          weight_kg: number | null
          wingspan_cm: number | null
        }
        Insert: {
          apg?: number | null
          avatar_url?: string | null
          bio?: string | null
          comment_privacy?: string
          comparison_player?: string | null
          created_at?: string
          display_name?: string | null
          dob?: string | null
          dominant_hand?: string | null
          followers_count?: number
          following_count?: number
          ft_pct?: number | null
          gpa?: number | null
          graduation_year?: number | null
          height_cm?: number | null
          highlights_link?: string | null
          id?: string
          league?: string | null
          notify_comments?: boolean
          notify_followers?: boolean
          notify_likes?: boolean
          notify_messages?: boolean
          position?: string | null
          ppg?: number | null
          private_profile?: boolean
          rpg?: number | null
          secondary_position?: string | null
          sprint_20m_sec?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          team?: string | null
          three_pt_pct?: number | null
          top_traits?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
          vertical_leap_cm?: number | null
          weight_kg?: number | null
          wingspan_cm?: number | null
        }
        Update: {
          apg?: number | null
          avatar_url?: string | null
          bio?: string | null
          comment_privacy?: string
          comparison_player?: string | null
          created_at?: string
          display_name?: string | null
          dob?: string | null
          dominant_hand?: string | null
          followers_count?: number
          following_count?: number
          ft_pct?: number | null
          gpa?: number | null
          graduation_year?: number | null
          height_cm?: number | null
          highlights_link?: string | null
          id?: string
          league?: string | null
          notify_comments?: boolean
          notify_followers?: boolean
          notify_likes?: boolean
          notify_messages?: boolean
          position?: string | null
          ppg?: number | null
          private_profile?: boolean
          rpg?: number | null
          secondary_position?: string | null
          sprint_20m_sec?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          team?: string | null
          three_pt_pct?: number | null
          top_traits?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
          vertical_leap_cm?: number | null
          weight_kg?: number | null
          wingspan_cm?: number | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
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
      user_types: {
        Row: {
          created_at: string
          id: string
          type: Database["public"]["Enums"]["user_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          type: Database["public"]["Enums"]["user_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          caption: string | null
          comments_count: number
          created_at: string
          gallery_urls: string[] | null
          id: string
          likes_count: number
          media_type: string
          shares_count: number
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string
          views_count: number
        }
        Insert: {
          caption?: string | null
          comments_count?: number
          created_at?: string
          gallery_urls?: string[] | null
          id?: string
          likes_count?: number
          media_type?: string
          shares_count?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url: string
          views_count?: number
        }
        Update: {
          caption?: string | null
          comments_count?: number
          created_at?: string
          gallery_urls?: string[] | null
          id?: string
          likes_count?: number
          media_type?: string
          shares_count?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_user_content: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      admin_set_user_status: {
        Args: {
          p_status: Database["public"]["Enums"]["user_status"]
          p_user_id: string
        }
        Returns: undefined
      }
      admin_toggle_verified: { Args: { p_user_id: string }; Returns: boolean }
      delete_own_account: { Args: never; Returns: undefined }
      get_profile_view_stats: {
        Args: { p_user_id: string }
        Returns: {
          viewer_type: Database["public"]["Enums"]["user_type"]
          views: number
        }[]
      }
      get_user_status: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_status"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_profile_view: {
        Args: { p_viewed_user_id: string }
        Returns: undefined
      }
      toggle_blog_like: { Args: { p_post_id: string }; Returns: boolean }
      toggle_video_like: { Args: { p_video_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      user_status: "active" | "frozen" | "blocked"
      user_type: "player" | "coach" | "scout" | "professional"
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
      app_role: ["admin", "moderator", "user"],
      user_status: ["active", "frozen", "blocked"],
      user_type: ["player", "coach", "scout", "professional"],
    },
  },
} as const

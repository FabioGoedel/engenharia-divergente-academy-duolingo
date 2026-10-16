// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_attempts: {
        Row: {
          active_time_seconds: number
          activity_version: number
          completed_at: string | null
          current_exercise_index: number
          hints_used_total: number
          id: string
          metadata: Json
          mission_id: string
          node_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          total_xp_awarded: number
          track_id: string | null
          track_version: number | null
          user_id: string
        }
        Insert: {
          active_time_seconds?: number
          activity_version?: number
          completed_at?: string | null
          current_exercise_index?: number
          hints_used_total?: number
          id?: string
          metadata?: Json
          mission_id: string
          node_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          total_xp_awarded?: number
          track_id?: string | null
          track_version?: number | null
          user_id: string
        }
        Update: {
          active_time_seconds?: number
          activity_version?: number
          completed_at?: string | null
          current_exercise_index?: number
          hints_used_total?: number
          id?: string
          metadata?: Json
          mission_id?: string
          node_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          total_xp_awarded?: number
          track_id?: string | null
          track_version?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_difficulty_feedback: {
        Row: {
          attempt_id: string
          created_at: string
          exercise_id: string
          guessed: boolean
          id: string
          perceived_difficulty: number
          user_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          exercise_id: string
          guessed?: boolean
          id?: string
          perceived_difficulty: number
          user_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          exercise_id?: string
          guessed?: boolean
          id?: string
          perceived_difficulty?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_difficulty_feedback_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "activity_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_difficulty_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_answers: {
        Row: {
          active_seconds: number
          answered_at: string
          assistance_degree: string
          attempt_id: string
          competency_code: string | null
          exercise_id: string
          exercise_version: number
          formula_was_hidden: boolean
          grade_result: Json
          guessed: boolean
          hints_used_count: number
          id: string
          is_correct: boolean
          perceived_difficulty: number | null
          question_id: string | null
          score_percent: number
          student_answer: Json
          user_id: string
        }
        Insert: {
          active_seconds?: number
          answered_at?: string
          assistance_degree?: string
          attempt_id: string
          competency_code?: string | null
          exercise_id: string
          exercise_version?: number
          formula_was_hidden?: boolean
          grade_result?: Json
          guessed?: boolean
          hints_used_count?: number
          id?: string
          is_correct: boolean
          perceived_difficulty?: number | null
          question_id?: string | null
          score_percent?: number
          student_answer: Json
          user_id: string
        }
        Update: {
          active_seconds?: number
          answered_at?: string
          assistance_degree?: string
          attempt_id?: string
          competency_code?: string | null
          exercise_id?: string
          exercise_version?: number
          formula_was_hidden?: boolean
          grade_result?: Json
          guessed?: boolean
          hints_used_count?: number
          id?: string
          is_correct?: boolean
          perceived_difficulty?: number | null
          question_id?: string | null
          score_percent?: number
          student_answer?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "activity_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "view_student_question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_events: {
        Row: {
          attempt_id: string
          created_at: string
          event_type: string
          exercise_id: string | null
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          event_type: string
          exercise_id?: string | null
          id?: string
          payload?: Json
          user_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          event_type?: string
          exercise_id?: string | null
          id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_events_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "activity_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action_type"]
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          ip_address: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action_type"]
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action_type"]
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      block_track_references: {
        Row: {
          block_id: string
          created_at: string
          id: string
          module_id: string
          product_id: string
        }
        Insert: {
          block_id: string
          created_at?: string
          id?: string
          module_id: string
          product_id: string
        }
        Update: {
          block_id?: string
          created_at?: string
          id?: string
          module_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_track_references_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "content_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_track_references_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      block_versions: {
        Row: {
          block_id: string
          id: string
          published_at: string
          published_by: string | null
          snapshot: Json
          version_number: number
        }
        Insert: {
          block_id: string
          id?: string
          published_at?: string
          published_by?: string | null
          snapshot: Json
          version_number: number
        }
        Update: {
          block_id?: string
          id?: string
          published_at?: string
          published_by?: string | null
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "block_versions_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "content_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          code: string
          grade_score: number | null
          id: string
          issued_at: string
          product_id: string
          user_id: string
          verification_hash: string
        }
        Insert: {
          code: string
          grade_score?: number | null
          id?: string
          issued_at?: string
          product_id: string
          user_id: string
          verification_hash: string
        }
        Update: {
          code?: string
          grade_score?: number | null
          id?: string
          issued_at?: string
          product_id?: string
          user_id?: string
          verification_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          associated_competencies: string[] | null
          author: string | null
          block_type: string
          category: Database["public"]["Enums"]["block_category"]
          completion_policy: Database["public"]["Enums"]["block_completion_policy"]
          config_json: Json
          created_at: string
          created_by: string | null
          description: string | null
          editorial_status: Database["public"]["Enums"]["editorial_status"]
          estimated_minutes: number | null
          id: string
          import_batch_id: string | null
          initial_difficulty: number | null
          media_references: Json | null
          referenced_media_id: string | null
          referenced_question_id: string | null
          revision: number | null
          subject_area: string | null
          tags: string[] | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          associated_competencies?: string[] | null
          author?: string | null
          block_type: string
          category: Database["public"]["Enums"]["block_category"]
          completion_policy?: Database["public"]["Enums"]["block_completion_policy"]
          config_json: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          editorial_status?: Database["public"]["Enums"]["editorial_status"]
          estimated_minutes?: number | null
          id?: string
          import_batch_id?: string | null
          initial_difficulty?: number | null
          media_references?: Json | null
          referenced_media_id?: string | null
          referenced_question_id?: string | null
          revision?: number | null
          subject_area?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          associated_competencies?: string[] | null
          author?: string | null
          block_type?: string
          category?: Database["public"]["Enums"]["block_category"]
          completion_policy?: Database["public"]["Enums"]["block_completion_policy"]
          config_json?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          editorial_status?: Database["public"]["Enums"]["editorial_status"]
          estimated_minutes?: number | null
          id?: string
          import_batch_id?: string | null
          initial_difficulty?: number | null
          media_references?: Json | null
          referenced_media_id?: string | null
          referenced_question_id?: string | null
          revision?: number | null
          subject_area?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_blocks_referenced_media_id_fkey"
            columns: ["referenced_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_blocks_referenced_question_id_fkey"
            columns: ["referenced_question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_blocks_referenced_question_id_fkey"
            columns: ["referenced_question_id"]
            isOneToOne: false
            referencedRelation: "view_student_question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      content_import_batches: {
        Row: {
          batch_status: string
          created_at: string
          execution_errors: Json | null
          failed_count: number
          file_name: string
          file_size_bytes: number | null
          format_detected: string
          id: string
          imported_block_ids: string[] | null
          imported_blocks_count: number
          imported_by_id: string | null
          imported_by_name: string | null
          imported_question_ids: string[] | null
          imported_questions_count: number
          rollback_reason: string | null
          rolled_back: boolean
          rolled_back_at: string | null
          rolled_back_by_id: string | null
          rolled_back_by_name: string | null
          skipped_count: number
          total_items: number
        }
        Insert: {
          batch_status?: string
          created_at?: string
          execution_errors?: Json | null
          failed_count?: number
          file_name: string
          file_size_bytes?: number | null
          format_detected: string
          id: string
          imported_block_ids?: string[] | null
          imported_blocks_count?: number
          imported_by_id?: string | null
          imported_by_name?: string | null
          imported_question_ids?: string[] | null
          imported_questions_count?: number
          rollback_reason?: string | null
          rolled_back?: boolean
          rolled_back_at?: string | null
          rolled_back_by_id?: string | null
          rolled_back_by_name?: string | null
          skipped_count?: number
          total_items?: number
        }
        Update: {
          batch_status?: string
          created_at?: string
          execution_errors?: Json | null
          failed_count?: number
          file_name?: string
          file_size_bytes?: number | null
          format_detected?: string
          id?: string
          imported_block_ids?: string[] | null
          imported_blocks_count?: number
          imported_by_id?: string | null
          imported_by_name?: string | null
          imported_question_ids?: string[] | null
          imported_questions_count?: number
          rollback_reason?: string | null
          rolled_back?: boolean
          rolled_back_at?: string | null
          rolled_back_by_id?: string | null
          rolled_back_by_name?: string | null
          skipped_count?: number
          total_items?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_import_batches_imported_by_id_fkey"
            columns: ["imported_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_import_batches_rolled_back_by_id_fkey"
            columns: ["rolled_back_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_review_queue: {
        Row: {
          assigned_reviewer: string | null
          created_at: string
          current_status: Database["public"]["Enums"]["editorial_status"]
          decided_at: string | null
          decision_notes: string | null
          entity_id: string
          entity_type: string
          id: string
          requested_by: string | null
        }
        Insert: {
          assigned_reviewer?: string | null
          created_at?: string
          current_status: Database["public"]["Enums"]["editorial_status"]
          decided_at?: string | null
          decision_notes?: string | null
          entity_id: string
          entity_type: string
          id?: string
          requested_by?: string | null
        }
        Update: {
          assigned_reviewer?: string | null
          created_at?: string
          current_status?: Database["public"]["Enums"]["editorial_status"]
          decided_at?: string | null
          decision_notes?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          requested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "editorial_review_queue_assigned_reviewer_fkey"
            columns: ["assigned_reviewer"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_review_queue_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_audit_history: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          new_status: string | null
          previous_status: string | null
          product_id: string
          reason: string | null
          target_user_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          previous_status?: string | null
          product_id: string
          reason?: string | null
          target_user_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          previous_status?: string | null
          product_id?: string
          reason?: string | null
          target_user_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_audit_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_audit_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_audit_history_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          id: string
          product_id: string
          progress_percent: number
          started_at: string
          status: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          product_id: string
          progress_percent?: number
          started_at?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          product_id?: string
          progress_percent?: number
          started_at?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          granted_by_order_id: string | null
          granted_by_subscription_id: string | null
          id: string
          is_active: boolean
          product_id: string
          user_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          granted_by_order_id?: string | null
          granted_by_subscription_id?: string | null
          id?: string
          is_active?: boolean
          product_id: string
          user_id: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          granted_by_order_id?: string | null
          granted_by_subscription_id?: string | null
          id?: string
          is_active?: boolean
          product_id?: string
          user_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_granted_by_order_id_fkey"
            columns: ["granted_by_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_granted_by_subscription_id_fkey"
            columns: ["granted_by_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_achievements: {
        Row: {
          category: string
          code: string
          condition_threshold: number
          condition_type: string
          created_at: string
          description: string
          icon_name: string
          id: string
          is_active: boolean
          rarity: string
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          category?: string
          code: string
          condition_threshold?: number
          condition_type: string
          created_at?: string
          description: string
          icon_name?: string
          id: string
          is_active?: boolean
          rarity?: string
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          category?: string
          code?: string
          condition_threshold?: number
          condition_type?: string
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          rarity?: string
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      gamification_levels: {
        Row: {
          badge_code: string | null
          created_at: string
          id: string
          level_number: number
          min_xp: number
          perks: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge_code?: string | null
          created_at?: string
          id: string
          level_number: number
          min_xp?: number
          perks?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge_code?: string | null
          created_at?: string
          id?: string
          level_number?: number
          min_xp?: number
          perks?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_access_logs: {
        Row: {
          accessed_at: string
          action_type: string
          asset_id: string
          id: string
          metadata: Json | null
          page_reached: number | null
          product_id: string | null
          reading_seconds: number | null
          total_pages: number | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          action_type: string
          asset_id: string
          id?: string
          metadata?: Json | null
          page_reached?: number | null
          product_id?: string | null
          reading_seconds?: number | null
          total_pages?: number | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          action_type?: string
          asset_id?: string
          id?: string
          metadata?: Json | null
          page_reached?: number | null
          product_id?: string | null
          reading_seconds?: number | null
          total_pages?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_access_logs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_access_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_asset_versions: {
        Row: {
          asset_id: string
          file_hash: string | null
          file_size_bytes: number | null
          id: string
          public_url: string | null
          published_at: string
          published_by: string | null
          snapshot: Json
          storage_bucket: string
          storage_path: string | null
          title: string
          version_number: number
        }
        Insert: {
          asset_id: string
          file_hash?: string | null
          file_size_bytes?: number | null
          id?: string
          public_url?: string | null
          published_at?: string
          published_by?: string | null
          snapshot?: Json
          storage_bucket: string
          storage_path?: string | null
          title: string
          version_number: number
        }
        Update: {
          asset_id?: string
          file_hash?: string | null
          file_size_bytes?: number | null
          id?: string
          public_url?: string | null
          published_at?: string
          published_by?: string | null
          snapshot?: Json
          storage_bucket?: string
          storage_path?: string | null
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "media_asset_versions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_asset_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          access_rules: Json | null
          allow_download: boolean | null
          asset_type: Database["public"]["Enums"]["media_asset_type"]
          category_tag: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          external_id: string
          file_extension: string | null
          file_hash: string | null
          file_size_bytes: number | null
          folder_path: string | null
          id: string
          is_archived: boolean | null
          is_mandatory_reading: boolean | null
          is_pending_storage: boolean | null
          license_info: string | null
          mime_type: string | null
          original_filename: string | null
          provider: Database["public"]["Enums"]["media_storage_provider"]
          public_url: string
          related_product_id: string | null
          root_asset_id: string | null
          storage_bucket: string | null
          storage_path: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          transcript_text: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          access_rules?: Json | null
          allow_download?: boolean | null
          asset_type: Database["public"]["Enums"]["media_asset_type"]
          category_tag?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          external_id: string
          file_extension?: string | null
          file_hash?: string | null
          file_size_bytes?: number | null
          folder_path?: string | null
          id?: string
          is_archived?: boolean | null
          is_mandatory_reading?: boolean | null
          is_pending_storage?: boolean | null
          license_info?: string | null
          mime_type?: string | null
          original_filename?: string | null
          provider?: Database["public"]["Enums"]["media_storage_provider"]
          public_url: string
          related_product_id?: string | null
          root_asset_id?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          transcript_text?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          access_rules?: Json | null
          allow_download?: boolean | null
          asset_type?: Database["public"]["Enums"]["media_asset_type"]
          category_tag?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          external_id?: string
          file_extension?: string | null
          file_hash?: string | null
          file_size_bytes?: number | null
          folder_path?: string | null
          id?: string
          is_archived?: boolean | null
          is_mandatory_reading?: boolean | null
          is_pending_storage?: boolean | null
          license_info?: string | null
          mime_type?: string | null
          original_filename?: string | null
          provider?: Database["public"]["Enums"]["media_storage_provider"]
          public_url?: string
          related_product_id?: string | null
          root_asset_id?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          transcript_text?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_root_asset_id_fkey"
            columns: ["root_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          id: string
          status: string
          total_cents: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          status?: string
          total_cents: number
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          status?: string
          total_cents?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          id: string
          order_id: string
          paid_amount_cents: number
          paid_at: string | null
          provider: string
          provider_tx_id: string | null
          status: string
        }
        Insert: {
          id?: string
          order_id: string
          paid_amount_cents: number
          paid_at?: string | null
          provider?: string
          provider_tx_id?: string | null
          status?: string
        }
        Update: {
          id?: string
          order_id?: string
          paid_amount_cents?: number
          paid_at?: string | null
          provider?: string
          provider_tx_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pedagogical_mentor_videos: {
        Row: {
          button_label: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean
          is_mandatory: boolean
          priority: number
          provider: string
          related_node_id: string | null
          related_product_id: string | null
          support_message: string
          thumbnail_url: string | null
          title: string
          trigger_event: string
          updated_at: string
          video_url_or_id: string
        }
        Insert: {
          button_label?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id: string
          is_active?: boolean
          is_mandatory?: boolean
          priority?: number
          provider?: string
          related_node_id?: string | null
          related_product_id?: string | null
          support_message: string
          thumbnail_url?: string | null
          title: string
          trigger_event: string
          updated_at?: string
          video_url_or_id: string
        }
        Update: {
          button_label?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          priority?: number
          provider?: string
          related_node_id?: string | null
          related_product_id?: string | null
          support_message?: string
          thumbnail_url?: string | null
          title?: string
          trigger_event?: string
          updated_at?: string
          video_url_or_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedagogical_mentor_videos_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pedagogical_messages_config: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_impressions_per_user: number
          message_text: string
          priority: number
          title: string
          tone: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          max_impressions_per_user?: number
          message_text: string
          priority?: number
          title: string
          tone?: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_impressions_per_user?: number
          message_text?: string
          priority?: number
          title?: string
          tone?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          code: string
          created_at: string
          id: string
          interval_months: number
          is_active: boolean
          name: string
          price_cents: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          interval_months?: number
          is_active?: boolean
          name: string
          price_cents: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          interval_months?: number
          is_active?: boolean
          name?: string
          price_cents?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          code: string
          created_at: string
          id: string
          is_included_in_base_sub: boolean
          is_published: boolean
          slug: string
          tier: Database["public"]["Enums"]["entitlement_tier"]
          title: string
          workload_hours: number
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          id?: string
          is_included_in_base_sub?: boolean
          is_published?: boolean
          slug: string
          tier?: Database["public"]["Enums"]["entitlement_tier"]
          title: string
          workload_hours?: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          id?: string
          is_included_in_base_sub?: boolean
          is_published?: boolean
          slug?: string
          tier?: Database["public"]["Enums"]["entitlement_tier"]
          title?: string
          workload_hours?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          crea_number: string | null
          created_at: string
          email: string
          full_name: string
          headline: string | null
          id: string
          streak_days: number
          total_xp: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          crea_number?: string | null
          created_at?: string
          email: string
          full_name: string
          headline?: string | null
          id: string
          streak_days?: number
          total_xp?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          crea_number?: string | null
          created_at?: string
          email?: string
          full_name?: string
          headline?: string | null
          id?: string
          streak_days?: number
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      question_bank: {
        Row: {
          authoring_level: number
          competency_code: string
          created_at: string
          created_by: string | null
          editorial_status: Database["public"]["Enums"]["editorial_status"]
          estimated_seconds: number
          explanation_markdown: string
          external_id: string
          hint: string | null
          id: string
          import_batch_id: string | null
          numeric_tolerance_abs: number | null
          numeric_tolerance_rel: number | null
          numeric_unit: string | null
          options: Json | null
          prerequisites: string[] | null
          private_key_json: Json
          prompt_markdown: string
          question_type: Database["public"]["Enums"]["question_type"]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          revision: number | null
          subject_area: string
          tags: string[] | null
          title: string
          updated_at: string
          version: number
          xp_reward: number
        }
        Insert: {
          authoring_level: number
          competency_code: string
          created_at?: string
          created_by?: string | null
          editorial_status?: Database["public"]["Enums"]["editorial_status"]
          estimated_seconds?: number
          explanation_markdown: string
          external_id: string
          hint?: string | null
          id?: string
          import_batch_id?: string | null
          numeric_tolerance_abs?: number | null
          numeric_tolerance_rel?: number | null
          numeric_unit?: string | null
          options?: Json | null
          prerequisites?: string[] | null
          private_key_json: Json
          prompt_markdown: string
          question_type: Database["public"]["Enums"]["question_type"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision?: number | null
          subject_area: string
          tags?: string[] | null
          title: string
          updated_at?: string
          version?: number
          xp_reward?: number
        }
        Update: {
          authoring_level?: number
          competency_code?: string
          created_at?: string
          created_by?: string | null
          editorial_status?: Database["public"]["Enums"]["editorial_status"]
          estimated_seconds?: number
          explanation_markdown?: string
          external_id?: string
          hint?: string | null
          id?: string
          import_batch_id?: string | null
          numeric_tolerance_abs?: number | null
          numeric_tolerance_rel?: number | null
          numeric_unit?: string | null
          options?: Json | null
          prerequisites?: string[] | null
          private_key_json?: Json
          prompt_markdown?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision?: number | null
          subject_area?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          version?: number
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_versions: {
        Row: {
          id: string
          published_at: string
          published_by: string | null
          question_id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          id?: string
          published_at?: string
          published_by?: string | null
          question_id: string
          snapshot: Json
          version_number: number
        }
        Update: {
          id?: string
          published_at?: string
          published_by?: string | null
          question_id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_versions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_versions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "view_student_question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      review_schedule: {
        Row: {
          competency_code: string | null
          created_at: string
          exercise_id: string
          id: string
          interval_days: number
          is_pending: boolean
          mission_id: string
          reviewed_at: string | null
          scheduled_for: string
          state: Database["public"]["Enums"]["review_interval_state"]
          user_id: string
        }
        Insert: {
          competency_code?: string | null
          created_at?: string
          exercise_id: string
          id?: string
          interval_days?: number
          is_pending?: boolean
          mission_id: string
          reviewed_at?: string | null
          scheduled_for?: string
          state?: Database["public"]["Enums"]["review_interval_state"]
          user_id: string
        }
        Update: {
          competency_code?: string | null
          created_at?: string
          exercise_id?: string
          id?: string
          interval_days?: number
          is_pending?: boolean
          mission_id?: string
          reviewed_at?: string | null
          scheduled_for?: string
          state?: Database["public"]["Enums"]["review_interval_state"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_schedule_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          description: string | null
          id: string
          permission_code: string
          role: Database["public"]["Enums"]["user_role_type"]
        }
        Insert: {
          description?: string | null
          id?: string
          permission_code: string
          role: Database["public"]["Enums"]["user_role_type"]
        }
        Update: {
          description?: string | null
          id?: string
          permission_code?: string
          role?: Database["public"]["Enums"]["user_role_type"]
        }
        Relationships: []
      }
      student_achievements: {
        Row: {
          achievement_id: string
          id: string
          metadata: Json | null
          unlocked_at: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          achievement_id: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          achievement_id?: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "gamification_achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_activity_progress: {
        Row: {
          best_score_percent: number
          completed_attempts_count: number
          first_completed_at: string | null
          id: string
          is_completed: boolean
          last_activity_at: string
          last_attempt_id: string | null
          mission_id: string
          node_id: string | null
          total_active_seconds: number
          total_attempts_count: number
          total_xp_earned: number
          track_id: string | null
          track_version: number | null
          user_id: string
        }
        Insert: {
          best_score_percent?: number
          completed_attempts_count?: number
          first_completed_at?: string | null
          id?: string
          is_completed?: boolean
          last_activity_at?: string
          last_attempt_id?: string | null
          mission_id: string
          node_id?: string | null
          total_active_seconds?: number
          total_attempts_count?: number
          total_xp_earned?: number
          track_id?: string | null
          track_version?: number | null
          user_id: string
        }
        Update: {
          best_score_percent?: number
          completed_attempts_count?: number
          first_completed_at?: string | null
          id?: string
          is_completed?: boolean
          last_activity_at?: string
          last_attempt_id?: string | null
          mission_id?: string
          node_id?: string | null
          total_active_seconds?: number
          total_attempts_count?: number
          total_xp_earned?: number
          track_id?: string | null
          track_version?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_activity_progress_last_attempt_id_fkey"
            columns: ["last_attempt_id"]
            isOneToOne: false
            referencedRelation: "activity_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_activity_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_competency_progress: {
        Row: {
          autonomous_correct_count: number
          competency_code: string
          correct_questions_count: number
          guessed_count: number
          hints_used_total: number
          id: string
          last_assessed_at: string
          mastery_score_percent: number
          total_questions_answered: number
          user_id: string
        }
        Insert: {
          autonomous_correct_count?: number
          competency_code: string
          correct_questions_count?: number
          guessed_count?: number
          hints_used_total?: number
          id?: string
          last_assessed_at?: string
          mastery_score_percent?: number
          total_questions_answered?: number
          user_id: string
        }
        Update: {
          autonomous_correct_count?: number
          competency_code?: string
          correct_questions_count?: number
          guessed_count?: number
          hints_used_total?: number
          id?: string
          last_assessed_at?: string
          mastery_score_percent?: number
          total_questions_answered?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_competency_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_daily_goals: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          target_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          target_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          target_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_daily_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_daily_study_logs: {
        Row: {
          active_seconds: number
          created_at: string
          exercises_answered_count: number
          goal_reached: boolean
          id: string
          missions_completed_count: number
          study_date: string
          updated_at: string
          user_id: string
          xp_earned_today: number
        }
        Insert: {
          active_seconds?: number
          created_at?: string
          exercises_answered_count?: number
          goal_reached?: boolean
          id?: string
          missions_completed_count?: number
          study_date?: string
          updated_at?: string
          user_id: string
          xp_earned_today?: number
        }
        Update: {
          active_seconds?: number
          created_at?: string
          exercises_answered_count?: number
          goal_reached?: boolean
          id?: string
          missions_completed_count?: number
          study_date?: string
          updated_at?: string
          user_id?: string
          xp_earned_today?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_daily_study_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_mentor_video_views: {
        Row: {
          completed: boolean
          id: string
          trigger_event: string
          user_id: string
          video_id: string
          viewed_at: string
        }
        Insert: {
          completed?: boolean
          id?: string
          trigger_event: string
          user_id: string
          video_id: string
          viewed_at?: string
        }
        Update: {
          completed?: boolean
          id?: string
          trigger_event?: string
          user_id?: string
          video_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_mentor_video_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_mentor_video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "pedagogical_mentor_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      student_message_impressions: {
        Row: {
          dismissed_at: string | null
          id: string
          message_id: string
          shown_at: string
          trigger_event: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string | null
          id?: string
          message_id: string
          shown_at?: string
          trigger_event: string
          user_id: string
        }
        Update: {
          dismissed_at?: string | null
          id?: string
          message_id?: string
          shown_at?: string
          trigger_event?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_message_impressions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "pedagogical_messages_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_message_impressions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_preferences: {
        Row: {
          commercial_marketing_opt_in: boolean
          created_at: string
          daily_goal_minutes: number
          id: string
          motivational_frequency: string
          motivational_messages_enabled: boolean
          partner_offers_opt_in: boolean
          pedagogical_notifications_enabled: boolean
          reduced_motion: boolean
          sound_effects_enabled: boolean
          theme: string
          updated_at: string
          user_id: string
          video_autoplay: boolean
          video_default_speed: number
        }
        Insert: {
          commercial_marketing_opt_in?: boolean
          created_at?: string
          daily_goal_minutes?: number
          id?: string
          motivational_frequency?: string
          motivational_messages_enabled?: boolean
          partner_offers_opt_in?: boolean
          pedagogical_notifications_enabled?: boolean
          reduced_motion?: boolean
          sound_effects_enabled?: boolean
          theme?: string
          updated_at?: string
          user_id: string
          video_autoplay?: boolean
          video_default_speed?: number
        }
        Update: {
          commercial_marketing_opt_in?: boolean
          created_at?: string
          daily_goal_minutes?: number
          id?: string
          motivational_frequency?: string
          motivational_messages_enabled?: boolean
          partner_offers_opt_in?: boolean
          pedagogical_notifications_enabled?: boolean
          reduced_motion?: boolean
          sound_effects_enabled?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
          video_autoplay?: boolean
          video_default_speed?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_telemetry_events: {
        Row: {
          created_at: string
          entity_id: string | null
          event_type: string
          id: string
          payload: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_telemetry_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trail_graph_versions: {
        Row: {
          block_version_manifest: Json
          changelog: string | null
          created_at: string
          edges_snapshot: Json
          graph_snapshot: Json
          id: string
          nodes_snapshot: Json
          published_at: string
          published_by_id: string | null
          published_by_name: string | null
          status: Database["public"]["Enums"]["editorial_status"]
          title: string
          track_id: string
          version: number
        }
        Insert: {
          block_version_manifest?: Json
          changelog?: string | null
          created_at?: string
          edges_snapshot: Json
          graph_snapshot: Json
          id: string
          nodes_snapshot: Json
          published_at?: string
          published_by_id?: string | null
          published_by_name?: string | null
          status?: Database["public"]["Enums"]["editorial_status"]
          title: string
          track_id: string
          version: number
        }
        Update: {
          block_version_manifest?: Json
          changelog?: string | null
          created_at?: string
          edges_snapshot?: Json
          graph_snapshot?: Json
          id?: string
          nodes_snapshot?: Json
          published_at?: string
          published_by_id?: string | null
          published_by_name?: string | null
          status?: Database["public"]["Enums"]["editorial_status"]
          title?: string
          track_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "trail_graph_versions_published_by_id_fkey"
            columns: ["published_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trail_graphs: {
        Row: {
          author_id: string | null
          created_at: string
          description: string | null
          edges: Json
          id: string
          nodes: Json
          published_at: string | null
          published_by: string | null
          published_version: number | null
          revision: number
          status: Database["public"]["Enums"]["editorial_status"]
          title: string
          track_id: string
          track_slug: string
          unit_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          description?: string | null
          edges?: Json
          id: string
          nodes?: Json
          published_at?: string | null
          published_by?: string | null
          published_version?: number | null
          revision?: number
          status?: Database["public"]["Enums"]["editorial_status"]
          title: string
          track_id: string
          track_slug: string
          unit_id?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          author_id?: string | null
          created_at?: string
          description?: string | null
          edges?: Json
          id?: string
          nodes?: Json
          published_at?: string | null
          published_by?: string | null
          published_version?: number | null
          revision?: number
          status?: Database["public"]["Enums"]["editorial_status"]
          title?: string
          track_id?: string
          track_slug?: string
          unit_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "trail_graphs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role_type"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_ledger: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          policy_code: string
          reason: string
          source_attempt_id: string | null
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          policy_code?: string
          reason: string
          source_attempt_id?: string | null
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          policy_code?: string
          reason?: string
          source_attempt_id?: string | null
          user_id?: string
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_ledger_source_attempt_id_fkey"
            columns: ["source_attempt_id"]
            isOneToOne: false
            referencedRelation: "activity_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      view_student_question_bank: {
        Row: {
          competency_code: string | null
          estimated_seconds: number | null
          external_id: string | null
          hint: string | null
          id: string | null
          numeric_unit: string | null
          options: Json | null
          prompt_markdown: string | null
          question_type: Database["public"]["Enums"]["question_type"] | null
          subject_area: string | null
          tags: string[] | null
          title: string | null
          version: number | null
          xp_reward: number | null
        }
        Insert: {
          competency_code?: string | null
          estimated_seconds?: number | null
          external_id?: string | null
          hint?: string | null
          id?: string | null
          numeric_unit?: string | null
          options?: Json | null
          prompt_markdown?: string | null
          question_type?: Database["public"]["Enums"]["question_type"] | null
          subject_area?: string | null
          tags?: string[] | null
          title?: string | null
          version?: number | null
          xp_reward?: number | null
        }
        Update: {
          competency_code?: string | null
          estimated_seconds?: number | null
          external_id?: string | null
          hint?: string | null
          id?: string | null
          numeric_unit?: string | null
          options?: Json | null
          prompt_markdown?: string | null
          question_type?: Database["public"]["Enums"]["question_type"] | null
          subject_area?: string | null
          tags?: string[] | null
          title?: string | null
          version?: number | null
          xp_reward?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_assign_role: {
        Args: {
          p_new_role: Database["public"]["Enums"]["user_role_type"]
          p_target_user_id: string
        }
        Returns: Json
      }
      admin_grant_enrollment: {
        Args: {
          p_product_id: string
          p_reason?: string
          p_user_id: string
          p_valid_until?: string
        }
        Returns: Json
      }
      admin_revoke_enrollment: {
        Args: { p_product_id: string; p_reason?: string; p_user_id: string }
        Returns: Json
      }
      admin_revoke_role: {
        Args: {
          p_role_to_revoke: Database["public"]["Enums"]["user_role_type"]
          p_target_user_id: string
        }
        Returns: Json
      }
      anonymize_student_account: {
        Args: { target_user_uid: string }
        Returns: Json
      }
      can_edit_content: { Args: { user_uid: string }; Returns: boolean }
      check_media_deletion_allowed: {
        Args: { p_asset_id: string }
        Returns: Json
      }
      check_user_media_access: {
        Args: { asset_uid: string; user_uid: string }
        Returns: boolean
      }
      has_entitlement: {
        Args: { prod_id: string; user_uid: string }
        Returns: boolean
      }
      is_admin: { Args: { user_uid: string }; Returns: boolean }
      is_super_admin: { Args: { user_uid: string }; Returns: boolean }
      reconcile_student_xp: { Args: { target_user_uid: string }; Returns: Json }
      record_exercise_evaluation: {
        Args: {
          p_active_seconds: number
          p_assistance_degree: string
          p_attempt_id: string
          p_competency_code: string
          p_exercise_id: string
          p_exercise_version: number
          p_formula_was_hidden: boolean
          p_grade_result: Json
          p_guessed: boolean
          p_hints_used_count: number
          p_is_correct: boolean
          p_is_mission_completed: boolean
          p_perceived_difficulty: number
          p_score_percent: number
          p_student_answer: Json
          p_xp_reason: string
          p_xp_to_award: number
        }
        Returns: Json
      }
      rpc_publish_question: {
        Args: { p_question_id: string; p_reviewer_name: string }
        Returns: Json
      }
      rpc_publish_trail_graph: {
        Args: {
          p_changelog: string
          p_publisher_name: string
          p_track_id: string
        }
        Returns: Json
      }
      rpc_rollback_import_batch: {
        Args: { p_actor_name: string; p_batch_id: string; p_reason: string }
        Returns: Json
      }
      rpc_save_trail_graph_draft: {
        Args: {
          p_description: string
          p_edges: Json
          p_expected_revision: number
          p_nodes: Json
          p_title: string
          p_track_id: string
          p_track_slug: string
        }
        Returns: Json
      }
    }
    Enums: {
      attempt_status: "in_progress" | "completed" | "abandoned"
      audit_action_type:
        | "role_assigned"
        | "role_revoked"
        | "auth_success"
        | "auth_failure"
        | "privilege_escalation_attempt"
        | "profile_updated"
      block_category:
        | "assessment"
        | "media"
        | "interaction"
        | "flow"
        | "marketing"
      block_completion_policy:
        | "submitted"
        | "watched"
        | "checked"
        | "manual"
        | "composite"
      editorial_status: "draft" | "in_review" | "published" | "archived"
      enrollment_status: "active" | "completed" | "suspended" | "expired"
      entitlement_tier:
        | "base_subscription"
        | "technical_extension"
        | "specialized_track"
      media_asset_type:
        | "youtube_video"
        | "private_video"
        | "pdf_document"
        | "audio"
        | "image"
        | "cad_model"
        | "spreadsheet"
        | "archive"
        | "exercise_file"
      media_storage_provider:
        | "youtube"
        | "cloudflare_stream"
        | "s3_storage"
        | "external_url"
        | "supabase_storage"
        | "vimeo"
      question_type:
        | "single_choice"
        | "multiple_choice"
        | "true_false"
        | "numeric_response"
        | "ordered_steps"
      review_interval_state:
        | "step_1_day"
        | "step_3_days"
        | "step_7_days"
        | "step_14_days"
        | "mastered"
      subscription_status:
        | "active"
        | "past_due"
        | "canceled"
        | "trialing"
        | "incomplete"
      user_role_type: "student" | "content_editor" | "admin" | "super_admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      attempt_status: ["in_progress", "completed", "abandoned"],
      audit_action_type: [
        "role_assigned",
        "role_revoked",
        "auth_success",
        "auth_failure",
        "privilege_escalation_attempt",
        "profile_updated",
      ],
      block_category: [
        "assessment",
        "media",
        "interaction",
        "flow",
        "marketing",
      ],
      block_completion_policy: [
        "submitted",
        "watched",
        "checked",
        "manual",
        "composite",
      ],
      editorial_status: ["draft", "in_review", "published", "archived"],
      enrollment_status: ["active", "completed", "suspended", "expired"],
      entitlement_tier: [
        "base_subscription",
        "technical_extension",
        "specialized_track",
      ],
      media_asset_type: [
        "youtube_video",
        "private_video",
        "pdf_document",
        "audio",
        "image",
        "cad_model",
        "spreadsheet",
        "archive",
        "exercise_file",
      ],
      media_storage_provider: [
        "youtube",
        "cloudflare_stream",
        "s3_storage",
        "external_url",
        "supabase_storage",
        "vimeo",
      ],
      question_type: [
        "single_choice",
        "multiple_choice",
        "true_false",
        "numeric_response",
        "ordered_steps",
      ],
      review_interval_state: [
        "step_1_day",
        "step_3_days",
        "step_7_days",
        "step_14_days",
        "mastered",
      ],
      subscription_status: [
        "active",
        "past_due",
        "canceled",
        "trialing",
        "incomplete",
      ],
      user_role_type: ["student", "content_editor", "admin", "super_admin"],
    },
  },
} as const


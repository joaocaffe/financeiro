export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            balances: {
                Row: {
                    amount: number
                    app_user_id: string | null
                    created_at: string | null
                    date: string
                    description: string | null
                    id: string
                    owner_id: string
                    reference_month: string | null
                }
                Insert: {
                    amount: number
                    app_user_id?: string | null
                    created_at?: string | null
                    date: string
                    description?: string | null
                    id?: string
                    owner_id: string
                    reference_month?: string | null
                }
                Update: {
                    amount?: number
                    app_user_id?: string | null
                    created_at?: string | null
                    date?: string
                    description?: string | null
                    id?: string
                    owner_id?: string
                    reference_month?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "balances_app_user_id_fkey"
                        columns: ["app_user_id"]
                        referencedRelation: "finance_users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "balances_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            credit_cards: {
                Row: {
                    brand: string
                    created_at: string | null
                    due_day: number
                    id: string
                    is_hidden: boolean | null
                    name: string
                    owner_id: string
                }
                Insert: {
                    brand: string
                    created_at?: string | null
                    due_day: number
                    id?: string
                    is_hidden?: boolean | null
                    name: string
                    owner_id: string
                }
                Update: {
                    brand?: string
                    created_at?: string | null
                    due_day?: number
                    id?: string
                    is_hidden?: boolean | null
                    name?: string
                    owner_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "credit_cards_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            finance_users: {
                Row: {
                    created_at: string | null
                    id: string
                    is_hidden: boolean | null
                    name: string
                    owner_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_hidden?: boolean | null
                    name: string
                    owner_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_hidden?: boolean | null
                    name?: string
                    owner_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "finance_users_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            transaction_types: {
                Row: {
                    created_at: string | null
                    id: string
                    name: string
                    owner_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                    owner_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                    owner_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "transaction_types_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            transactions: {
                Row: {
                    app_user_id: string | null
                    card_id: string | null
                    created_at: string | null
                    date: string
                    description: string
                    id: string
                    installments: number | null
                    is_hidden: boolean | null
                    is_paid: boolean | null
                    is_subscription: boolean | null
                    location: string | null
                    owner_id: string
                    payment_start_month: string | null
                    total_value: number
                    type: string | null
                }
                Insert: {
                    app_user_id?: string | null
                    card_id?: string | null
                    created_at?: string | null
                    date: string
                    description: string
                    location?: string | null
                    type?: string | null
                    payment_start_month?: string | null
                    total_value: number
                    installments?: number | null
                    owner_id: string
                    is_paid?: boolean | null
                    is_hidden?: boolean | null
                    is_subscription?: boolean | null
                    id?: string
                }
                Update: {
                    app_user_id?: string | null
                    card_id?: string | null
                    created_at?: string | null
                    date?: string
                    description?: string
                    location?: string | null
                    type?: string | null
                    payment_start_month?: string | null
                    total_value?: number
                    installments?: number | null
                    owner_id?: string
                    is_paid?: boolean | null
                    is_hidden?: boolean | null
                    is_subscription?: boolean | null
                    id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "transactions_app_user_id_fkey"
                        columns: ["app_user_id"]
                        referencedRelation: "finance_users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_card_id_fkey"
                        columns: ["card_id"]
                        referencedRelation: "credit_cards"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
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

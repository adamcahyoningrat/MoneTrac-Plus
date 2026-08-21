-- ==============================================================================
-- MONETRAC - SUPABASE DATABASE SCHEMA (MULTI-USER & RLS ENABLED)
-- ==============================================================================
-- Skrip ini dirancang bersih (clean reset) sehingga aman dijalankan kapan saja,
-- bahkan jika sebelumnya ada tabel lama yang bertipe data tidak sesuai (misal TEXT vs UUID).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. BERSIHKAN TABEL LAMA (Mencegah konflik tipe data UUID vs TEXT)
DROP TABLE IF EXISTS public.savings_transactions CASCADE;
DROP TABLE IF EXISTS public.savings_goals CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. TABEL PROFILES (Terkoneksi dengan Supabase Auth)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    currency TEXT DEFAULT 'IDR',
    theme TEXT DEFAULT 'dark',
    privacy_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL ACCOUNTS (Akun & Dompet)
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Bank', -- 'Cash', 'Bank', 'E-Wallet', 'Credit Card', 'Investment'
    balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#16a34a',
    icon TEXT DEFAULT 'wallet',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL CATEGORIES (Kategori Pemasukan & Pengeluaran)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Expense', 'Income'
    color TEXT DEFAULT '#2563eb',
    icon TEXT DEFAULT 'tag',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABEL TRANSACTIONS (Transaksi: Expense, Income, Transfer)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'Expense', 'Income', 'Transfer'
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    admin_fee NUMERIC(15,2) DEFAULT 0,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL, -- Untuk Transfer
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT,
    description TEXT,
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABEL BUDGETS (Anggaran Bulanan per Kategori)
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    month TEXT, -- Format 'YYYY-MM' atau NULL untuk recurring bulanan
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABEL SAVINGS_GOALS (Target & Celengan Impian / Savings)
CREATE TABLE public.savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    current_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    target_date DATE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT 'piggy-bank',
    notes TEXT,
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'paused'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABEL SAVINGS_TRANSACTIONS (Riwayat Nabung / Tarik Celengan)
CREATE TABLE public.savings_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'deposit' (setor/nabung), 'withdraw' (tarik tabungan)
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Accounts Policies
CREATE POLICY "Users can manage own accounts" ON public.accounts
    FOR ALL USING (auth.uid() = user_id);

-- Categories Policies
CREATE POLICY "Users can manage own categories" ON public.categories
    FOR ALL USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can manage own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);

-- Budgets Policies
CREATE POLICY "Users can manage own budgets" ON public.budgets
    FOR ALL USING (auth.uid() = user_id);

-- Savings Goals Policies
CREATE POLICY "Users can manage own savings goals" ON public.savings_goals
    FOR ALL USING (auth.uid() = user_id);

-- Savings Transactions Policies
CREATE POLICY "Users can manage own savings transactions" ON public.savings_transactions
    FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC NEW USER INITIALIZATION (TRIGGER & FUNCTION)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Insert Profile
    INSERT INTO public.profiles (id, email, full_name, currency, theme, privacy_mode)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'IDR',
        'dark',
        FALSE
    );

    -- 2. Insert Default Accounts (Dompet Default)
    INSERT INTO public.accounts (user_id, name, type, balance, color, icon) VALUES
        (NEW.id, 'Cash / Tunai', 'Cash', 0, '#16a34a', 'money-bill'),
        (NEW.id, 'Rekening Bank', 'Bank', 0, '#1f16a2', 'building-columns'),
        (NEW.id, 'E-Wallet', 'E-Wallet', 0, '#1b93d0', 'wallet');

    -- 3. Insert Default Categories (Kategori Default)
    INSERT INTO public.categories (user_id, name, type, color, icon) VALUES
        -- Income
        (NEW.id, 'Salary / Gaji', 'Income', '#2563eb', 'briefcase'),
        (NEW.id, 'Freelance / Side Job', 'Income', '#24e7eb', 'laptop'),
        (NEW.id, 'Investasi & Bunga', 'Income', '#10b981', 'chart-line'),
        (NEW.id, 'Other Revenue / Lainnya', 'Income', '#69eb24', 'gift'),
        -- Expense
        (NEW.id, 'Food & Beverage', 'Expense', '#ef4444', 'utensils'),
        (NEW.id, 'Transportation', 'Expense', '#eb24a2', 'car'),
        (NEW.id, 'Internet & Kuota', 'Expense', '#f59e0b', 'wifi'),
        (NEW.id, 'Electricity / Listrik', 'Expense', '#ebc924', 'bolt'),
        (NEW.id, 'Shopping & Olshop', 'Expense', '#8b5cf6', 'cart-shopping'),
        (NEW.id, 'Topup E-Money', 'Expense', '#06b6d4', 'bus'),
        (NEW.id, 'Bank Charge / Admin', 'Expense', '#64748b', 'receipt'),
        (NEW.id, 'Other Expense / Lainnya', 'Expense', '#eb5f24', 'boxes-stacked');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger saat user baru mendaftar di auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_user ON public.savings_goals(user_id);
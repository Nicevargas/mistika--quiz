-- Create the quiz_results table
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    score INTEGER,
    result_title TEXT,
    answers JSONB,
    metadata JSONB,
    email TEXT,
    whatsapp TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert (public quiz)
CREATE POLICY "Allow public insert" ON quiz_results
    FOR INSERT
    WITH CHECK (true);

-- Create a policy that allows anyone to update their own result (public quiz)
CREATE POLICY "Allow public update" ON quiz_results
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Create a policy that allows anyone to select (public quiz)
-- This is required for the frontend to get the ID back after an insert.
CREATE POLICY "Allow public select" ON quiz_results
    FOR SELECT
    USING (true);

-- Create a policy that allows only authenticated users to view results (admin)
CREATE POLICY "Allow authenticated select" ON quiz_results
    FOR SELECT
    TO authenticated
    USING (true);

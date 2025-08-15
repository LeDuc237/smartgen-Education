/*
  # Schema Update for Teacher and Student Management
  
  1. Changes
    - Add missing fields to teachers table
    - Add missing fields to students table
    - Update RLS policies
    - Add indexes for performance
    
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Add missing fields to teachers table
DO $$ 
BEGIN
  -- Add gender field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'gender'
  ) THEN
    ALTER TABLE teachers ADD COLUMN gender text CHECK (gender IN ('male', 'female')) DEFAULT 'male';
  END IF;

  -- Add category field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'category'
  ) THEN
    ALTER TABLE teachers ADD COLUMN category text CHECK (category IN ('anglo', 'franco')) DEFAULT 'franco';
  END IF;

  -- Add is_approved field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE teachers ADD COLUMN is_approved boolean DEFAULT false;
  END IF;

  -- Add whatsapp_number field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE teachers ADD COLUMN whatsapp_number text;
  END IF;

  -- Add user field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'user'
  ) THEN
    ALTER TABLE teachers ADD COLUMN "user" text;
  END IF;
END $$;

-- Add missing fields to students table
DO $$ 
BEGIN
  -- Add user field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'user'
  ) THEN
    ALTER TABLE students ADD COLUMN "user" text;
  END IF;

  -- Add password field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'password'
  ) THEN
    ALTER TABLE students ADD COLUMN password text;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_is_approved ON teachers(is_approved);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers("user");
CREATE INDEX IF NOT EXISTS idx_students_user ON students("user");

-- Update RLS policies
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_teacher_relations ENABLE ROW LEVEL SECURITY;

-- Teachers policies
CREATE POLICY IF NOT EXISTS "Teachers can view own data" 
  ON teachers FOR SELECT 
  USING (auth.uid()::text = "user");

CREATE POLICY IF NOT EXISTS "Teachers can update own data" 
  ON teachers FOR UPDATE 
  USING (auth.uid()::text = "user");

-- Students policies
CREATE POLICY IF NOT EXISTS "Students can view own data" 
  ON students FOR SELECT 
  USING (auth.uid()::text = "user");

CREATE POLICY IF NOT EXISTS "Students can update own data" 
  ON students FOR UPDATE 
  USING (auth.uid()::text = "user");

-- Payments policies
CREATE POLICY IF NOT EXISTS "Users can view own payments" 
  ON payments FOR SELECT 
  USING (
    auth.uid()::text IN (
      SELECT "user" FROM teachers WHERE id = teacher_id
      UNION
      SELECT "user" FROM students WHERE id = student_id
    )
  );

-- Relations policies
CREATE POLICY IF NOT EXISTS "Users can view own relations" 
  ON student_teacher_relations FOR SELECT 
  USING (
    auth.uid()::text IN (
      SELECT "user" FROM teachers WHERE id = teacher_id
      UNION
      SELECT "user" FROM students WHERE id = student_id
    )
  );

-- Admin policies for all tables
CREATE POLICY IF NOT EXISTS "Admins can manage all data" 
  ON teachers FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admins));

CREATE POLICY IF NOT EXISTS "Admins can manage student data" 
  ON students FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admins));

CREATE POLICY IF NOT EXISTS "Admins can manage payments" 
  ON payments FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admins));

CREATE POLICY IF NOT EXISTS "Admins can manage relations" 
  ON student_teacher_relations FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admins));
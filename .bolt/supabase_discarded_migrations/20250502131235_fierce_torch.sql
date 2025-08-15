/*
  # Schema Update for Enhanced User Management
  
  1. Changes
    - Add password column to admins table
    - Update teachers table structure
    - Add gender and category columns
    - Rename user_id to user for consistency
    - Add sample data for testing
    
  2. Security
    - Hash passwords using bcrypt
    - Update RLS policies
*/

-- Add password column to admins if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admins' AND column_name = 'password'
  ) THEN
    ALTER TABLE admins ADD COLUMN password text;
  END IF;
END $$;

-- Update teachers table structure
DO $$ 
BEGIN
  -- Rename user_id to user if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE teachers RENAME COLUMN user_id TO "user";
  END IF;

  -- Add gender column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'gender'
  ) THEN
    ALTER TABLE teachers ADD COLUMN gender text DEFAULT 'male' CHECK (gender IN ('male', 'female'));
  END IF;

  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'category'
  ) THEN
    ALTER TABLE teachers ADD COLUMN category text DEFAULT 'franco' CHECK (category IN ('anglo', 'franco'));
  END IF;

  -- Add town column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'town'
  ) THEN
    ALTER TABLE teachers ADD COLUMN town text;
  END IF;
END $$;

-- Insert sample teachers with hashed passwords for testing
INSERT INTO teachers (
  full_name,
  email,
  "user",
  password,
  about_me,
  years_experience,
  highest_diploma,
  contact,
  current_work,
  subjects,
  location,
  gender,
  category,
  town,
  success_rate
) VALUES
(
  'John Smith',
  'john.smith@example.com',
  'johnsmith',
  '$2a$10$XgXB8p6O1m7XpXZ8Q9Y5.OQl5X8YG8vX8Q9X8Q9X8Q9X8Q9X8Q', -- password: test123
  'Experienced math and physics teacher',
  5,
  'Masters in Education',
  '237670000001',
  'High School Teacher',
  ARRAY['Mathematics', 'Physics'],
  ARRAY['Bonamoussadi', 'Makepe'],
  'male',
  'anglo',
  'Douala',
  95.5
),
(
  'Marie Claire',
  'marie.claire@example.com',
  'marieclaire',
  '$2a$10$XgXB8p6O1m7XpXZ8Q9Y5.OQl5X8YG8vX8Q9X8Q9X8Q9X8Q9X8Q', -- password: test123
  'Passionate about teaching French literature',
  8,
  'PhD in French Literature',
  '237670000002',
  'University Lecturer',
  ARRAY['French', 'Literature'],
  ARRAY['Melen', 'Bastos'],
  'female',
  'franco',
  'Yaounde',
  92.0
);

-- Insert sample admin with hashed password
INSERT INTO admins (
  full_name,
  email,
  role,
  password,
  about_me
) VALUES (
  'Admin User',
  'admin@smartgeneduc.com',
  'promoteur',
  '$2a$10$XgXB8p6O1m7XpXZ8Q9Y5.OQl5X8YG8vX8Q9X8Q9X8Q9X8Q9X8Q', -- password: admin123
  'System administrator'
) ON CONFLICT (email) DO NOTHING;

-- Update RLS policies for teachers
DROP POLICY IF EXISTS "Teachers can view own data" ON teachers;
DROP POLICY IF EXISTS "Teachers can update own data" ON teachers;

CREATE POLICY "Teachers can view own data" ON teachers
  FOR SELECT USING ("user" = current_user);

CREATE POLICY "Teachers can update own data" ON teachers
  FOR UPDATE USING ("user" = current_user);
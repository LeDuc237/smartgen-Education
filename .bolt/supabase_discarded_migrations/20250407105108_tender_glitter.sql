/*
  # Initial Database Schema

  1. New Tables
    - teachers
    - students
    - admins
    - comments
    - notices
    - company_info
    - payments
    - visits
    - student_teacher_relations

  2. Security
    - Enable RLS on all tables
    - Add policies for data access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DO $$ 
BEGIN
  -- Drop tables in reverse order of dependencies
  DROP TABLE IF EXISTS student_teacher_relations;
  DROP TABLE IF EXISTS payments;
  DROP TABLE IF EXISTS comments;
  DROP TABLE IF EXISTS visits;
  DROP TABLE IF EXISTS notices;
  DROP TABLE IF EXISTS company_info;
  DROP TABLE IF EXISTS students;
  DROP TABLE IF EXISTS teachers;
  DROP TABLE IF EXISTS admins;
END $$;

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  gender text CHECK (gender IN ('male', 'female')),
  contact text,
  email text UNIQUE,
  highest_diploma text,
  years_experience integer,
  about_me text,
  current_work text,
  classes_can_teach text[],
  number_reviews integer DEFAULT 0,
  success_rate decimal(5,2),
  available_days text[],
  available_time_interval text,
  profile_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  gender text CHECK (gender IN ('male', 'female')),
  class text,
  quarter text,
  days_per_week integer,
  guardian_name text,
  guardian_phone text,
  user_id uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  role text CHECK (role IN ('promoteur', 'coordonateur', 'editeur')),
  email text UNIQUE,
  contact text,
  about_me text,
  current_work text,
  user_id uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  content text NOT NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);

-- Notices table
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  type text CHECK (type IN ('text', 'image', 'video', 'link')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company info table
CREATE TABLE IF NOT EXISTS company_info (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  about_us_en text,
  about_us_fr text,
  about_image1_url text,
  about_image2_url text,
  contact_info text,
  payment_info text,
  whatsapp_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  amount decimal(10,2),
  payment_date date,
  next_payment_due date,
  created_at timestamptz DEFAULT now()
);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id text,
  location text,
  created_at timestamptz DEFAULT now()
);

-- Student-Teacher relations table
CREATE TABLE IF NOT EXISTS student_teacher_relations (
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (student_id, teacher_id)
);

-- Drop existing policies
DO $$ 
BEGIN
  -- Teachers policies
  DROP POLICY IF EXISTS "Teachers are viewable by everyone" ON teachers;
  DROP POLICY IF EXISTS "Teachers can update their own profile" ON teachers;
  
  -- Students policies
  DROP POLICY IF EXISTS "Students can view their own profile" ON students;
  DROP POLICY IF EXISTS "Students can update their own profile" ON students;
  
  -- Admins policies
  DROP POLICY IF EXISTS "Admins can view admin list" ON admins;
  
  -- Comments policies
  DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
  DROP POLICY IF EXISTS "Students can create comments" ON comments;
  
  -- Notices policies
  DROP POLICY IF EXISTS "Notices are viewable by everyone" ON notices;
  DROP POLICY IF EXISTS "Only admins can manage notices" ON notices;
  
  -- Company info policies
  DROP POLICY IF EXISTS "Company info is viewable by everyone" ON company_info;
  DROP POLICY IF EXISTS "Only admins can manage company info" ON company_info;
END $$;

-- Enable Row Level Security
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_teacher_relations ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Teachers policies
CREATE POLICY "Teachers are viewable by everyone" ON teachers
  FOR SELECT USING (true);

CREATE POLICY "Teachers can update their own profile" ON teachers
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM admins
    UNION
    SELECT user_id FROM students
  ));

-- Students policies
CREATE POLICY "Students can view their own profile" ON students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can update their own profile" ON students
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins policies
CREATE POLICY "Admins can view admin list" ON admins
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM admins));

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Students can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM students));

-- Notices policies
CREATE POLICY "Notices are viewable by everyone" ON notices
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage notices" ON notices
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admins));

-- Company info policies
CREATE POLICY "Company info is viewable by everyone" ON company_info
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage company info" ON company_info
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admins));

-- Insert initial company info if it doesn't exist
INSERT INTO company_info (
  about_us_en,
  about_us_fr,
  contact_info,
  payment_info,
  whatsapp_number
)
SELECT
  'SmartGen Educ is a trusted platform dedicated to matching students with passionate, verified home tutors in Cameroon. We believe that every child deserves personalized support to unlock their full academic potential.',
  'SmartGen Educ est une plateforme de confiance dédiée à connecter les élèves avec des enseignants à domicile passionnés et vérifiés au Cameroun. Nous croyons que chaque enfant mérite un accompagnement personnalisé pour révéler tout son potentiel académique.',
  'Yaoundé - Douala',
  'Payment via Orange or MTN Money',
  '+237670000000'
WHERE NOT EXISTS (SELECT 1 FROM company_info);
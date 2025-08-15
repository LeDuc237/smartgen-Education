/*
  # Database Schema Update
  
  1. New Tables
    - All tables from previous schema with improved structure
    - Added bilingual support for about_us in company_info
    - Enhanced security with RLS policies
    
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DO $$ 
BEGIN
  DROP TABLE IF EXISTS student_teacher_relations CASCADE;
  DROP TABLE IF EXISTS payments CASCADE;
  DROP TABLE IF EXISTS comments CASCADE;
  DROP TABLE IF EXISTS visits CASCADE;
  DROP TABLE IF EXISTS notices CASCADE;
  DROP TABLE IF EXISTS company_info CASCADE;
  DROP TABLE IF EXISTS students CASCADE;
  DROP TABLE IF EXISTS teachers CASCADE;
  DROP TABLE IF EXISTS admins CASCADE;
END $$;

-- Create Admin table
CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text CHECK (role IN ('promoteur', 'coordonateur', 'editeur')),
  about_me text,
  current_work text,
  profile_image_url text,
  user_id uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Teacher table
CREATE TABLE teachers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  about_me text,
  years_experience integer,
  highest_diploma text,
  contact text,
  current_work text,
  subjects text[],
   location text[],
  password text,
   gender: 'male' | 'female',
  number_reviews integer DEFAULT 0,
  available_days text[],
  available_time_interval text,
  success_rate decimal(5,2),
  profile_image_url text,
  user_id uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Student table
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier text UNIQUE NOT NULL,
  full_name text NOT NULL,
  guardian_name text,
  guardian_phone text,
  class text,
  quarter text,
  days_per_week integer,
  profile_image_url text,
  user_id uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Student-Teacher relations table
CREATE TABLE student_teacher_relations (
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (student_id, teacher_id)
);

-- Create Comments table
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  content text NOT NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);

-- Create Payments table
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_date date NOT NULL,
  next_payment_due date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create Notices table
CREATE TABLE notices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  type text CHECK (type IN ('text', 'image', 'video', 'link')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Company Info table
CREATE TABLE company_info (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  about_us_en text,
  about_us_fr text,
  about_image1_url text,
  about_image2_url text,
  contact text,
  email text,
  location text,
  whatsapp_number text,
  payment_info text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Visits table
CREATE TABLE visits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id text,
  location text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_teacher_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admin policies
CREATE POLICY "Admins can view admin list" ON admins
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM admins));

CREATE POLICY "Admins can manage admin data" ON admins
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admins));

-- Teacher policies
CREATE POLICY "Teachers are viewable by everyone" ON teachers
  FOR SELECT USING (true);

CREATE POLICY "Teachers can update own profile" ON teachers
  FOR UPDATE USING (auth.uid() = user_id);

-- Student policies
CREATE POLICY "Students can view own profile" ON students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can update own profile" ON students
  FOR UPDATE USING (auth.uid() = user_id);

-- Comment policies
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Students can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM students));

-- Notice policies
CREATE POLICY "Notices are viewable by everyone" ON notices
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage notices" ON notices
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admins));

-- Company info policies
CREATE POLICY "Company info is viewable by everyone" ON company_info
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage company info" ON company_info
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admins));

-- Insert initial company info
INSERT INTO company_info (
  about_us_en,
  about_us_fr,
  contact,
  email,
  location,
  whatsapp_number,
  payment_info
)
VALUES (
  'SmartGen Educ is a leading home tutoring platform connecting qualified teachers with students across Cameroon. We provide personalized education solutions to help students achieve their academic goals.',
  'SmartGen Educ est une plateforme leader de tutorat à domicile qui met en relation des enseignants qualifiés avec des étudiants à travers le Cameroun. Nous fournissons des solutions éducatives personnalisées pour aider les étudiants à atteindre leurs objectifs académiques.',
  '+237 690 112 233',
  'info@smartgeneduc.com',
  'Yaoundé - Douala',
  '+237 690 223 344',
  'Payment can be done via Orange Money or MTN Mobile Money'
);

-- Insert sample admin
INSERT INTO admins (
  full_name,
  email,
  role,
  about_me,
  current_work
)
VALUES (
  'John Promoteur',
  'john.promoteur@smartgeneduc.com',
  'promoteur',
  'Founder of SmartGen Educ with over 15 years of experience in education',
  'Managing Director at SmartGen Educ'
);
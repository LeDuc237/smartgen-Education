/*
  # Add Authentication Features and Sample Data
  
  1. Changes
    - Add last_login tracking for users
    - Add sample teachers and notices
    - Update company info with bilingual content
    - Set up RLS policies
    
  2. Security
    - Enable RLS on tables
    - Add policies for authenticated access
*/

-- Add last_login tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE teachers ADD COLUMN last_login timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE students ADD COLUMN last_login timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admins' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE admins ADD COLUMN last_login timestamptz;
  END IF;
END $$;

-- Insert more sample notices
INSERT INTO notices (
  title,
  content,
  type
) VALUES
(
  'New Science Program Launch',
  'Join our advanced science program featuring hands-on experiments and practical applications.',
  'text'
),
(
  'Student Success Stories',
  'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80',
  'image'
),
(
  'Holiday Schedule',
  'Special intensive courses available during the upcoming holiday season. Limited spots available.',
  'text'
);

-- Update company info with bilingual content
UPDATE company_info
SET 
  about_us_en = 'SmartGen Educ is a leading educational platform in Cameroon, connecting qualified teachers with students for personalized home tutoring. Our mission is to make quality education accessible to all.',
  about_us_fr = 'SmartGen Educ est une plateforme éducative leader au Cameroun, mettant en relation des enseignants qualifiés avec des élèves pour un tutorat personnalisé à domicile. Notre mission est de rendre l''éducation de qualité accessible à tous.',
  contact = '+237 651 203 488',
  email = 'contact@smartgeneduc.com',
  location = 'Yaoundé et Douala, Cameroun',
  whatsapp_number = '+237 651 203 488',
  payment_info = 'Payments accepted via Orange Money and MTN Mobile Money'
WHERE id = (SELECT id FROM company_info LIMIT 1);

-- Add RLS policies for authenticated access
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Teachers can view and update their own data
CREATE POLICY "Teachers can view own data" ON teachers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teachers can update own data" ON teachers
  FOR UPDATE USING (auth.uid() = user_id);

-- Students can view and update their own data
CREATE POLICY "Students can view own data" ON students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can update own data" ON students
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view and manage all data
CREATE POLICY "Admins can manage all data" ON teachers
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admins));

CREATE POLICY "Admins can manage student data" ON students
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admins));
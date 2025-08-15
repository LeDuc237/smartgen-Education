/*
  # Add Initial Data
  
  1. Sample Data
    - Teachers with diverse subjects and experience
    - Students with different classes
    - Comments and ratings
    - Notices for announcements
    
  2. Data Relationships
    - Student-Teacher relationships
    - Comments linking students and teachers
*/

-- Insert sample teachers
INSERT INTO teachers (
  full_name,
  email,
  about_me,
  years_experience,
  highest_diploma,
  contact,
  current_work,
  classes_can_teach,
  success_rate,
  available_days,
  available_time_interval,
  profile_image_url
) VALUES
(
  'Jean Mbarga',
  'jean.mbarga@smartgeneduc.com',
  'Passionate mathematics teacher with extensive experience in preparing students for exams.',
  5,
  'Master in Mathematics',
  '670000001',
  'High School Teacher',
  ARRAY['Mathematics', 'Physics'],
  90.5,
  ARRAY['Monday', 'Wednesday', 'Friday'],
  '14:00-18:00',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80'
),
(
  'Marie Manga',
  'marie.manga@smartgeneduc.com',
  'Dedicated science teacher specializing in chemistry and biology.',
  8,
  'PhD in Chemistry',
  '670000002',
  'University Lecturer',
  ARRAY['Chemistry', 'Biology'],
  95.0,
  ARRAY['Tuesday', 'Thursday', 'Saturday'],
  '09:00-15:00',
  'https://images.unsplash.com/photo-1573496267526-cc46e1bb5669?auto=format&fit=crop&q=80'
),
(
  'Paul Etame',
  'paul.etame@smartgeneduc.com',
  'English language specialist with focus on literature and grammar.',
  6,
  'Master in English Literature',
  '670000003',
  'Language Center Instructor',
  ARRAY['English', 'Literature'],
  88.5,
  ARRAY['Monday', 'Tuesday', 'Thursday'],
  '13:00-17:00',
  'https://images.unsplash.com/photo-1573496546083-9c495e0d9c10?auto=format&fit=crop&q=80'
);

-- Insert sample students
INSERT INTO students (
  identifier,
  full_name,
  guardian_name,
  guardian_phone,
  class,
  quarter,
  days_per_week,
  profile_image_url
) VALUES
(
  'STU001',
  'Alice Ndom',
  'Mr. Ndom',
  '670111111',
  'Form 4',
  'Bastos',
  3,
  'https://images.unsplash.com/photo-1517256673644-36ad11246d21?auto=format&fit=crop&q=80'
),
(
  'STU002',
  'Robert Meka',
  'Mrs. Meka',
  '670222222',
  'Form 5',
  'Nsimeyong',
  2,
  'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&q=80'
);

-- Insert sample comments
INSERT INTO comments (
  teacher_id,
  student_id,
  content,
  rating
) VALUES
(
  (SELECT id FROM teachers WHERE email = 'jean.mbarga@smartgeneduc.com'),
  (SELECT id FROM students WHERE identifier = 'STU001'),
  'Excellent teacher! Very patient and explains complex concepts clearly.',
  5
),
(
  (SELECT id FROM teachers WHERE email = 'marie.manga@smartgeneduc.com'),
  (SELECT id FROM students WHERE identifier = 'STU002'),
  'Great at making science interesting and engaging.',
  5
);

-- Insert sample notices
INSERT INTO notices (
  title,
  content,
  type
) VALUES
(
  'New Mathematics Course Starting',
  'Join our advanced mathematics preparation course for exam candidates. Limited spots available.',
  'text'
),
(
  'Holiday Science Program',
  'Special intensive science program during the upcoming holidays. Register now!',
  'text'
),
(
  'Student Success Story',
  'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80',
  'image'
);

-- Create student-teacher relationships
INSERT INTO student_teacher_relations (
  student_id,
  teacher_id
) VALUES
(
  (SELECT id FROM students WHERE identifier = 'STU001'),
  (SELECT id FROM teachers WHERE email = 'jean.mbarga@smartgeneduc.com')
),
(
  (SELECT id FROM students WHERE identifier = 'STU002'),
  (SELECT id FROM teachers WHERE email = 'marie.manga@smartgeneduc.com')
);
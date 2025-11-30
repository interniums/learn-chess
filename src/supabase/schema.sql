-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Books table
create table books (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title jsonb not null, -- { "en": "Chess Fundamentals", "es": "..." }
  description jsonb,
  cover_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sections (Chapters) table
create table sections (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid references books(id) on delete cascade not null,
  slug text not null,
  "order" integer not null,
  title jsonb not null,
  description jsonb,
  images text[], -- Array of image URLs
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(book_id, slug)
);

-- Lessons table
create table lessons (
  id uuid primary key default uuid_generate_v4(),
  section_id uuid references sections(id) on delete cascade not null,
  slug text not null,
  "order" integer not null,
  title jsonb not null,
  description jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(section_id, slug)
);

-- Lesson Contents table
create type content_type as enum ('text', 'image', 'exercise', 'video');

create table lesson_contents (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid references lessons(id) on delete cascade not null,
  "order" integer not null,
  type content_type not null,
  content jsonb not null, -- Flexible schema based on type
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Progress table
create table user_progress (
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id uuid references lessons(id) on delete cascade not null,
  completed boolean default false,
  last_position integer default 0, -- To track where they left off in a lesson
  completed_at timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, lesson_id)
);

-- RLS Policies
alter table books enable row level security;
alter table sections enable row level security;
alter table lessons enable row level security;
alter table lesson_contents enable row level security;
alter table user_progress enable row level security;

-- Public read access for content
create policy "Public books are viewable by everyone" on books for select using (true);
create policy "Public sections are viewable by everyone" on sections for select using (true);
create policy "Public lessons are viewable by everyone" on lessons for select using (true);
create policy "Public contents are viewable by everyone" on lesson_contents for select using (true);

-- User progress policies
create policy "Users can view their own progress" on user_progress for select using (auth.uid() = user_id);
create policy "Users can update their own progress" on user_progress for insert with check (auth.uid() = user_id);
create policy "Users can update their own progress update" on user_progress for update using (auth.uid() = user_id);


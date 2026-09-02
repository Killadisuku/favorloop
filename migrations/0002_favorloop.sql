-- Por Favor core schema. user_id is TEXT to match Better Auth ids.

create table if not exists profiles (
  user_id text primary key,
  name text not null,
  username text not null unique,
  email text,
  bio text not null default '',
  city text not null default '',
  area text not null default '',
  lat double precision,
  lng double precision,
  avatar_hue integer not null default 168,
  photo_url text,
  skills text not null default '[]',
  need_help_with text not null default '[]',
  interests text not null default '[]',
  credits integer not null default 0 check (credits >= 0),
  reputation numeric(5,1) not null default 70.0,
  favors_given integer not null default 0,
  favors_received integer not null default 0,
  streak integer not null default 0,
  streak_at date,
  level integer not null default 1,
  verified boolean not null default false,
  plus boolean not null default false,
  plus_status text not null default 'free',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists posts (
  id text primary key,
  user_id text not null references profiles(user_id),
  type text not null check (type in ('request', 'offer')),
  title text not null,
  description text not null default '',
  category text not null,
  city text not null default '',
  area text not null default '',
  lat double precision,
  lng double precision,
  estimated_time text not null,
  credit_reward integer not null check (credit_reward >= 1 and credit_reward <= 10),
  status text not null default 'open',
  deadline timestamptz,
  boosted_until timestamptz,
  helper_id text references profiles(user_id),
  created_at timestamptz not null default now()
);
create index if not exists posts_status_idx on posts (status, created_at desc);
create index if not exists posts_user_idx on posts (user_id, created_at desc);
create index if not exists posts_category_idx on posts (category);

create table if not exists offers (
  id text primary key,
  post_id text not null references posts(id),
  requester_id text not null references profiles(user_id),
  helper_id text not null references profiles(user_id),
  message text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (post_id, helper_id)
);
create index if not exists offers_post_idx on offers (post_id, status);
create index if not exists offers_helper_idx on offers (helper_id, created_at desc);

create table if not exists transactions (
  id text primary key,
  from_user_id text,
  to_user_id text not null,
  amount integer not null,
  type text not null,
  related_favor_id text,
  related_challenge_id text,
  label text not null,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);
create index if not exists tx_to_idx on transactions (to_user_id, created_at desc);
create index if not exists tx_from_idx on transactions (from_user_id, created_at desc);
create unique index if not exists tx_favor_payout_unique
  on transactions (related_favor_id)
  where type = 'favor_payout' and related_favor_id is not null;
create unique index if not exists tx_challenge_unique
  on transactions (to_user_id, related_challenge_id)
  where type = 'challenge' and related_challenge_id is not null;
create unique index if not exists tx_starter_unique
  on transactions (to_user_id)
  where type = 'starter';

create table if not exists conversations (
  id text primary key,
  post_id text references posts(id),
  created_at timestamptz not null default now()
);
create unique index if not exists conversations_post_unique
  on conversations (post_id)
  where post_id is not null;

create table if not exists conversation_members (
  conversation_id text not null references conversations(id),
  user_id text not null references profiles(user_id),
  archived boolean not null default false,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id text primary key,
  conversation_id text not null references conversations(id),
  sender_id text not null references profiles(user_id),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_convo_idx on messages (conversation_id, created_at);

create table if not exists challenges (
  id text primary key,
  title text not null,
  description text not null,
  reward integer not null,
  goal integer not null,
  kind text not null
);

create table if not exists challenge_progress (
  user_id text not null references profiles(user_id),
  challenge_id text not null references challenges(id),
  progress integer not null default 0,
  completed boolean not null default false,
  rewarded boolean not null default false,
  completed_at timestamptz,
  primary key (user_id, challenge_id)
);

create table if not exists notifications (
  id text primary key,
  user_id text not null references profiles(user_id),
  type text not null,
  title text not null,
  body text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

create table if not exists reports (
  id text primary key,
  reporter_id text not null references profiles(user_id),
  reported_user_id text,
  post_id text,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists blocks (
  blocker_id text not null references profiles(user_id),
  blocked_id text not null references profiles(user_id),
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table if not exists bookmarks (
  user_id text not null references profiles(user_id),
  post_id text not null references posts(id),
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists reviews (
  id text primary key,
  favor_id text not null references posts(id),
  from_user_id text not null references profiles(user_id),
  to_user_id text not null references profiles(user_id),
  stars integer not null check (stars between 1 and 5),
  tags text not null default '[]',
  body text not null default '',
  created_at timestamptz not null default now(),
  unique (favor_id, from_user_id)
);

create table if not exists plus_waitlist (
  user_id text primary key references profiles(user_id),
  created_at timestamptz not null default now()
);

insert into challenges (id, title, description, reward, goal, kind)
values
  ('first_help', 'Give your first favor', 'Complete one help for a neighbor.', 2, 1, 'helps'),
  ('help_3', 'Help 3 people', 'Finish three favors as the helper.', 3, 3, 'helps'),
  ('complete_5', 'Complete 5 favors', 'Help five times and grow your loop.', 5, 5, 'helps'),
  ('earn_20', 'Earn 20 credits', 'Earn 20 credits from completed helps.', 3, 20, 'credits_earned'),
  ('new_category', 'Two categories', 'Help in two different categories.', 2, 2, 'categories')
on conflict (id) do nothing;

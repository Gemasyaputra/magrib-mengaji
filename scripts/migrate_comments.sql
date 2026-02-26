CREATE TABLE IF NOT EXISTS activity_comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES activity_posts(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  parent_name VARCHAR(100),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

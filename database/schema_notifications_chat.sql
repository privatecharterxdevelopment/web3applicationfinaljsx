-- =========================================
-- PrivateCharterX - Notifications & Chat System
-- SQL Schema for PostgreSQL/MySQL
-- =========================================

-- =========================================
-- 1. NOTIFICATIONS SYSTEM
-- =========================================

-- Notifications table
CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'booking', 'flight', 'wallet', 'asset', 'system', 'message'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500), -- Optional link to related resource
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  metadata JSON, -- Additional data (booking_id, asset_id, etc.)
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type)
);

-- Notification preferences per user
CREATE TABLE notification_preferences (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(255) NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  booking_notifications BOOLEAN DEFAULT TRUE,
  flight_notifications BOOLEAN DEFAULT TRUE,
  wallet_notifications BOOLEAN DEFAULT TRUE,
  asset_notifications BOOLEAN DEFAULT TRUE,
  message_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
);

-- =========================================
-- 2. FAVORITES SYSTEM
-- =========================================

-- User favorites (for assets, flights, etc.)
CREATE TABLE favorites (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(255) NOT NULL,
  item_type VARCHAR(50) NOT NULL, -- 'asset', 'flight', 'empty-leg', 'adventure', 'car'
  item_id VARCHAR(255) NOT NULL,
  item_data JSON, -- Store denormalized data for quick access
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorite (user_id, item_type, item_id),
  INDEX idx_user_id (user_id),
  INDEX idx_item_type (item_type)
);

-- Favorite activity notifications
CREATE TABLE favorite_activities (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  favorite_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'price_change', 'status_change', 'purchase', 'availability'
  old_value VARCHAR(255),
  new_value VARCHAR(255),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notification_sent BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (favorite_id) REFERENCES favorites(id) ON DELETE CASCADE,
  INDEX idx_favorite_id (favorite_id),
  INDEX idx_user_id (user_id),
  INDEX idx_notification_sent (notification_sent)
);

-- =========================================
-- 3. CHAT SUPPORT SYSTEM
-- =========================================

-- Chat conversations
CREATE TABLE chat_conversations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'waiting', 'closed'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  assigned_agent_id VARCHAR(255), -- Support agent user ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  metadata JSON, -- Additional context (booking_id, issue_type, etc.)
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_assigned_agent (assigned_agent_id),
  INDEX idx_created_at (created_at)
);

-- Chat messages
CREATE TABLE chat_messages (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conversation_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(255) NOT NULL, -- User ID or 'system'
  sender_type VARCHAR(20) NOT NULL, -- 'user', 'agent', 'system'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attachments JSON, -- Array of attachment URLs/data
  metadata JSON, -- Additional data
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_read (is_read)
);

-- Support agents
CREATE TABLE support_agents (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'offline', -- 'online', 'away', 'busy', 'offline'
  role VARCHAR(50) DEFAULT 'agent', -- 'agent', 'senior_agent', 'supervisor', 'admin'
  current_capacity INT DEFAULT 0, -- Number of active conversations
  max_capacity INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Chat quick replies (templates)
CREATE TABLE chat_quick_replies (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  agent_id VARCHAR(255), -- NULL for global templates
  category VARCHAR(100), -- 'greeting', 'booking', 'technical', 'closing', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_agent_id (agent_id),
  INDEX idx_category (category),
  INDEX idx_is_active (is_active)
);

-- =========================================
-- 4. ACTIVITY LOG
-- =========================================

-- User activity tracking for notifications
CREATE TABLE user_activity_log (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(255) NOT NULL,
  activity_type VARCHAR(100) NOT NULL, -- 'login', 'booking_created', 'payment_completed', etc.
  description TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_activity_type (activity_type),
  INDEX idx_created_at (created_at)
);

-- =========================================
-- 5. INDEXES & PERFORMANCE
-- =========================================

-- Additional indexes for performance
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_chat_unread ON chat_messages(conversation_id, is_read);
CREATE INDEX idx_conversation_active ON chat_conversations(status, updated_at DESC);

-- =========================================
-- 6. SAMPLE DATA (for testing)
-- =========================================

-- Insert default support agent
INSERT INTO support_agents (id, user_id, name, email, status, role) VALUES
  ('agent-001', 'support@privatecharterx.com', 'PCX Support Team', 'support@privatecharterx.com', 'online', 'admin');

-- Insert some quick reply templates
INSERT INTO chat_quick_replies (category, title, message) VALUES
  ('greeting', 'Welcome Message', 'Hello! Welcome to PrivateCharterX support. How can we help you today?'),
  ('booking', 'Booking Confirmation', 'Your booking has been confirmed. You will receive a confirmation email shortly.'),
  ('technical', 'Technical Issue', 'We''re looking into this technical issue. Our team will resolve it shortly.'),
  ('closing', 'Resolved', 'Great! I''m glad we could help. Feel free to reach out if you need anything else.');

-- =========================================
-- 7. STORED PROCEDURES & TRIGGERS
-- =========================================

-- Trigger to update conversation updated_at on new message
DELIMITER //
CREATE TRIGGER update_conversation_timestamp
AFTER INSERT ON chat_messages
FOR EACH ROW
BEGIN
  UPDATE chat_conversations
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.conversation_id;
END//
DELIMITER ;

-- Trigger to create notification on new chat message for user
DELIMITER //
CREATE TRIGGER notify_user_new_message
AFTER INSERT ON chat_messages
FOR EACH ROW
BEGIN
  DECLARE recipient_id VARCHAR(255);

  -- Get the user_id from conversation
  SELECT user_id INTO recipient_id
  FROM chat_conversations
  WHERE id = NEW.conversation_id;

  -- Only notify if message is from agent/system (not from user themselves)
  IF NEW.sender_type != 'user' AND recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      recipient_id,
      'message',
      'New message from support',
      SUBSTRING(NEW.message, 1, 100),
      CONCAT('/dashboard?view=chat-support&conversation=', NEW.conversation_id),
      JSON_OBJECT('conversation_id', NEW.conversation_id, 'message_id', NEW.id)
    );
  END IF;
END//
DELIMITER ;

-- Function to get unread notification count
DELIMITER //
CREATE FUNCTION get_unread_notification_count(p_user_id VARCHAR(255))
RETURNS INT
DETERMINISTIC
BEGIN
  DECLARE count INT;
  SELECT COUNT(*) INTO count
  FROM notifications
  WHERE user_id = p_user_id AND is_read = FALSE;
  RETURN count;
END//
DELIMITER ;

-- Function to get unread message count
DELIMITER //
CREATE FUNCTION get_unread_message_count(p_user_id VARCHAR(255))
RETURNS INT
DETERMINISTIC
BEGIN
  DECLARE count INT;
  SELECT COUNT(DISTINCT cm.conversation_id) INTO count
  FROM chat_messages cm
  JOIN chat_conversations cc ON cm.conversation_id = cc.id
  WHERE cc.user_id = p_user_id
    AND cm.is_read = FALSE
    AND cm.sender_type != 'user';
  RETURN count;
END//
DELIMITER ;

-- =========================================
-- 8. VIEWS
-- =========================================

-- View for active conversations with latest message
CREATE VIEW active_conversations AS
SELECT
  cc.*,
  (SELECT message FROM chat_messages WHERE conversation_id = cc.id ORDER BY created_at DESC LIMIT 1) as last_message,
  (SELECT created_at FROM chat_messages WHERE conversation_id = cc.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
  (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = cc.id AND is_read = FALSE AND sender_type != 'user') as unread_count
FROM chat_conversations cc
WHERE cc.status != 'closed';

-- =========================================
-- END OF SCHEMA
-- =========================================

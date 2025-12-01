CREATE DATABASE IF NOT EXISTS adwall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE adwall;

CREATE TABLE IF NOT EXISTS ad_type (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_code VARCHAR(30) NOT NULL UNIQUE,
  type_name VARCHAR(50) NOT NULL,
  sort_rule JSON DEFAULT NULL,
  status TINYINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS form_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_id INT,
  config_key VARCHAR(50),
  config_value TEXT,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES ad_type(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ad (
  id VARCHAR(36) PRIMARY KEY,
  type_id INT,
  publisher VARCHAR(100),
  title VARCHAR(100),
  content TEXT,
  heat INT DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0.00,
  landing_url VARCHAR(512),
  video_ids VARCHAR(255),
  ext_info JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES ad_type(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS video (
  id VARCHAR(36) PRIMARY KEY,
  ad_id VARCHAR(36),
  file_name VARCHAR(255),
  file_path VARCHAR(255),
  file_size BIGINT,
  file_type VARCHAR(50),
  duration INT,
  resolution VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ad_id) REFERENCES ad(id) ON DELETE SET NULL
);

INSERT IGNORE INTO ad_type (type_code, type_name, sort_rule, status) VALUES
('short_video', '短视频广告', '{"priority":2,"field":"price","order":"desc","secondField":"created_at","secondOrder":"desc"}', 1),
('brand', '品牌广告', '{"priority":1,"field":"price","order":"desc","secondField":"created_at","secondOrder":"desc"}', 1),
('effect', '效果广告', '{"priority":3,"field":"price","order":"desc","secondField":"created_at","secondOrder":"desc"}', 1);
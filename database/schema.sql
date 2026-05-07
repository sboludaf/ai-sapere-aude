CREATE TABLE IF NOT EXISTS companies (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY companies_name_unique (name)
);

CREATE TABLE IF NOT EXISTS people (
  id CHAR(36) PRIMARY KEY,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY people_email_unique (email)
);

CREATE TABLE IF NOT EXISTS proposals (
  id CHAR(36) PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  consultation_type VARCHAR(255) NOT NULL,
  presentation_url VARCHAR(700) NOT NULL,
  current_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'DELIVERED', 'PAID') NOT NULL DEFAULT 'PENDING',
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  start_date DATE NULL,
  end_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT proposals_company_fk FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS proposal_attendees (
  id CHAR(36) PRIMARY KEY,
  proposal_id CHAR(36) NOT NULL,
  person_id CHAR(36) NOT NULL,
  side ENUM('COMPANY', 'AI_SAPERE_AUDE') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attendees_proposal_fk FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
  CONSTRAINT attendees_person_fk FOREIGN KEY (person_id) REFERENCES people(id),
  UNIQUE KEY proposal_person_side_unique (proposal_id, person_id, side)
);

CREATE TABLE IF NOT EXISTS professors (
  id CHAR(36) PRIMARY KEY,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL,
  specialty VARCHAR(255) NULL,
  hourly_rate DECIMAL(10,2) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY professors_email_unique (email)
);

CREATE TABLE IF NOT EXISTS proposal_professor_assignments (
  id CHAR(36) PRIMARY KEY,
  proposal_id CHAR(36) NOT NULL,
  professor_id CHAR(36) NULL,
  class_title VARCHAR(255) NOT NULL DEFAULT 'Clase',
  professor_name VARCHAR(255) NULL,
  session_date DATE NOT NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  hours DECIMAL(5,2) NOT NULL,
  class_status ENUM('SEARCHING_PROFESSOR', 'PENDING_CONFIRMATION', 'PENDING_PRESENTATION_REVIEW', 'PRESENTATION_OK') NOT NULL DEFAULT 'SEARCHING_PROFESSOR',
  notes VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT assignment_proposal_fk FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
  CONSTRAINT assignment_professor_fk FOREIGN KEY (professor_id) REFERENCES professors(id)
);

CREATE TABLE IF NOT EXISTS budget_versions (
  id CHAR(36) PRIMARY KEY,
  proposal_id CHAR(36) NOT NULL,
  version_number INT NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  reason VARCHAR(500) NULL,
  created_by VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT budget_proposal_fk FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
  UNIQUE KEY budget_proposal_version_unique (proposal_id, version_number)
);

CREATE TABLE IF NOT EXISTS budget_items (
  id CHAR(36) PRIMARY KEY,
  budget_version_id CHAR(36) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  description VARCHAR(700) NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  persons DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT budget_item_version_fk FOREIGN KEY (budget_version_id) REFERENCES budget_versions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS proposal_comments (
  id CHAR(36) PRIMARY KEY,
  proposal_id CHAR(36) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  category ENUM('GENERAL', 'CONTENT', 'BUDGET') NOT NULL DEFAULT 'GENERAL',
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT comments_proposal_fk FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS proposal_status_history (
  id CHAR(36) PRIMARY KEY,
  proposal_id CHAR(36) NOT NULL,
  from_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'DELIVERED', 'PAID') NULL,
  to_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'DELIVERED', 'PAID') NOT NULL,
  note VARCHAR(700) NULL,
  changed_by VARCHAR(255) NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT status_proposal_fk FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE INDEX proposal_company_idx ON proposals(company_id);
CREATE INDEX proposal_status_idx ON proposals(current_status);
CREATE INDEX comments_proposal_created_idx ON proposal_comments(proposal_id, created_at);
CREATE INDEX status_proposal_changed_idx ON proposal_status_history(proposal_id, changed_at);
CREATE INDEX assignment_proposal_date_idx ON proposal_professor_assignments(proposal_id, session_date);

-- Developer Utilization Database Schema

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS task_progress CASCADE;
DROP TABLE IF EXISTS backlogs CASCADE;
DROP TABLE IF EXISTS work_items CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS azure_config CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_client_id_map CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'developer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--user and client app user id mapping for integration
CREATE TABLE IF NOT EXISTS user_client_id_map
(
    user_id integer,
    id integer NOT NULL,
    client_user_id character varying(255),
    active boolean NOT NULL DEFAULT true,
    CONSTRAINT user_client_id_map_pkey PRIMARY KEY (id)
)

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Items table
CREATE TABLE work_items (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'task',
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'new',
    assigned_to VARCHAR(255),
    start_date DATE,
    end_date DATE,
    estimated_hours FLOAT DEFAULT 0.0,
    actual_hours FLOAT DEFAULT 0.0,
    t_shirt_size VARCHAR(10),
    ado_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backlogs table
CREATE TABLE backlogs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'new',
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task Progress table
CREATE TABLE task_progress (
    id SERIAL PRIMARY KEY,
    work_item_id INTEGER REFERENCES work_items(id) ON DELETE CASCADE,
    user_email VARCHAR(255),
    hours_worked FLOAT,
    progress_percentage FLOAT,
    notes TEXT,
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Azure DevOps Configuration table
CREATE TABLE azure_config (
    id SERIAL PRIMARY KEY,
    organization_url VARCHAR(500),
    project_name VARCHAR(255),
    personal_access_token VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_work_items_project ON work_items(project_id);
CREATE INDEX idx_work_items_assigned ON work_items(assigned_to);
CREATE INDEX idx_work_items_status ON work_items(status);
CREATE INDEX idx_backlogs_project ON backlogs(project_id);
CREATE INDEX idx_task_progress_work_item ON task_progress(work_item_id);
CREATE INDEX idx_task_progress_user ON task_progress(user_email);
CREATE INDEX idx_task_progress_date ON task_progress(date);

-- Insert sample data
-- Sample users
INSERT INTO users (email, name, password_hash, role) VALUES
    ('admin@example.com', 'Admin User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqYCZXkVke', 'admin'),
    ('john.doe@example.com', 'John Doe', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqYCZXkVke', 'developer'),
    ('jane.smith@example.com', 'Jane Smith', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqYCZXkVke', 'developer'),
    ('mike.johnson@example.com', 'Mike Johnson', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqYCZXkVke', 'lead'),
    ('sarah.williams@example.com', 'Sarah Williams', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqYCZXkVke', 'developer');

-- Note: Password for all users is 'password123'

-- Sample projects
INSERT INTO projects (name, description, start_date, end_date, status) VALUES
    ('E-Commerce Platform', 'Building a new e-commerce platform with React and FastAPI', '2024-01-15', '2024-06-30', 'active'),
    ('Mobile App Development', 'Cross-platform mobile application development', '2024-02-01', '2024-08-31', 'active'),
    ('Data Analytics Dashboard', 'Real-time analytics dashboard for business metrics', '2024-03-01', '2024-07-15', 'planning'),
    ('API Modernization', 'Modernizing legacy REST APIs to GraphQL', '2023-11-01', '2024-04-30', 'active');

-- Sample work items
INSERT INTO work_items (project_id, title, description, type, priority, status, assigned_to, start_date, end_date, estimated_hours, actual_hours, t_shirt_size) VALUES
    (1, 'Setup React project structure', 'Initialize React app with TypeScript and necessary dependencies', 'task', 'high', 'completed', 'john.doe@example.com', '2024-01-15', '2024-01-16', 8, 6, 'S'),
    (1, 'Design database schema', 'Create PostgreSQL schema for e-commerce entities', 'task', 'high', 'completed', 'jane.smith@example.com', '2024-01-17', '2024-01-19', 16, 18, 'M'),
    (1, 'Implement user authentication', 'JWT-based authentication system', 'feature', 'high', 'in-progress', 'john.doe@example.com', '2024-01-20', '2024-01-25', 24, 16, 'L'),
    (1, 'Product catalog API', 'REST API endpoints for product management', 'feature', 'high', 'in-progress', 'jane.smith@example.com', '2024-01-22', '2024-01-30', 32, 20, 'L'),
    (1, 'Shopping cart functionality', 'Add to cart, update quantity, checkout flow', 'feature', 'medium', 'new', 'john.doe@example.com', '2024-02-01', '2024-02-10', 40, 0, 'XL'),
    (2, 'Setup React Native environment', 'Configure development environment for iOS and Android', 'task', 'high', 'completed', 'mike.johnson@example.com', '2024-02-01', '2024-02-02', 8, 7, 'S'),
    (2, 'Design mobile UI/UX', 'Create wireframes and design system', 'task', 'high', 'in-progress', 'sarah.williams@example.com', '2024-02-05', '2024-02-15', 40, 24, 'L'),
    (2, 'Implement navigation', 'Setup React Navigation with screen transitions', 'task', 'medium', 'new', 'mike.johnson@example.com', '2024-02-16', '2024-02-20', 16, 0, 'M'),
    (3, 'Data warehouse setup', 'Configure data warehouse for analytics', 'task', 'high', 'planning', 'jane.smith@example.com', '2024-03-01', '2024-03-10', 32, 0, 'L'),
    (3, 'Build dashboard components', 'Create reusable chart components', 'task', 'medium', 'planning', 'sarah.williams@example.com', '2024-03-11', '2024-03-20', 24, 0, 'M'),
    (4, 'GraphQL schema design', 'Define GraphQL types and resolvers', 'task', 'high', 'completed', 'john.doe@example.com', '2023-11-15', '2023-11-20', 16, 14, 'M'),
    (4, 'Migrate REST endpoints', 'Convert existing REST APIs to GraphQL', 'feature', 'high', 'in-progress', 'mike.johnson@example.com', '2023-12-01', '2024-04-30', 120, 75, 'XL');

-- Sample backlogs
INSERT INTO backlogs (project_id, title, description, priority, status, created_by) VALUES
    (1, 'Payment gateway integration', 'Integrate Stripe payment processing', 1, 'new', 'admin@example.com'),
    (1, 'Email notification system', 'Send order confirmation and shipping updates', 2, 'new', 'admin@example.com'),
    (1, 'Product reviews and ratings', 'Allow customers to review products', 3, 'new', 'admin@example.com'),
    (2, 'Push notifications', 'Implement Firebase push notifications', 1, 'new', 'admin@example.com'),
    (2, 'Offline mode support', 'Enable app to work without internet', 2, 'new', 'admin@example.com'),
    (3, 'Real-time data updates', 'WebSocket connection for live data', 1, 'new', 'admin@example.com'),
    (3, 'Export reports to PDF', 'Generate PDF reports from dashboard', 2, 'new', 'admin@example.com');

-- Sample task progress
INSERT INTO task_progress (work_item_id, user_email, hours_worked, progress_percentage, notes, date) VALUES
    (1, 'john.doe@example.com', 3, 40, 'Setup basic folder structure', '2024-01-15'),
    (1, 'john.doe@example.com', 3, 100, 'Completed all dependencies and configuration', '2024-01-16'),
    (2, 'jane.smith@example.com', 8, 50, 'Designed main tables for users and products', '2024-01-17'),
    (2, 'jane.smith@example.com', 10, 100, 'Completed all tables and relationships', '2024-01-18'),
    (3, 'john.doe@example.com', 8, 30, 'Implemented JWT token generation', '2024-01-20'),
    (3, 'john.doe@example.com', 8, 70, 'Added login and register endpoints', '2024-01-23'),
    (4, 'jane.smith@example.com', 10, 40, 'Created product CRUD endpoints', '2024-01-22'),
    (4, 'jane.smith@example.com', 10, 65, 'Added filtering and pagination', '2024-01-25'),
    (6, 'mike.johnson@example.com', 4, 60, 'Configured Xcode and Android Studio', '2024-02-01'),
    (6, 'mike.johnson@example.com', 3, 100, 'Tested builds on both platforms', '2024-02-02'),
    (7, 'sarah.williams@example.com', 12, 40, 'Created wireframes for main screens', '2024-02-05'),
    (7, 'sarah.williams@example.com', 12, 60, 'Designed component library', '2024-02-10'),
    (11, 'john.doe@example.com', 7, 50, 'Defined all GraphQL types', '2023-11-15'),
    (11, 'john.doe@example.com', 7, 100, 'Completed schema and resolvers', '2023-11-18'),
    (12, 'mike.johnson@example.com', 40, 40, 'Migrated user and auth endpoints', '2023-12-15'),
    (12, 'mike.johnson@example.com', 35, 62, 'Migrated product and order endpoints', '2024-01-30');

-- Create a view for easy reporting
CREATE OR REPLACE VIEW utilization_summary AS
SELECT 
    u.email,
    u.name,
    u.role,
    COUNT(DISTINCT wi.id) as total_tasks,
    SUM(CASE WHEN wi.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
    SUM(CASE WHEN wi.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_tasks,
    SUM(wi.estimated_hours) as total_estimated_hours,
    SUM(wi.actual_hours) as total_actual_hours,
    CASE 
        WHEN SUM(wi.estimated_hours) > 0 
        THEN ROUND((SUM(wi.actual_hours) / SUM(wi.estimated_hours) * 100)::numeric, 2)
        ELSE 0 
    END as utilization_percentage
FROM users u
LEFT JOIN work_items wi ON wi.assigned_to = u.email
GROUP BY u.email, u.name, u.role;

-- Create a view for project summary
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.status,
    COUNT(wi.id) as total_work_items,
    SUM(CASE WHEN wi.status = 'completed' THEN 1 ELSE 0 END) as completed_items,
    SUM(CASE WHEN wi.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_items,
    SUM(CASE WHEN wi.status = 'new' THEN 1 ELSE 0 END) as new_items,
    SUM(wi.estimated_hours) as total_estimated_hours,
    SUM(wi.actual_hours) as total_actual_hours,
    CASE 
        WHEN COUNT(wi.id) > 0 
        THEN ROUND((SUM(CASE WHEN wi.status = 'completed' THEN 1 ELSE 0 END)::numeric / COUNT(wi.id) * 100), 2)
        ELSE 0 
    END as completion_percentage
FROM projects p
LEFT JOIN work_items wi ON wi.project_id = p.id
GROUP BY p.id, p.name, p.status;

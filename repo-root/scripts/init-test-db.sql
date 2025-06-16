-- Initialize test database with required extensions and settings

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create additional test databases for parallel testing
CREATE DATABASE locumtruerate_test_1;
CREATE DATABASE locumtruerate_test_2;
CREATE DATABASE locumtruerate_test_3;
CREATE DATABASE locumtruerate_test_4;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE locumtruerate_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE locumtruerate_test_1 TO postgres;
GRANT ALL PRIVILEGES ON DATABASE locumtruerate_test_2 TO postgres;
GRANT ALL PRIVILEGES ON DATABASE locumtruerate_test_3 TO postgres;
GRANT ALL PRIVILEGES ON DATABASE locumtruerate_test_4 TO postgres;

-- Set up extensions in test databases
\c locumtruerate_test_1;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c locumtruerate_test_2;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c locumtruerate_test_3;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c locumtruerate_test_4;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Switch back to main test database
\c locumtruerate_test;

-- Create a test user with limited permissions for security testing
CREATE USER test_readonly WITH PASSWORD 'readonly_pass';
GRANT CONNECT ON DATABASE locumtruerate_test TO test_readonly;
GRANT USAGE ON SCHEMA public TO test_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO test_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO test_readonly;
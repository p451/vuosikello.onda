-- Enable RLS for all relevant tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- TASKS
DROP POLICY IF EXISTS "Tenant users can access their own tasks" ON tasks;
CREATE POLICY "Tenant users can access their own tasks"
  ON tasks
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id = tasks.tenant_id
  ));

-- EVENTS
DROP POLICY IF EXISTS "Tenant users can read their own events" ON events;
CREATE POLICY "Tenant users can read their own events"
  ON events
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id = events.tenant_id
  ));

DROP POLICY IF EXISTS "Tenant admins/editors can write their own events" ON events;
CREATE POLICY "Tenant admins/editors can write their own events"
  ON events
  FOR INSERT, UPDATE, DELETE
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id = events.tenant_id
      AND user_roles.role IN ('admin', 'editor')
  ));
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id = events.tenant_id
      AND user_roles.role IN ('admin', 'editor')
  ));

-- EVENT_COMMENTS
DROP POLICY IF EXISTS "Tenant users can access their own event comments" ON event_comments;
CREATE POLICY "Tenant users can access their own event comments"
  ON event_comments
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id = event_comments.tenant_id
  ));
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id = event_comments.tenant_id
  ));

-- TENANT_EVENT_TYPES
DROP POLICY IF EXISTS "Tenant users can access their own event types" ON tenant_event_types;
CREATE POLICY "Tenant users can access their own event types"
  ON tenant_event_types
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id = tenant_event_types.tenant_id
  ));
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id = tenant_event_types.tenant_id
  ));

-- TENANTS
DROP POLICY IF EXISTS "Tenant users can read their tenant" ON tenants;
CREATE POLICY "Tenant users can read their tenant"
  ON tenants
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id = tenants.id
  ));

-- PROFILES
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Tenant admins can read all profiles in their tenant" ON profiles;
CREATE POLICY "Tenant admins can read all profiles in their tenant"
  ON profiles
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id IN (
        SELECT user_roles_1.tenant_id FROM user_roles user_roles_1 WHERE user_roles_1.user_id = profiles.id
      )
      AND user_roles.role = 'admin'
  ));

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Tenant admins can update all profiles in their tenant" ON profiles;
CREATE POLICY "Tenant admins can update all profiles in their tenant"
  ON profiles
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id IN (
        SELECT user_roles_1.tenant_id FROM user_roles user_roles_1 WHERE user_roles_1.user_id = profiles.id
      )
      AND user_roles.role = 'admin'
  ));

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
CREATE POLICY "Users can view their own role"
  ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can do anything" ON user_roles;
CREATE POLICY "Service role can do anything"
  ON user_roles
  FOR ALL
  USING (auth.role() = 'service_role');
  WITH CHECK (auth.role() = 'service_role');

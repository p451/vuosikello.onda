# Supabase RLS Policies for Multi-Tenant App

Below are the recommended Row Level Security (RLS) policies for your multi-tenant task/calendar app. These policies assume:
- Every table with a `tenant_id` column is tenant-scoped.
- Only authenticated users with a matching `user_roles` entry for a tenant can access that tenant's data.
- Admin/editor roles are required for certain write operations.
- Users can only update their own profile.

---

## 1. Enable RLS for All Tables
```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
```

---

## 2. `tasks` Table
```sql
-- Allow tenant members to read and write their own tasks
CREATE POLICY "Tenant users can access their own tasks"
  ON tasks
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id = tasks.tenant_id
  ));
```

---

## 3. `events` Table
```sql
-- Allow tenant members to read events
CREATE POLICY "Tenant users can read their own events"
  ON events
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id = events.tenant_id
  ));

-- Allow tenant admins and editors to insert/update/delete events
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
```

---

## 4. `event_comments` Table
```sql
-- Allow tenant members to read and write their own event comments
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
```

---

## 5. `tenant_event_types` Table
```sql
-- Allow tenant members to read and write their own event types
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
```

---

## 6. `tenants` Table
```sql
-- Allow users to read their own tenant
CREATE POLICY "Tenant users can read their tenant"
  ON tenants
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.tenant_id = tenants.id
  ));
```

---

## 7. `profiles` Table
```sql
-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow tenant admins to read all profiles in their tenant
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

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow tenant admins to update all profiles in their tenant
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
```

---

## 8. `user_roles` Table
```sql
-- Allow users to view their own role
CREATE POLICY "Users can view their own role"
  ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role to do anything (for backend/admin scripts)
CREATE POLICY "Service role can do anything"
  ON user_roles
  FOR ALL
  USING (auth.role() = 'service_role');
  WITH CHECK (auth.role() = 'service_role');
```

---

**How to use:**
- Copy each policy block into the Supabase SQL editor and run it after deleting all existing policies.
- Adjust role names or logic as needed for your app.
- Make sure RLS is enabled for each table.

---

**If you need further customization (e.g., more granular permissions), let me know!**

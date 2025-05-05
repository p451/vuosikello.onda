-- Create roles enum
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

-- Create user_roles table
CREATE TABLE user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'viewer',
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, tenant_id)
);

-- Update RLS policies for events table to check roles
CREATE POLICY "Admins and editors can insert events"
ON events
FOR INSERT
WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND tenant_id = events.tenant_id
        AND role IN ('admin', 'editor')
    )
);

CREATE POLICY "Admins and editors can update events"
ON events
FOR UPDATE
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND tenant_id = events.tenant_id
        AND role IN ('admin', 'editor')
    )
)
WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

CREATE POLICY "Admins and editors can delete events"
ON events
FOR DELETE
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND tenant_id = events.tenant_id
        AND role IN ('admin', 'editor')
    )
);

-- All users (including viewers) can view events
CREATE POLICY "All users can view their tenant's events"
ON events
FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND tenant_id = events.tenant_id
    )
);
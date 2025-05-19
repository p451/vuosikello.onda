-- Drop overlapping and overly permissive policies
DROP POLICY IF EXISTS "Allow all operations" ON public.tasks;
DROP POLICY IF EXISTS "Enable access to all users" ON public.events;
DROP POLICY IF EXISTS "Users can delete their tenant's events" ON public.events;
DROP POLICY IF EXISTS "Users can insert events for their tenant" ON public.events;
DROP POLICY IF EXISTS "Users can update their tenant's events" ON public.events;
DROP POLICY IF EXISTS "Users can view their tenant's events" ON public.events;
DROP POLICY IF EXISTS "Allow tenant members to delete events" ON public.events;
DROP POLICY IF EXISTS "Allow tenant members to insert events" ON public.events;
DROP POLICY IF EXISTS "Allow tenant members to read events" ON public.events;
DROP POLICY IF EXISTS "Allow tenant members to update events" ON public.events;

-- Create proper task policies
CREATE POLICY "Users can view tasks in their tenant" ON public.tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        )
    );

CREATE POLICY "Admins and editors can manage tasks" ON public.tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
            AND user_roles.role IN ('admin', 'editor')
        )
    );

-- Create proper tenant_event_types policies
CREATE POLICY "Admins can manage event types" ON public.tenant_event_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.tenant_id = tenant_event_types.tenant_id
            AND user_roles.role = 'admin'
        )
    );

-- Streamline events policies to be role-based
CREATE POLICY "Users can view events in their tenant" ON public.events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.tenant_id = events.tenant_id
        )
    );

CREATE POLICY "Editors and admins can manage events" ON public.events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.tenant_id = events.tenant_id
            AND user_roles.role IN ('admin', 'editor')
        )
    );

-- Update event comments policies to be more specific
DROP POLICY IF EXISTS "Allow tenant members to insert comments" ON public.event_comments;
DROP POLICY IF EXISTS "Tenant users can insert comments" ON public.event_comments;
DROP POLICY IF EXISTS "Tenant users can view comments" ON public.event_comments;

CREATE POLICY "Users can view comments in their tenant" ON public.event_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.tenant_id = event_comments.tenant_id
        )
    );

CREATE POLICY "Users can create comments in their tenant" ON public.event_comments
    FOR INSERT WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.tenant_id = event_comments.tenant_id
        )
    );

CREATE POLICY "Users can manage their own comments" ON public.event_comments
    FOR ALL USING (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.tenant_id = event_comments.tenant_id
        )
    );

CREATE POLICY "Admins can manage all comments" ON public.event_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.tenant_id = event_comments.tenant_id
            AND user_roles.role = 'admin'
        )
    );

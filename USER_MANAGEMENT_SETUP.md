# User Management Setup Guide

## Issues Found and Fixes Applied

### 1. Missing Supabase Edge Functions
**Problem**: The dashboards call Edge Functions that don't exist.
**Solution**: Created `create_user` and `delete_user` Edge Functions.

### 2. Security and Configuration Issues
**Problem**: Hardcoded URLs and missing proper authentication.
**Solution**: Updated headers with proper authorization and created environment example.

### 3. Missing Role Management
**Problem**: TenantAdminDashboard couldn't edit user roles.
**Solution**: Added role editing dropdown with `changeUserRole` function.

## Deployment Steps

### 1. Deploy Supabase Edge Functions ✅ COMPLETED

```powershell
# Install Supabase CLI if not already installed
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref kwgqmiwprnujqkjihllg

# Deploy the functions (COMPLETED)
supabase functions deploy create_user --use-api
supabase functions deploy delete_user --use-api
```

**Status**: ✅ Both functions deployed successfully:
- `create_user` (ID: a2c2596e-26d5-41a1-a244-4c31f983b332) - ACTIVE
- `delete_user` (ID: 920db9d0-b8d0-45af-83f8-76a657069d37) - ACTIVE

You can view them in the [Supabase Dashboard](https://supabase.com/dashboard/project/kwgqmiwprnujqkjihllg/functions)

### 2. Set Environment Variables in Supabase ✅ READY

Go to your Supabase Dashboard > Settings > Environment Variables and add:

```
BREVO_API_KEY=your_brevo_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

**Status**: ✅ You mentioned the Brevo API key is already set up.

### 3. Set Environment Variables in Netlify

Go to your Netlify Dashboard > Site Settings > Environment Variables and add:

```
VITE_SUPABASE_URL=https://kwgqmiwprnujqkjihllg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z3FtaXdwcm51anFramlobGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDU1NTEsImV4cCI6MjA2MjI4MTU1MX0.plhNaMEg8jiiNBvkMNPPbtsevM43ArGEXVe_TbVJE54
```

**Note**: Netlify doesn't need the Brevo API key since email sending happens on the Supabase Edge Functions side.

### 4. Get Brevo API Key

1. Sign up/login to [Brevo (SendinBlue)](https://www.brevo.com/)
2. Go to Account Settings > API Keys
3. Generate a new API key
4. Add it to both Supabase and Netlify environment variables

### 5. Database Schema Verification

Ensure your Supabase database has these tables:

```sql
-- profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_roles table
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES tenants(id),
  role TEXT CHECK (role IN ('viewer', 'editor', 'admin', 'superadmin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);
```

## Current User Management Features

### SuperAdmin Dashboard
- ✅ Create/invite users to tenants
- ✅ Edit user roles within tenants
- ✅ Remove users from tenants
- ✅ Send invitation emails via Brevo
- ✅ Manage tenants and event types

### Tenant Admin Dashboard
- ✅ Create/invite users to their tenant
- ✅ Edit user roles (newly added)
- ✅ Delete users permanently
- ✅ Send invitation emails via Brevo
- ✅ Manage event types for their tenant

## Known Limitations

1. **User Deletion**: Currently deletes users completely from auth. Consider soft deletion for audit trails.
2. **Email Templates**: Basic email templates are used. Consider creating branded templates in Brevo.
3. **Error Handling**: Could be improved with better user feedback and retry mechanisms.
4. **Validation**: Additional input validation could be added for email formats and role permissions.

## Testing Checklist

Before deploying to production:

- [ ] Test user creation with valid emails
- [ ] Verify invitation emails are sent and received
- [ ] Test role changes and permission updates
- [ ] Test user deletion and cleanup
- [ ] Verify RLS policies work correctly
- [ ] Test error scenarios (invalid emails, network failures)
- [ ] Verify Netlify deployment works with environment variables

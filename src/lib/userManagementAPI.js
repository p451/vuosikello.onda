// API utility for user management operations
export const userManagementAPI = {
  // Create a new user
  createUser: async (email, role, tenantId) => {
    try {
      const response = await fetch('https://kwgqmiwprnujqkjihllg.supabase.co/functions/v1/create_user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z3FtaXdwcm51anFramlobGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDU1NTEsImV4cCI6MjA2MjI4MTU1MX0.plhNaMEg8jiiNBvkMNPPbtsevM43ArGEXVe_TbVJE54`
        },
        body: JSON.stringify({
          email,
          role,
          tenant_id: tenantId
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create user');
      }
      
      return result;
    } catch (error) {
      console.error('Create user error:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  },

  // Delete a user
  deleteUser: async (userId) => {
    try {
      const response = await fetch('https://kwgqmiwprnujqkjihllg.supabase.co/functions/v1/delete_user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z3FtaXdwcm51anFramlobGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDU1NTEsImV4cCI6MjA2MjI4MTU1MX0.plhNaMEg8jiiNBvkMNPPbtsevM43ArGEXVe_TbVJE54`
        },
        body: JSON.stringify({
          user_id: userId
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete user');
      }
      
      return result;
    } catch (error) {
      console.error('Delete user error:', error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
};

"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface Organization {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  subscription_tier: string;
  subscription_status: string;
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
}

export interface Permission {
  resource: string;
  action: string;
}

export interface UserData {
  user: User | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
  roles: UserRole[];
  permissions: Permission[];
  isLoading: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [userData, setUserData] = useState<UserData>({
    user: null,
    organizations: [],
    currentOrganization: null,
    roles: [],
    permissions: [],
    isLoading: true,
    isAdmin: false,
  });

  // Fetch user data including roles, permissions, and organizations
  const fetchUserData = useCallback(async () => {
    try {
      setUserData(prev => ({ ...prev, isLoading: true }));
      
      const supabase = createClient();
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        setUserData({
          user: null,
          organizations: [],
          currentOrganization: null,
          roles: [],
          permissions: [],
          isLoading: false,
          isAdmin: false,
        });
        return;
      }
      
      // Get user organizations
      const { data: orgMembers, error: orgError } = await supabase
        .from('organization_members')
        .select(`
          organization:organizations (
            id, 
            name, 
            description, 
            logo_url, 
            subscription_tier,
            subscription_status
          ),
          role
        `)
        .eq('user_id', user.id);
      
      if (orgError) throw orgError;
      
      const organizations = orgMembers?.map(member => ({
        ...member.organization,
        userRole: member.role
      })) || [];
      
      // Get user roles
      const { data: roleAssignments, error: roleError } = await supabase
        .from('user_role_assignments')
        .select(`
          role:user_roles (
            id,
            name,
            description
          )
        `)
        .eq('user_id', user.id);
      
      if (roleError) throw roleError;
      
      const roles = roleAssignments?.map(assignment => assignment.role) || [];
      
      // Get user permissions
      const { data: permissions, error: permError } = await supabase
        .rpc('get_user_permissions', { p_user_id: user.id });
      
      if (permError) throw permError;
      
      // Set default organization to first one if available
      const currentOrganization = organizations.length > 0 ? organizations[0] : null;
      
      // Check if user is admin
      const isAdmin = roles.some(role => role.name === 'admin');
      
      setUserData({
        user,
        organizations,
        currentOrganization,
        roles,
        permissions: permissions || [],
        isLoading: false,
        isAdmin
      });
      
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const supabase = createClient();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          fetchUserData();
        } else if (event === 'SIGNED_OUT') {
          setUserData({
            user: null,
            organizations: [],
            currentOrganization: null,
            roles: [],
            permissions: [],
            isLoading: false,
            isAdmin: false,
          });
        }
      }
    );
    
    // Initial fetch
    fetchUserData();
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // Switch the current organization
  const switchOrganization = useCallback(async (organizationId: string) => {
    const organization = userData.organizations.find(org => org.id === organizationId);
    if (organization) {
      setUserData(prev => ({ ...prev, currentOrganization: organization }));
      return true;
    }
    return false;
  }, [userData.organizations]);

  // Check if user has permission
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (userData.isAdmin) return true; // Admin has all permissions
    
    return userData.permissions.some(
      permission => permission.resource === resource && permission.action === action
    );
  }, [userData.permissions, userData.isAdmin]);

  // Check multiple permissions (any)
  const hasAnyPermission = useCallback((permissions: { resource: string, action: string }[]): boolean => {
    if (userData.isAdmin) return true;
    
    return permissions.some(({ resource, action }) => 
      hasPermission(resource, action)
    );
  }, [userData.isAdmin, hasPermission]);
  
  // Check multiple permissions (all)
  const hasAllPermissions = useCallback((permissions: { resource: string, action: string }[]): boolean => {
    if (userData.isAdmin) return true;
    
    return permissions.every(({ resource, action }) => 
      hasPermission(resource, action)
    );
  }, [userData.isAdmin, hasPermission]);

  // Sign out function
  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Auth state listener will handle updating the state
  }, []);

  return {
    user: userData.user,
    organizations: userData.organizations,
    currentOrganization: userData.currentOrganization,
    roles: userData.roles,
    permissions: userData.permissions,
    isLoading: userData.isLoading,
    isAdmin: userData.isAdmin,
    isAuthenticated: !!userData.user,
    switchOrganization,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    signOut,
    refreshUserData: fetchUserData
  };
} 
"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangleIcon } from "lucide-react";

interface RequirePermissionProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function RequirePermission({ 
  resource, 
  action, 
  children, 
  fallback 
}: RequirePermissionProps) {
  const { hasPermission, isLoading } = useAuth();
  
  // Don't render anything while loading
  if (isLoading) {
    return null;
  }
  
  // Check if user has required permission
  if (hasPermission(resource, action)) {
    return <>{children}</>;
  }
  
  // Return fallback content if provided
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Default fallback is nothing
  return null;
}

/**
 * Component that conditionally renders children based on multiple permissions (any)
 */
export function RequireAnyPermission({ 
  permissions, 
  children, 
  fallback 
}: { 
  permissions: Array<{ resource: string; action: string }>;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasAnyPermission, isLoading } = useAuth();
  
  if (isLoading) {
    return null;
  }
  
  if (hasAnyPermission(permissions)) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return null;
}

/**
 * Component that conditionally renders children based on multiple permissions (all)
 */
export function RequireAllPermissions({ 
  permissions, 
  children, 
  fallback 
}: { 
  permissions: Array<{ resource: string; action: string }>;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasAllPermissions, isLoading } = useAuth();
  
  if (isLoading) {
    return null;
  }
  
  if (hasAllPermissions(permissions)) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return null;
}

/**
 * Component for admin-only content
 */
export function AdminOnly({ 
  children, 
  fallback 
}: { 
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isAdmin, isLoading } = useAuth();
  
  if (isLoading) {
    return null;
  }
  
  if (isAdmin) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return null;
}

/**
 * Default permission denied fallback with error message
 */
export function PermissionDenied() {
  return (
    <Alert variant="destructive">
      <AlertTriangleIcon className="h-4 w-4 mr-2" />
      <AlertDescription>
        You don't have permission to access this resource.
      </AlertDescription>
    </Alert>
  );
} 
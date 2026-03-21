import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * RoleContext - User Role State Management
 * 
 * Governance: Tracks current user role for future multi-role UI support
 * Responsibility: Provide role state to components
 * Roles: Contributor, Template Editor, Admin
 * 
 * Role hierarchy (cumulative):
 * - Contributor: Base role (content authoring)
 * - Template Editor: Inherits Contributor + template authoring
 * - Admin: Inherits Template Editor + governance controls
 * 
 * Current state: All users are Contributors (future phases will add role switching)
 * 
 * State: Session state (not persisted)
 * 
 * @see Mylo Governance: Roles and authority
 */

export type Role = 'contributor' | 'template-editor' | 'admin';

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
}

export function RoleProvider({ children }: RoleProviderProps) {
  const [role, setRole] = useState<Role>('contributor');

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
import { createContext, useContext, useState, ReactNode } from 'react';
import type { Role } from '../types';

/**
 * @file contexts/RoleContext.tsx
 * @role Active role state management
 * @owns In-memory role state; exposes setRole so SessionContext can sync
 *       the persisted session role into React state on login and page restore.
 * @does-not-own Role type definition (types/index.ts), session persistence
 *               (SessionContext), role-based UI gating (individual components).
 *
 * Role hierarchy (cumulative):
 * - contributor:     Base role — content authoring only
 * - template-editor: Inherits contributor + template authoring
 * - admin:           Inherits template-editor + governance controls
 *
 * State: In-memory only. SessionContext bootstraps setRole on mount and login.
 *
 * @see types/index.ts — Role type definition
 * @see SessionContext.tsx — calls setRole to sync persisted session role
 */

export type { Role };

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
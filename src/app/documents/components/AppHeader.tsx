/**
 * @file documents/components/AppHeader.tsx
 * @role Application-wide top bar
 * @owns Mylo wordmark, primary nav links (Documents; Templates for
 *       template-editor + admin), session user display (name + role badge),
 *       sign-out action. Role badge color communicates governance level at a glance.
 * @does-not-own Session persistence (SessionContext), routing beyond logout redirect,
 *               document/folder state, sidebar navigation (FolderSidebar).
 *
 * Nav layout: [Mylo wordmark] [nav links] [spacer] [role badge] [name] [sign out]
 *
 * NavLink active state is handled automatically by React Router via isActive.
 * Active link: slightly darker text + bottom underline using --mylo-text-primary.
 * Inactive link: --mylo-text-secondary, no underline.
 *
 * @see SessionContext.tsx — session.name, logout()
 * @see RoleContext.tsx — current role for badge + Templates link visibility
 */

import { NavLink, useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { useRole } from '../../contexts/RoleContext';
import { Button } from '../../components/ui/button';

// ---------------------------------------------------------------------------
// Role display config
// ---------------------------------------------------------------------------

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  contributor: {
    label: 'Contributor',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  'template-editor': {
    label: 'Template Editor',
    className: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  admin: {
    label: 'Admin',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppHeader() {
  const { session, logout } = useSession();
  const { role } = useRole();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const roleConfig = ROLE_CONFIG[role] ?? {
    label: role,
    className: 'bg-mylo-surface-subtle text-mylo-text-secondary border-mylo-border-light',
  };

  const canSeeTemplates = role === 'template-editor' || role === 'admin';

  // NavLink className helper — active = darker text + underline, inactive = secondary
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-sm font-medium text-mylo-text-primary border-b-2 border-mylo-text-primary pb-px'
      : 'text-sm font-medium text-mylo-text-secondary hover:text-mylo-text-primary transition-colors';

  return (
    <header className="h-14 shrink-0 flex items-center px-6 bg-mylo-surface border-b border-mylo-border-light z-10">
      {/* Wordmark */}
      <span className="text-[15px] font-semibold tracking-tight text-mylo-text-primary select-none mr-6">
        Mylo
      </span>

      {/* Primary nav */}
      <nav className="flex items-center gap-5">
        <NavLink to="/documents" className={navLinkClass}>
          Documents
        </NavLink>
        {canSeeTemplates && (
          <NavLink to="/templates" className={navLinkClass}>
            Templates
          </NavLink>
        )}
      </nav>

      <div className="flex-1" />

      {/* Right cluster */}
      <div className="flex items-center gap-3">
        {/* Role badge */}
        <span
          className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${roleConfig.className}`}
        >
          {roleConfig.label}
        </span>

        {/* Name */}
        <span className="text-sm font-medium text-mylo-text-primary">
          {session?.name}
        </span>

        <div className="w-px h-4 bg-mylo-border-light" />

        {/* Sign out */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="h-8 px-2.5 gap-1.5 text-mylo-text-secondary hover:text-mylo-text-primary"
        >
          <LogOut className="size-3.5" />
          <span className="text-sm">Sign out</span>
        </Button>
      </div>
    </header>
  );
}

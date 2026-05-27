/**
 * @file login/LoginPage.tsx
 * @role Login entry point
 * @owns Login form UI — name input, role selection, form submission.
 *       Redirects to /documents when a session already exists.
 * @does-not-own Session persistence (SessionContext.login), routing decisions
 *               beyond the post-login redirect, role permission enforcement.
 *
 * Auth model: mock login — name + role picker, no passwords, no backend.
 * On submit, calls SessionContext.login() which persists to localStorage
 * and syncs role to RoleContext, then navigates to /documents.
 *
 * @see SessionContext.tsx — login() action and session state
 * @see router.tsx — /login route (public)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSession } from '../contexts/SessionContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import type { Role } from '../types';

// ---------------------------------------------------------------------------
// Role options
// ---------------------------------------------------------------------------

const ROLES: { value: Role; label: string; description: string }[] = [
  {
    value: 'contributor',
    label: 'Contributor',
    description: 'Write and edit documents',
  },
  {
    value: 'template-editor',
    label: 'Template Editor',
    description: 'Author and publish templates',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Manage users and governance',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LoginPage() {
  const { session, login } = useSession();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('contributor');

  // If a session already exists (page refresh), skip straight to documents
  useEffect(() => {
    if (session) {
      navigate('/documents', { replace: true });
    }
  }, [session, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    login(trimmed, role);
    navigate('/documents', { replace: true });
  };

  const canSubmit = name.trim().length > 0;

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-mylo-canvas">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium tracking-tight text-mylo-text-primary">
            Mylo
          </h1>
          <p className="text-sm text-mylo-text-secondary mt-1">
            Governed document platform
          </p>
        </div>

        {/* Login card */}
        <div className="bg-mylo-surface rounded-xl border border-mylo-border-light shadow-sm px-8 py-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Name field */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-sm text-mylo-text-primary">
                Your name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. Alex Chen"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="off"
                autoFocus
              />
            </div>

            {/* Role field */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role" className="text-sm text-mylo-text-primary">
                Role
              </Label>
              <Select value={role} onValueChange={v => setRole(v as Role)}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="font-medium">{r.label}</span>
                      <span className="text-muted-foreground ml-1.5 text-xs">
                        — {r.description}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full mt-1"
            >
              Enter Mylo
            </Button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-mylo-text-tertiary mt-6">
          Single-browser session — no passwords required
        </p>
      </div>
    </div>
  );
}

/**
 * @file router.tsx
 * @role Application routing and route protection
 * @owns Route definitions, ProtectedRoute guard (session-check and role-check),
 *       the canonical URL structure for the entire application.
 * @does-not-own Auth state (SessionContext), role state (RoleContext),
 *               page component implementations, navigation UI, redirects
 *               within individual pages (e.g. LoginPage's session-exists redirect).
 *
 * Route structure:
 *   /                          → /documents (session) or /login (no session) — single hop
 *   /login                     → LoginPage (public; redirects to /documents if session exists)
 *   /documents                 → DocumentsPage           [protected: session required]
 *   /documents/:id             → EditorPage              [protected: session required]
 *   /templates                 → TemplateListPage        [role-gated: template-editor, admin]
 *   /templates/new             → TemplateEditorPage      [role-gated: template-editor, admin]
 *   /templates/:id             → TemplateEditorPage      [role-gated: template-editor, admin]
 *
 * ProtectedRoute renders <Outlet /> when access is permitted.
 * - No session          → redirect to /login
 * - Insufficient role   → redirect to /documents
 *
 * @see SessionContext.tsx — session state consumed by ProtectedRoute
 * @see RoleContext.tsx — role state consumed by ProtectedRoute
 * @see App.tsx — root element; provides context hierarchy above all routes
 */

import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import App from './App';
import { LoginPage } from './login/LoginPage';
import { DocumentsPage } from './documents/DocumentsPage';
import { EditorPage } from './editor/EditorPage';
import { TemplateListPage } from './templates/TemplateListPage';
import { TemplateEditorPage } from './templates/TemplateEditorPage';
import { useSession } from './contexts/SessionContext';
import { useRole } from './contexts/RoleContext';
import { useDocuments } from './contexts/DocumentContext';
import type { Role } from './types';

const LAST_DOCUMENT_ID_KEY = 'mylo_last_document_id';

// ---------------------------------------------------------------------------
// Route guard
// ---------------------------------------------------------------------------

/**
 * ProtectedRoute — renders <Outlet /> if access is permitted, otherwise redirects.
 *
 * Without allowedRoles: any authenticated session passes.
 * With allowedRoles: session must exist AND role must be in the allowed set.
 *
 * Two ProtectedRoute layers are composed in the tree:
 *   1. Base layer (no allowedRoles) — all authenticated routes
 *   2. Role layer (allowedRoles=['template-editor','admin']) — template routes
 */
/**
 * RootRedirect — eliminates the double redirect when unauthenticated users hit /.
 *
 * Previous behaviour: / → /documents (unconditional) → /login (ProtectedRoute).
 * This component reads session directly and redirects in one hop:
 *   - No session                       → /login
 *   - Session + valid last document ID → /documents/:id
 *   - Session + missing/invalid ID     → /documents
 *
 * Must render inside App (i.e. inside SessionProvider) to have context access.
 */
function RootRedirect() {
  const { session } = useSession();
  const { documents } = useDocuments();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const lastDocumentId = localStorage.getItem(LAST_DOCUMENT_ID_KEY);
  const lastDocumentExists = documents.some((document) => document.id === lastDocumentId);

  return <Navigate to={lastDocumentExists ? `/documents/${lastDocumentId}` : '/documents'} replace />;
}

function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { session } = useSession();
  const { role } = useRole();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/documents" replace />;
  }

  return <Outlet />;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const router = createBrowserRouter([
  {
    // Root element: provides the full context hierarchy (Role → Session → Document)
    // and renders <Outlet /> for all child routes.
    path: '/',
    element: <App />,
    children: [
      // Default: redirect / based on session state (single hop, no flicker).
      // RootRedirect reads session from SessionProvider (provided by App above).
      {
        index: true,
        element: <RootRedirect />,
      },

      // Public route: login page
      // LoginPage handles its own session-exists redirect to /documents.
      {
        path: 'login',
        element: <LoginPage />,
      },

      // Protected routes: require active session
      {
        element: <ProtectedRoute />,
        children: [
          // Document management and editing
          {
            path: 'documents',
            children: [
              { index: true, element: <DocumentsPage /> },
              { path: ':id', element: <EditorPage /> },
            ],
          },

          // Template routes: additionally require template-editor or admin role
          {
            element: <ProtectedRoute allowedRoles={['template-editor', 'admin']} />,
            children: [
              {
                path: 'templates',
                children: [
                  { index: true, element: <TemplateListPage /> },
                  { path: 'new', element: <TemplateEditorPage /> },
                  { path: ':id', element: <TemplateEditorPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);

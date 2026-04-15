/**
 * @file App.tsx
 * @role Application root and context provider hierarchy
 * @owns The provider tree (RoleProvider → SessionProvider → DocumentProvider)
 *       and the router <Outlet /> that all page routes render into.
 * @does-not-own Route definitions (router.tsx), page implementations,
 *               editor state (EditorPage), session logic (SessionContext),
 *               document state (DocumentContext).
 *
 * Provider order is load-bearing:
 *   RoleProvider      — outermost: must exist before SessionProvider so that
 *                       SessionProvider can call setRole on mount/login/logout.
 *   SessionProvider   — middle: must wrap DocumentProvider so that call sites
 *                       (Modals.tsx, FolderSidebar.tsx) can read session.name
 *                       for createdBy and pass it explicitly to createDocument
 *                       and createFolder. DocumentContext itself is session-free.
 *   DocumentProvider  — session-free; receives createdBy at call sites.
 *   TemplateProvider  — innermost: seeds mylo_templates on first load; provides
 *                       template CRUD and publishedTemplates to all pages.
 *
 * All page components rendered via <Outlet /> have access to the full
 * context hierarchy above them.
 *
 * @see router.tsx — App is the root element of the browser router
 * @see RoleContext.tsx, SessionContext.tsx, DocumentContext.tsx,
 *      TemplateContext.tsx — provided here
 */

import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { RoleProvider } from './contexts/RoleContext';
import { SessionProvider } from './contexts/SessionContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { TemplateProvider } from './contexts/TemplateContext';

/**
 * DevTestSuite — opt-in dev test harness. Does NOT run on normal startup.
 * To enable: localStorage.setItem('mylo_dev_tests', 'true'), then refresh.
 * Runs only in development builds (import.meta.env.DEV).
 * Output is console-only; no UI impact.
 */
function DevTestSuite() {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (localStorage.getItem('mylo_dev_tests') !== 'true') return;
    const timer = setTimeout(() => {
      void Promise.all([
        import('./services/__tests__/serializerPhase3A.test'),
        import('./services/__tests__/phase4Validation.test'),
        import('./services/__tests__/phase5Validation.test'),
        import('./mylo/templates/__tests__/validateAdapter'),
        import('./services/__tests__/governanceEnforcement.test'),
      ]).then(([
        { runPhase3ATests },
        { runPhase4Tests },
        { runPhase5Tests },
        { runAllValidations },
        { runGovernanceEnforcementTests },
      ]) => {
        runPhase3ATests();
        runPhase4Tests();
        runPhase5Tests();
        runAllValidations();
        runGovernanceEnforcementTests();
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

export default function App() {
  return (
    <RoleProvider>
      <SessionProvider>
        <DocumentProvider>
          <TemplateProvider>
            <DevTestSuite />
            <Outlet />
            <Toaster position="bottom-right" />
          </TemplateProvider>
        </DocumentProvider>
      </SessionProvider>
    </RoleProvider>
  );
}

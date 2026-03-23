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
 *   DocumentProvider  — innermost: session-free; receives createdBy at call sites.
 *
 * All page components rendered via <Outlet /> have access to the full
 * context hierarchy above them.
 *
 * @see router.tsx — App is the root element of the browser router
 * @see RoleContext.tsx, SessionContext.tsx, DocumentContext.tsx — provided here
 */

import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { RoleProvider } from './contexts/RoleContext';
import { SessionProvider } from './contexts/SessionContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { runPhase3ATests } from './services/__tests__/serializerPhase3A.test';
import { runPhase4Tests } from './services/__tests__/phase4Validation.test';
import { runPhase5Tests } from './services/__tests__/phase5Validation.test';
import { runAllValidations } from './mylo/templates/__tests__/validateAdapter';

/**
 * DevTestSuite — runs the original codebase validation tests on mount.
 * Preserves the test harness that existed before Phase 1 refactoring.
 * Tests run once after a 1000ms delay to allow the app to fully initialize.
 * Output is console-only; no UI impact.
 */
function DevTestSuite() {
  useEffect(() => {
    const timer = setTimeout(() => {
      runPhase3ATests();
      runPhase4Tests();
      runPhase5Tests();
      runAllValidations();
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
          <DevTestSuite />
          <Outlet />
        </DocumentProvider>
      </SessionProvider>
    </RoleProvider>
  );
}

import { useState, useEffect } from "react";
import { EditorState } from "prosemirror-state";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./components/ui/resizable";
import { EditorPanel } from "./contributor/editor/EditorPanel";
import { PreviewPanel } from "./contributor/preview/PreviewPanel";
import { RoleProvider } from "./contexts/RoleContext";
import { runPhase3ATests } from "./services/__tests__/serializerPhase3A.test";
import { runPhase4Tests } from "./services/__tests__/phase4Validation.test";
import { runPhase5Tests } from "./services/__tests__/phase5Validation.test";
import { runAllValidations as runStep3AdapterValidation } from "./mylo/templates/__tests__/validateAdapter";

export default function App() {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [isModified, setIsModified] = useState(false);

  const handleDocumentChange = (state: EditorState) => {
    setEditorState(state);
  };

  // Phase 3A, 4 & 5 Validation - Run tests on mount
  useEffect(() => {
    // Run tests after a brief delay to ensure everything is loaded
    const timer = setTimeout(() => {
      runPhase3ATests();
      runPhase4Tests();
      runPhase5Tests();
      runStep3AdapterValidation();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <RoleProvider>
      <div className="h-screen w-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-mylo-border-light bg-mylo-surface px-6 py-4 shadow-sm">
          {/* Header content - reserved for future use */}
        </header>

        {/* Main content with split panes */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={30}>
              <EditorPanel 
                onDocumentChange={handleDocumentChange}
                isModified={isModified}
                onModifiedChange={setIsModified}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={50} minSize={30}>
              <PreviewPanel editorState={editorState} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </RoleProvider>
  );
}
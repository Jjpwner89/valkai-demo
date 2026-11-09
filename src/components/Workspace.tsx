"use client";

import { useState } from "react";
import { KeyProvider } from "@/lib/apiKey";
import Chat from "./Chat";
import KeyGate from "./KeyGate";
import PbrerTool from "./PbrerTool";
import Sidebar, { type View } from "./Sidebar";
import Tools from "./Tools";

export default function Workspace() {
  const [view, setView] = useState<View>("chat");
  const [toolOpened, setToolOpened] = useState(false);

  function navigate(next: View) {
    if (next === "pbrer") setToolOpened(true);
    setView(next);
  }

  return (
    <KeyProvider>
      <div className="app">
        <Sidebar view={view} onNavigate={navigate} />
        <main className="main">
          {/* Chat and the tool stay mounted, so a conversation or a run survives switching views. */}
          <div className="view" hidden={view !== "chat"}>
            <Chat />
          </div>
          {view === "tools" && <Tools onOpen={() => navigate("pbrer")} />}
          {toolOpened && (
            <div className="view tool-in" hidden={view !== "pbrer"}>
              <PbrerTool onBack={() => navigate("tools")} />
            </div>
          )}
        </main>
        <KeyGate />
      </div>
    </KeyProvider>
  );
}

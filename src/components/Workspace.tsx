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

  return (
    <KeyProvider>
      <div className="app">
        <Sidebar view={view} onNavigate={setView} />
        <main className="main">
          {/* Chat stays mounted so the conversation survives a trip to Tools. */}
          <div className="view" hidden={view !== "chat"}>
            <Chat />
          </div>
          {view === "tools" && <Tools onOpen={() => setView("pbrer")} />}
          {view === "pbrer" && (
            <div className="view tool-in">
              <PbrerTool onBack={() => setView("tools")} />
            </div>
          )}
        </main>
        <KeyGate />
      </div>
    </KeyProvider>
  );
}

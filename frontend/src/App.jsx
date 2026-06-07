import { useState } from "react";
import LandingPage from "./LandingPage";
import HomePage from "./HomePage";
import SimulationLab from "./SimulationLab";
import RealLabGuide from "./RealLabGuide";
import ExtensionPage from "./ExtensionPage";
import Sky from "./cinematic/Sky";

export default function App() {
  const [view, setView] = useState({ name: "landing" });

  function openExperiment(experimentId, mode) {
    setView({ name: mode, experimentId });
  }
  function goHome() {
    setView({ name: "home" });
  }
  function goLanding() {
    setView({ name: "landing" });
  }
  function openExtension() {
    setView({ name: "extension" });
  }

  return (
    <>
      <Sky />
      {view.name === "simulation" && (
        <SimulationLab experimentId={view.experimentId} onBack={goHome} />
      )}
      {view.name === "real-lab" && (
        <RealLabGuide experimentId={view.experimentId} onBack={goHome} />
      )}
      {view.name === "extension" && <ExtensionPage onBack={goHome} />}
      {view.name === "home" && (
        <HomePage
          onOpen={openExperiment}
          onBack={goLanding}
          onOpenExtension={openExtension}
        />
      )}
      {view.name === "landing" && <LandingPage onStart={goHome} />}
    </>
  );
}

import { useState } from "react";
import LandingPage from "./LandingPage";
import HomePage from "./HomePage";
import SimulationLab from "./SimulationLab";
import RealLabGuide from "./RealLabGuide";
import SocraticTutor from "./SocraticTutor";
import CustomLab from "./CustomLab";
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
  function openTutor() {
    setView({ name: "tutor" });
  }
  function openCustom() {
    setView({ name: "custom" });
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
      {view.name === "tutor" && <SocraticTutor onBack={goHome} />}
      {view.name === "custom" && <CustomLab onBack={goHome} />}
      {view.name === "extension" && <ExtensionPage onBack={goHome} />}
      {view.name === "home" && (
        <HomePage
          onOpen={openExperiment}
          onBack={goLanding}
          onOpenExtension={openExtension}
          onOpenTutor={openTutor}
          onOpenCustom={openCustom}
        />
      )}
      {view.name === "landing" && <LandingPage onStart={goHome} />}
    </>
  );
}

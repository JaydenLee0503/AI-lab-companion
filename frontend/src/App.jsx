import { useState } from "react";
import LandingPage from "./LandingPage";
import HomePage from "./HomePage";
import SimulationLab from "./SimulationLab";
import RealLabGuide from "./RealLabGuide";

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

  if (view.name === "simulation") {
    return <SimulationLab experimentId={view.experimentId} onBack={goHome} />;
  }
  if (view.name === "real-lab") {
    return <RealLabGuide experimentId={view.experimentId} onBack={goHome} />;
  }
  if (view.name === "home") {
    return <HomePage onOpen={openExperiment} onBack={goLanding} />;
  }
  return <LandingPage onStart={goHome} />;
}

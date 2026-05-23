import { useState } from "react";
import HomePage from "./HomePage";
import SimulationLab from "./SimulationLab";
import RealLabGuide from "./RealLabGuide";

export default function App() {
  const [view, setView] = useState({ name: "home" });

  function openExperiment(experimentId, mode) {
    setView({ name: mode, experimentId });
  }
  function goHome() {
    setView({ name: "home" });
  }

  if (view.name === "simulation") {
    return (
      <SimulationLab experimentId={view.experimentId} onBack={goHome} />
    );
  }
  if (view.name === "real-lab") {
    return (
      <RealLabGuide experimentId={view.experimentId} onBack={goHome} />
    );
  }
  return <HomePage onOpen={openExperiment} />;
}

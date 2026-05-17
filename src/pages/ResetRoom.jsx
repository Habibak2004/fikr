import { useState } from "react";
import EnergyCheck from "@/components/reset-room/EnergyCheck";
import PhotoUpload from "@/components/reset-room/PhotoUpload";
import AnalysisView from "@/components/reset-room/AnalysisView";
import ActiveReset from "@/components/reset-room/ActiveReset";
import CompletionScreen from "@/components/reset-room/CompletionScreen";

// Flow: energy → upload → analysis → active → complete
export default function ResetRoom() {
  const [step, setStep] = useState("energy"); // energy | upload | analysis | active | complete
  const [energyLevel, setEnergyLevel] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);

  const handleEnergySelect = (level) => {
    setEnergyLevel(level);
    setStep("upload");
  };

  const handlePhotoAnalyzed = (url, data) => {
    setPhotoUrl(url);
    setAnalysisData(data);
    setStep("analysis");
  };

  const handleStartReset = () => setStep("active");

  const handleComplete = (stats) => {
    setSessionStats(stats);
    setStep("complete");
  };

  const handleRestart = () => {
    setStep("energy");
    setEnergyLevel(null);
    setPhotoUrl(null);
    setAnalysisData(null);
    setSessionStats(null);
  };

  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      {step === "energy" && <EnergyCheck onSelect={handleEnergySelect} />}
      {step === "upload" && (
        <PhotoUpload energyLevel={energyLevel} onAnalyzed={handlePhotoAnalyzed} onBack={() => setStep("energy")} />
      )}
      {step === "analysis" && (
        <AnalysisView
          photoUrl={photoUrl}
          analysisData={analysisData}
          energyLevel={energyLevel}
          onStart={handleStartReset}
        />
      )}
      {step === "active" && (
        <ActiveReset
          analysisData={analysisData}
          energyLevel={energyLevel}
          onComplete={handleComplete}
        />
      )}
      {step === "complete" && (
        <CompletionScreen
          photoUrl={photoUrl}
          sessionStats={sessionStats}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import EnergyCheck from "@/components/reset-room/EnergyCheck";
import PhotoUpload from "@/components/reset-room/PhotoUpload";
import AnalysisView from "@/components/reset-room/AnalysisView";
import ActiveReset from "@/components/reset-room/ActiveReset";
import CompletionScreen from "@/components/reset-room/CompletionScreen";

const SESSION_KEY = "reset_room_session";

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {}; } catch { return {}; }
}

function saveSession(data) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}

// Flow: energy → upload → analysis → active → complete
export default function ResetRoom() {
  const saved = loadSession();
  const [step, setStep] = useState(saved.step || "energy");
  const [energyLevel, setEnergyLevel] = useState(saved.energyLevel || null);
  const [photoUrl, setPhotoUrl] = useState(saved.photoUrl || null);
  const [analysisData, setAnalysisData] = useState(saved.analysisData || null);
  const [sessionStats, setSessionStats] = useState(saved.sessionStats || null);

  useEffect(() => {
    saveSession({ step, energyLevel, photoUrl, analysisData, sessionStats });
  }, [step, energyLevel, photoUrl, analysisData, sessionStats]);

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
    sessionStorage.removeItem(SESSION_KEY);
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
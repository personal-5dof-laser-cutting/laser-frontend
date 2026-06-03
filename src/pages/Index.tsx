import { useCallback, useRef, useState } from "react";
import { SVGEditor } from "@/components/LaserCutter/SVGEditor";
import { ControlPanel } from "@/components/LaserCutter/ControlPanel";
import { ProgressBar } from "@/components/LaserCutter/ProgressBar";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

import { SVGPathData, ModelLayout } from "@/types/svg";
import { WSMessage } from "@/services/websocket";
import { useCuttingParameters } from "@/hooks/useCuttingParameters";
import { useProgress } from "@/hooks/useProgress";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useGCodeExport } from "@/hooks/useGCodeExport";
import { useLaserPosition } from "@/hooks/useLaserPosition";
import { useTraceOutline } from "@/hooks/useTraceOutline";



const CUTBED_SIZE_MM = {
  width: 400,
  height: 389,
};

const Index = () => {
  const [modelLayout, setModelLayout] = useState<ModelLayout | null>(null);
  const [showLaser, setShowLaser] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { parameters, setParameters, setSvg, setModelOffset, setModelScale, resetForNewFile } = useCuttingParameters();
  const { progress, update: updateProgress, reset: resetProgress } = useProgress();
  const { laserPosition, updateFromWebSocket, updateFromEditor, resetLaserPosition } = useLaserPosition();
  const { generateGCode } = useGCodeExport();
  const { traceOutline } = useTraceOutline();
  const handleMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case "info":
        console.log("Got info:", msg.content)
        break;
      case "update":
        updateProgress(msg.content);
        break;
      case "result":
        console.log("Got result:", msg.content);
        break;
      case "error":
        console.error("WS error:", msg.content);
        break;
      case "laser_position":
        updateFromWebSocket(msg.content);
        break;
  
      default:
        console.warn("Unhandled WS message type:", msg.type);
    }
  }, [updateProgress, updateFromWebSocket]);
  

  const { send } = useWebSocket(handleMessage);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".svg")) {
      toast.error("Please upload an SVG file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      resetForNewFile()
      setSvg(e.target?.result as string);

      toast.success("SVG loaded successfully");
    };
    reader.onerror = () => toast.error("Failed to load SVG file");
    reader.readAsText(file);
  };

  const handleSVGParsed = useCallback((paths: SVGPathData[]) => {
    if (paths.length > 0) toast.info(`Parsed ${paths.length} elements`);
  }, []);

  const handleStartCutting = async () => {
    if (!parameters.svg) {
      toast.error("Please load an SVG file first");
      return;
    }
    try{
      updateProgress("Starting job...")

      const response = await fetch("http://127.0.0.1:8000/cut_svg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parameters)
      });

      if (!response.ok) {
          const errorBody = await response.json();
          console.error("Failed to start cutting:", errorBody);
          toast.error(`Failed: ${response.statusText}`)
          return;
      }
      const { job_id } = await response.json()
      toast.success("Starting cutting operation...");
      
      send({type: "job_id", content: job_id})

    } catch (err) {
        toast.error("Failed to start cutting");
        console.error(err)
        resetProgress();
    }
  };

  const handleAbortCut = () => {
    send({ type: "abort", content: "" });
    resetProgress();
    toast.info("Cut operation aborted");
  };

  const handleRemoveFile = () => {
    resetForNewFile()
    resetLaserPosition()
    setModelLayout(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("File removed");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="default"
              className="bg-gray-500 text-white hover:bg-gray-400"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload SVG
            </Button>
            {parameters.svg && (
              <Button onClick={handleRemoveFile} variant="destructive">
                <X className="mr-2 h-4 w-4" />
                Remove File
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 h-[calc(100vh-140px)]">
          <div className="w-full h-full">
            <SVGEditor
              svgContent={parameters.svg}
              cutbedSize={CUTBED_SIZE_MM}
              dpi={parameters.dpi}
              laserPosition={laserPosition}
              laserActive={!parameters.laser_off}
              showLaser={showLaser}
              modelOffset={{
                x: parameters.x_offset,
                y: parameters.y_offset,
              }}
              modelScale={parameters.model_scale}
              onSVGParsed={handleSVGParsed}
              onUploadClick={() => fileInputRef.current?.click()}
              onLaserPositionChange={updateFromEditor}
              onModelOffsetChange={setModelOffset}
              onModelScaleChange={setModelScale}
              onModelLayoutChange={setModelLayout}
            />
          </div>
          <div className="h-full">
            <ControlPanel
              parameters={parameters}
              laserPosition={{
                x: parameters["svg"] ? laserPosition.x : 0,
                y: parameters["svg"] ? CUTBED_SIZE_MM.height - laserPosition.y : 0,
                angle: 0,
              }}
              showLaser={showLaser}
              modelLayout={modelLayout}
              onParametersChange={setParameters}
              onLaserPositionChange={updateFromEditor}
              onShowLaserChange={setShowLaser}
              onTraceOutline={() => traceOutline(parameters)}
              onGenerateGCode={() => generateGCode(parameters)}
              onStartCutting={handleStartCutting}
              onAbortCut={handleAbortCut}
              disabled={!parameters.svg}
            />
          </div>
        </div>
      </div>

      {progress.visible && (
        <ProgressBar
          value={progress.value}
          text={progress.text}
          onDismiss={resetProgress}
        />
      )}
    </div>
  );
};

export default Index;
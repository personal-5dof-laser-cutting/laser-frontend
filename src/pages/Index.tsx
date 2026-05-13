import { useCallback, useRef, useState } from "react";
import { SVGEditor } from "@/components/LaserCutter/SVGEditor";
import { ControlPanel } from "@/components/LaserCutter/ControlPanel";
import { ProgressBar } from "@/components/LaserCutter/ProgressBar";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

import { SVGPathData, CuttingParameters, LaserPosition, ModelLayout } from "@/types/svg";
import { WSMessage } from "@/services/websocket";
import { useCuttingParameters } from "@/hooks/useCuttingParameters";
import { useProgress } from "@/hooks/useProgress";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useGCodeExport } from "@/hooks/useGCodeExport";



const CUTBED_SIZE_MM = {
  width: 400,
  height: 389,
};

const getInitialSVGScaling = (svgContent: string) =>
  svgContent.includes("Adobe Illustrator") ? "illustrator" : "mm";

const Index = () => {
  const [parsedPaths, setParsedPaths] = useState<SVGPathData[]>([]);
  const [modelLayout, setModelLayout] = useState<ModelLayout | null>(null);
  const [showLaser, setShowLaser] = useState(true);
  const [laserPosition, setLaserPosition] = useState<LaserPosition>({
    x: 0,
    y: 0,
    angle: 0,
  });

  const [progressValue, setProgressValue] = useState<number>(0);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { parameters, setParameters, setSvg } = useCuttingParameters();
  const { progress, update: updateProgress, reset: resetProgress } = useProgress();
  const { generateGCode } = useGCodeExport();
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
        updateLaserPosition(msg.content);
        break;
  
      default:
        console.warn("Unhandled WS message type:", msg.type);
    }
  }, [updateProgress]);

  function updateLaserPosition(content: string) {
    try {
      const nextPosition = JSON.parse(content) as Partial<LaserPosition>;
      setLaserPosition((currentPosition) => ({
        x: typeof nextPosition.x === "number" ? nextPosition.x : currentPosition.x,
        y: typeof nextPosition.y === "number" ? nextPosition.y : currentPosition.y,
        angle: 0,
      }));
    } catch (err) {
      console.error("Failed to parse laser position:\n", err);
    }
  }

  function handleLaserPositionChange(position: LaserPosition) {
    setLaserPosition({ ...position, angle: 0 });
  }

  function handleModelOffsetChange(offset: { x: number; y: number }) {
    setParameters((currentParameters) => ({
      ...currentParameters,
      x_offset: offset.x,
      y_offset: offset.y,
    }));
  }

  function handleModelScaleChange(scale: number) {
    setParameters((currentParameters) => ({
      ...currentParameters,
      model_scale: scale,
    }));
  }
  

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
      setSvg(e.target?.result as string);
      // setParameters((currentParameters) => ({
      //   ...currentParameters,
      //   svg: content,
      //   scaling: getInitialSVGScaling(content),
      //   x_offset: 0,
      //   y_offset: 0,
      //   model_scale: 1,
      // }));
      // setModelLayout(null);
      toast.success("SVG loaded successfully");
    };
    reader.onerror = () => toast.error("Failed to load SVG file");
    reader.readAsText(file);
  };

  const handleSVGParsed = useCallback((paths: SVGPathData[]) => {
    if (paths.length > 0) toast.info(`Parsed ${paths.length} elements`);
  }, []);

  // const handleRemoveFile = () => {
  //   setSvg(null);
  //   if (fileInputRef.current) fileInputRef.current.value = "";
  //   toast.success("File removed");
  // };

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
  const handleTraceOutline = () => {
    if (!parameters.svg) {
      toast.error("Please load an SVG file first");
      return;
    }
    toast.info("Tracing outline...");
  };

  const handleRemoveFile = () => {
    setParameters((currentParameters) => ({
      ...currentParameters,
      svg: null,
      x_offset: 0,
      y_offset: 0,
      model_scale: 1,
    }));
    setLaserPosition({
      x: 0,
      y: 0,
      angle: 0,
    });
    setModelLayout(null);
    setParsedPaths([]);
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
              onLaserPositionChange={handleLaserPositionChange}
              onModelOffsetChange={handleModelOffsetChange}
              onModelScaleChange={handleModelScaleChange}
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
              onLaserPositionChange={(position) => {
                setLaserPosition({
                  x: position.x,
                  y: CUTBED_SIZE_MM.height - position.y,
                  angle: 0,
                });
              }}
              onShowLaserChange={setShowLaser}
              onTraceOutline={handleTraceOutline}
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
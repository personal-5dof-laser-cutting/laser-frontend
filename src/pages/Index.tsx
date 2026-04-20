import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SVGEditor } from "@/components/LaserCutter/SVGEditor";
import { ControlPanel } from "@/components/LaserCutter/ControlPanel";
import { CuttingParameters, SVGPathData } from "@/types/svg";
import { X } from "lucide-react";
import { toast } from "sonner";
import { WSMessage, wsService } from "@/services/websocket";

const Index = () => {
  const [parsedPaths, setParsedPaths] = useState<SVGPathData[]>([]);
  const [parameters, setParameters] = useState<CuttingParameters>({
    material: "wood",
    material_thickness: 5,
    cut_speed: 5,
    cut_power: 70,
    laser_off: false,
    optimize: true,
    svg: null,
    scaling: "mm",
    x_offset: 0,
    y_offset: 0
  });
  const [progressValue, setProgressValue] = useState<number>(0);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    wsService.connectWebsocket(handleMessage);;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't toggle when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }
      if (e.key === "h" || e.key === "H") {
        setShowAdvanced((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadSVGFile = (file: File) => {
    if (!file.name.endsWith(".svg")) {
      toast.error("Please upload an SVG file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setParameters({...parameters, svg: content});
      toast.success("SVG loaded successfully");
    };
    reader.onerror = () => {
      toast.error("Failed to load SVG file");
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    loadSVGFile(file);
  };

  const handleFileDrop = (file: File) => {
    loadSVGFile(file);
  };

  const handleSVGParsed = useCallback((paths: SVGPathData[]) => {
    setParsedPaths(paths);
    console.log("Parsed SVG paths:", paths);
    if (paths.length > 0) {
      toast.info(`Parsed ${paths.length} elements with data attributes`);
    }
  }, []);

  function handleMessage(msg: WSMessage) {
    console.log("Message:\n")
      switch (msg.type) {
        case "update":
          updateProgress(msg.content);
          break;
        
        case "result":
          console.log("Got result:\n" + msg.content);
          break;

        case "error":
          console.error("Recieved WS error:\n", msg.content);
          break;

        default:
          console.log("WSMessage type " + msg.type + " not implemented");
      }
  }

  function updateProgress(progress: string) {
    console.log(progress);  
    const percentMatch = progress.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      const percentage = parseFloat(percentMatch[1]);
      setProgressValue(percentage);
      setShowProgress(true);
      setProgressText(progress);
      
      // hide bar when done
      if (percentage >= 100) {
        setTimeout(() => {
          setShowProgress(false);
          setProgressValue(0);
          setProgressText("");
        }, 2000);
      }
    } else {
      // no percentage found, just text
      setShowProgress(true);
      setProgressText(progress);
      setProgressValue(0);
    }
  }

  const handleTraceOutline = () => {
    if (!parameters["svg"]) {
      toast.error("Please load an SVG file first");
      return;
    }
    toast.info("Tracing outline...");
    console.log("Trace outline with parameters:", parameters);
    console.log("Parsed paths:", parsedPaths);
  };

  const handleStartCutting = async () => {
    if (!parameters["svg"]) {
      toast.error("Please load an SVG file first");
      return;
    }
    toast.success("Cutting...");
    console.log("Start cutting with parameters:", parameters);
    console.log("Parsed paths:", parsedPaths);
    // show progress on bar pop up
    // setShowProgress(true);
    // setProgressValue(0);
    // setProgressText("Initializing cut...");

    wsService.send(JSON.stringify(parameters));
  }

  const abortCut = async () => {
    wsService.send(JSON.stringify({
      type: "abort"
    }));
    
    // hiding the progress bar on abort
    setShowProgress(false);
    setProgressValue(0);
    setProgressText("");
    toast.info("Cut operation aborted");
  }

  const handleGenerateGCode = async () => {
    if (!parameters["svg"]) {
      toast.error("Please load an SVG file first");
      return;
    }
    toast.success("Starting generating gcode...");
    console.log("Start generating with parameters:", parameters);
    console.log("Parsed paths:", parsedPaths);
    const response = await fetch("http://127.0.0.1:8000/generate_gcode", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parameters)
    });
    if (response.ok) {
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl
      link.download = "model.gcode";
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    }
  };

  const handleRemoveFile = () => {
    parameters["svg"] = null;
    setParsedPaths([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("File removed");
  };

  return (
    <div className="min-h-screen bg-background">
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 h-[calc(100vh-48px)]">
          {/* Editor Area */}
          <div className="w-full h-full">
            <SVGEditor 
              svgContent={parameters["svg"]} 
              onSVGParsed={handleSVGParsed}
              onUploadClick={() => fileInputRef.current?.click()}
              onFileDrop={handleFileDrop}
            />
          </div>

          {/* Control Panel */}
          <div className="h-full">
            <ControlPanel
              parameters={parameters}
              onParametersChange={setParameters}
              onTraceOutline={handleTraceOutline}
              onGenerateGCode={handleGenerateGCode}
              onStartCutting={handleStartCutting}
              disabled={!parameters["svg"]}
              showAdvanced={showAdvanced}
            />
          </div>
        </div>
      </div>
            
      {showProgress && (
        <div className="fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg min-w-[300px] z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowProgress(false);
                setProgressValue(0);
                setProgressText("");
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progressValue} className="mb-2" />
          <p className="text-xs text-muted-foreground">{progressText}</p>
        </div>
      )}
    </div>
  );
};

export default Index;

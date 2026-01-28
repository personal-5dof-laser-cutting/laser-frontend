import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SVGEditor } from "@/components/LaserCutter/SVGEditor";
import { ControlPanel } from "@/components/LaserCutter/ControlPanel";
import { CuttingParameters, SVGPathData } from "@/types/svg";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [parsedPaths, setParsedPaths] = useState<SVGPathData[]>([]);
  const [parameters, setParameters] = useState<CuttingParameters>({
    material: "wood",
    thickness: 3,
    speed: 50,
    power: 80,
    laserActive: true,
    optimizeCuts: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".svg")) {
      toast.error("Please upload an SVG file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSvgContent(content);
      toast.success("SVG loaded successfully");
    };
    reader.onerror = () => {
      toast.error("Failed to load SVG file");
    };
    reader.readAsText(file);
  };

  const handleSVGParsed = useCallback((paths: SVGPathData[]) => {
    setParsedPaths(paths);
    console.log("Parsed SVG paths:", paths);
    if (paths.length > 0) {
      toast.info(`Parsed ${paths.length} elements with data attributes`);
    }
  }, []);
  let ws: WebSocket, reconnectDelay: number

  function handleMessage(msg: any) {
      switch (msg.type) {
        case "update":
          updateProgress(msg.content);
          break;
        
        case "result":
          console.log("Got result:\n" + msg.content);
          break;

        default:
          console.log(msg.type + " not implemented");
      }
  }

  function connectWebsocket() {
    ws = new WebSocket("ws://localhost:8000/ws/cut_svg")

    ws.onopen = () => {
      console.log("frontend connected");
      reconnectDelay = 1000;
    }

    ws.onmessage = (e) => {
      console.log("message recieved");
      const msg = JSON.parse(e.data);
      handleMessage(msg);
    }

    ws.onclose = () => {
      console.log("frontend disconnected");
      setTimeout(connectWebsocket, reconnectDelay);
      console.log("retrying...")
      reconnectDelay = Math.min(reconnectDelay * 2, 10000);
    }

    ws.onerror = () => ws.close();
  }

  connectWebsocket();

  function updateProgress(progress: string) {
    console.log(progress)
  }

  const handleTraceOutline = () => {
    if (!svgContent) {
      toast.error("Please load an SVG file first");
      return;
    }
    toast.info("Tracing outline...");
    console.log("Trace outline with parameters:", parameters);
    console.log("Parsed paths:", parsedPaths);
  };

  const handleStartCutting = async () => {
    if (!svgContent) {
      toast.error("Please load an SVG file first");
      return;
    }
    toast.success("Starting cutting operation...");
    console.log("Start cutting with parameters:", parameters);
    console.log("Parsed paths:", parsedPaths);

    ws.send(JSON.stringify({
        material_thickness: parameters["thickness"],
        optimize: parameters["optimizeCuts"],
        laser_off: !parameters["laserActive"],
        cut_speed: parameters["speed"],
        svg: svgContent,
      }));
  }

  const abortCut = async () => {
    ws.send(JSON.stringify({
      type: "abort"
    }))
  }

  const handleGenerateGCode = async () => {
    if (!svgContent) {
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
      body: JSON.stringify({
        material_thickness: parameters["thickness"],
        optimize: parameters["optimizeCuts"],
        laser_off: !parameters["laserActive"],
        cut_speed: parameters["speed"],
        svg: svgContent,
      })
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
    setSvgContent(null);
    setParsedPaths([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("File removed");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-end">
            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="default"
                className="bg-gray-500 text-white hover:bg-gray-400"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload SVG
              </Button>
              {svgContent && (
                <Button
                  onClick={handleRemoveFile}
                  variant="destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove File
                </Button>
              )}
            </div>
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 h-[calc(100vh-140px)]">
          {/* Editor Area */}
          <div className="w-full h-full">
            <SVGEditor 
              svgContent={svgContent} 
              onSVGParsed={handleSVGParsed}
              onUploadClick={() => fileInputRef.current?.click()}
            />
          </div>

          {/* Control Panel */}
          <div className="h-full">
            <ControlPanel
              parameters={parameters}
              onParametersChange={setParameters}
              onTraceOutline={handleTraceOutline}
              onStartCutting={handleStartCutting}
              disabled={!svgContent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

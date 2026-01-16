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
    laserActive: true
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

  const handleTraceOutline = () => {
    if (!svgContent) {
      toast.error("Please load an SVG file first");
      return;
    }
    toast.info("Tracing outline...");
    console.log("Trace outline with parameters:", parameters);
    console.log("Parsed paths:", parsedPaths);
  };

  const handleStartCutting = () => {
    if (!svgContent) {
      toast.error("Please load an SVG file first");
      return;
    }
    toast.success("Starting cutting operation...");
    console.log("Start cutting with parameters:", parameters);
    console.log("Parsed paths:", parsedPaths);
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

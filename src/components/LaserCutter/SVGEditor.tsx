import { useEffect, useRef, useState } from "react";
import { SVGPathData } from "@/types/svg";
import { Upload } from "lucide-react";

interface SVGEditorProps {
  svgContent: string | null;
  onSVGParsed?: (paths: SVGPathData[]) => void;
  onUploadClick?: () => void;
  onFileDrop?: (file: File) => void;
}

export const SVGEditor = ({ svgContent, onSVGParsed, onUploadClick, onFileDrop }: SVGEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [parsedPaths, setParsedPaths] = useState<SVGPathData[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = svgContent;

    // Parse SVG elements and extract data attributes
    const svgElement = containerRef.current.querySelector("svg");
    if (!svgElement) return;

    const paths: SVGPathData[] = [];
    const elements = svgElement.querySelectorAll("[data-rotation], [data-tilt], [data-depth]");

    elements.forEach((element) => {
      const pathData: SVGPathData = {
        element: element as SVGElement,
        rotation: element.getAttribute("data-rotation") || undefined,
        tilt: element.getAttribute("data-tilt") || undefined,
        depth: element.getAttribute("data-depth") || undefined,
        stroke: element.getAttribute("stroke") || undefined,
        fill: element.getAttribute("fill") || undefined,
      };
      paths.push(pathData);
    });

    setParsedPaths(paths);
    onSVGParsed?.(paths);

    // Make SVG responsive
    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "100%");
    svgElement.style.maxWidth = "100%";
    svgElement.style.maxHeight = "100%";
  }, [svgContent, onSVGParsed]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileDrop?.(file);
    }
  };

  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-muted/30 border-2 border-dashed rounded-lg overflow-hidden transition-colors ${
        isDragOver ? "border-primary bg-primary/10" : "border-border"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={!svgContent ? onUploadClick : undefined}
    >
      {svgContent ? (
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center p-4"
        />
      ) : (
        <div className="text-center text-muted-foreground cursor-pointer">
          <Upload className="mx-auto h-10 w-10 mb-4" />
          <p className="text-lg font-medium">Upload SVG5DOF</p>
        </div>
      )}
    </div>
  );
};

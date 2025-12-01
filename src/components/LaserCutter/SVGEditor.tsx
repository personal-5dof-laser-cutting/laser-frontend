import { useEffect, useRef, useState } from "react";
import { SVGPathData } from "@/types/svg";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface SVGEditorProps {
  svgContent: string | null;
  onSVGParsed?: (paths: SVGPathData[]) => void;
  onUploadClick?: () => void;
}

export const SVGEditor = ({ svgContent, onSVGParsed, onUploadClick }: SVGEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [parsedPaths, setParsedPaths] = useState<SVGPathData[]>([]);

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

  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/30 border-2 border-dashed border-border rounded-lg overflow-hidden">
      {svgContent ? (
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center p-4"
        />
      ) : (
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-4">No SVG loaded</p>
          <Button
            onClick={onUploadClick}
            variant="outline"
            size="lg"
            className="bg-gray-500 text-white hover:bg-gray-400"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload SVG File
          </Button>
        </div>
      )}
    </div>
  );
};

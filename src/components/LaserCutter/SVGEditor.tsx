import { useEffect, useRef, useState } from "react";
import { LaserPosition, ModelLayout, SVGPathData } from "@/types/svg";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface CutbedSize {
  width: number;
  height: number;
}

interface SVGEditorProps {
  svgContent: string | null;
  cutbedSize: CutbedSize;
  scaling: string;
  laserPosition: LaserPosition;
  laserActive: boolean;
  showLaser: boolean;
  modelOffset: {
    x: number;
    y: number;
  };
  modelScale: number;
  onSVGParsed?: (paths: SVGPathData[]) => void;
  onUploadClick?: () => void;
  onLaserPositionChange?: (position: LaserPosition) => void;
  onModelOffsetChange?: (offset: { x: number; y: number }) => void;
  onModelScaleChange?: (scale: number) => void;
  onModelLayoutChange?: (layout: ModelLayout | null) => void;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const ILLUSTRATOR_UNITS_PER_MM = 72 / 25.4;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const clampRange = (value: number, first: number, second: number) =>
  clamp(value, Math.min(first, second), Math.max(first, second));
const roundMillimeters = (value: number) => Math.round(value);

interface ModelBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ContentPlacement {
  translateX: number;
  translateY: number;
  scale: number;
  unitsPerMillimeter: number;
  cutbedFrameX: number;
  cutbedFrameY: number;
  sourceBounds: ModelBounds;
  baseBounds: ModelBounds;
}

export const SVGEditor = ({
  svgContent,
  cutbedSize: defaultCutbedSize,
  scaling,
  laserPosition,
  laserActive,
  showLaser,
  modelOffset,
  modelScale,
  onSVGParsed,
  onUploadClick,
  onLaserPositionChange,
  onModelOffsetChange,
  onModelScaleChange,
  onModelLayoutChange,
}: SVGEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const laserOverlayRef = useRef<SVGSVGElement>(null);
  const contentPlacementRef = useRef<ContentPlacement | null>(null);
  const modelDragStartRef = useRef<{
    pointer: { x: number; y: number };
    offset: { x: number; y: number };
  } | null>(null);
  const modelResizeStartRef = useRef<{
    pointer: { x: number; y: number };
    offset: { x: number; y: number };
    scale: number;
    bounds: ModelBounds;
  } | null>(null);
  const previousModelScaleRef = useRef(modelScale);
  const [isDraggingLaser, setIsDraggingLaser] = useState(false);
  const [isDraggingModel, setIsDraggingModel] = useState(false);
  const [isResizingModel, setIsResizingModel] = useState(false);
  const [previewAspectRatio, setPreviewAspectRatio] = useState(defaultCutbedSize.width / defaultCutbedSize.height);
  const [modelBounds, setModelBounds] = useState<ModelBounds | null>(null);
  const cutbedSize = defaultCutbedSize;

  const getClampedModelScale = (scale: number, placement = contentPlacementRef.current) => {
    return Math.max(scale, 0.05);
  };

  const getModelBounds = (
    offset: { x: number; y: number },
    scale: number,
    placement = contentPlacementRef.current,
  ): ModelBounds | null => {
    if (!placement) return null;

    return {
      x: placement.baseBounds.x + offset.x,
      y: placement.baseBounds.y + offset.y,
      width: placement.baseBounds.width * scale,
      height: placement.baseBounds.height * scale,
    };
  };

  const getOffsetFromModelPosition = (
    position: { x: number; y: number },
    scale: number,
    placement = contentPlacementRef.current,
  ) => {
    if (!placement) return position;

    return {
      x: position.x - placement.baseBounds.x,
      y: cutbedSize.height - position.y - placement.baseBounds.height * scale - placement.baseBounds.y,
    };
  };

  const getModelPositionFromOffset = (
    offset: { x: number; y: number },
    scale: number,
    placement = contentPlacementRef.current,
  ) => {
    if (!placement) return offset;

    return {
      x: roundMillimeters(placement.baseBounds.x + offset.x),
      y: roundMillimeters(cutbedSize.height - (placement.baseBounds.y + offset.y) - placement.baseBounds.height * scale),
    };
  };

  const getClampedModelOffset = (
    offset: { x: number; y: number },
    scale = modelScale,
    bounds = contentPlacementRef.current?.baseBounds,
  ) => {
    if (!bounds) return offset;
    const clampedScale = getClampedModelScale(scale);
    const scaledWidth = bounds.width * clampedScale;
    const scaledHeight = bounds.height * clampedScale;

    return {
      x: clampRange(offset.x, -bounds.x, cutbedSize.width - bounds.x - scaledWidth),
      y: clampRange(offset.y, -bounds.y, cutbedSize.height - bounds.y - scaledHeight),
    };
  };

  const getOffsetForScaleAroundCenter = ({
    offset,
    previousScale,
    nextScale,
    placement,
  }: {
    offset: { x: number; y: number };
    previousScale: number;
    nextScale: number;
    placement: ContentPlacement;
  }) => {
    const centerX = placement.baseBounds.x + offset.x + (placement.baseBounds.width * previousScale) / 2;
    const centerY = placement.baseBounds.y + offset.y + (placement.baseBounds.height * previousScale) / 2;

    return {
      x: centerX - placement.baseBounds.x - (placement.baseBounds.width * nextScale) / 2,
      y: centerY - placement.baseBounds.y - (placement.baseBounds.height * nextScale) / 2,
    };
  };

  const applyModelTransform = (offset: { x: number; y: number }, scale: number) => {
    const svgElement = containerRef.current?.querySelector("svg");
    const contentGroup = svgElement?.querySelector("[data-svg-content-root]");
    const placement = contentPlacementRef.current;

    if (!(contentGroup instanceof SVGGElement) || !placement) return;

    const clampedScale = getClampedModelScale(scale, placement);
    const clampedOffset = getClampedModelOffset(offset, clampedScale, placement.baseBounds);
    const finalScale = placement.scale * clampedScale;
    const translateX =
      placement.cutbedFrameX +
      (placement.baseBounds.x + clampedOffset.x) * placement.unitsPerMillimeter -
      placement.sourceBounds.x * finalScale;
    const translateY =
      placement.cutbedFrameY +
      (placement.baseBounds.y + clampedOffset.y) * placement.unitsPerMillimeter -
      placement.sourceBounds.y * finalScale;

    contentGroup.setAttribute(
      "transform",
      `translate(${translateX} ${translateY}) scale(${finalScale})`,
    );
  };

  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = svgContent;
    previousModelScaleRef.current = modelScale;

    // Parse SVG elements and extract data attributes
    const svgElement = containerRef.current.querySelector("svg");
    if (!svgElement) return;
    onModelLayoutChange?.(null);

    const selectedUnitsPerMillimeter = scaling === "illustrator" ? ILLUSTRATOR_UNITS_PER_MM : 1;

    setPreviewAspectRatio(cutbedSize.width / cutbedSize.height);
    svgElement.setAttribute(
      "viewBox",
      `0 0 ${cutbedSize.width} ${cutbedSize.height}`,
    );

    const existingContentGroup = svgElement.querySelector("[data-svg-content-root]");
    if (!existingContentGroup) {
      const contentGroup = document.createElementNS(SVG_NS, "g");
      contentGroup.setAttribute("data-svg-content-root", "true");

      const childNodes = Array.from(svgElement.childNodes);
      childNodes.forEach((childNode) => {
        if (childNode instanceof SVGElement && childNode.hasAttribute("data-cutbed-frame")) {
          return;
        }
        contentGroup.appendChild(childNode);
      });

      svgElement.appendChild(contentGroup);
    }

    const contentGroup = svgElement.querySelector("[data-svg-content-root]");
    if (contentGroup instanceof SVGGElement) {
      contentGroup.removeAttribute("transform");
      contentPlacementRef.current = null;
      setModelBounds(null);

      try {
        const contentBounds = contentGroup.getBBox();
        if (contentBounds.width > 0 && contentBounds.height > 0) {
          const scale = 1 / selectedUnitsPerMillimeter;
          const translateX =
            (cutbedSize.width - contentBounds.width * scale) / 2 - contentBounds.x * scale;
          const translateY =
            (cutbedSize.height - contentBounds.height * scale) / 2 - contentBounds.y * scale;

          const baseBounds = {
            x: translateX + contentBounds.x * scale,
            y: translateY + contentBounds.y * scale,
            width: contentBounds.width * scale,
            height: contentBounds.height * scale,
          };

          contentPlacementRef.current = {
            translateX,
            translateY,
            scale,
            unitsPerMillimeter: 1,
            cutbedFrameX: 0,
            cutbedFrameY: 0,
            sourceBounds: {
              x: contentBounds.x,
              y: contentBounds.y,
              width: contentBounds.width,
              height: contentBounds.height,
            },
            baseBounds,
          };
          onModelLayoutChange?.({
            baseWidth: baseBounds.width,
            baseHeight: baseBounds.height,
            cutbedWidth: cutbedSize.width,
            cutbedHeight: cutbedSize.height,
          });
          const clampedScale = getClampedModelScale(modelScale, contentPlacementRef.current);
          const positionOffset = getOffsetFromModelPosition(modelOffset, clampedScale, contentPlacementRef.current);
          const clampedOffset = getClampedModelOffset(positionOffset, clampedScale, baseBounds);
          setModelBounds(getModelBounds(clampedOffset, clampedScale, contentPlacementRef.current));
          applyModelTransform(clampedOffset, clampedScale);
        }
      } catch {
        // Keep the original placement if the browser cannot resolve SVG bounds.
      }
    }

    const existingFrame = svgElement.querySelector("[data-cutbed-frame]");
    existingFrame?.remove();

    const frameElement = document.createElementNS(SVG_NS, "rect");
    frameElement.setAttribute("data-cutbed-frame", "true");
    frameElement.setAttribute("x", "0");
    frameElement.setAttribute("y", "0");
    frameElement.setAttribute("width", `${cutbedSize.width}`);
    frameElement.setAttribute("height", `${cutbedSize.height}`);
    frameElement.setAttribute("fill", "none");
    frameElement.setAttribute("stroke", "#000");
    frameElement.setAttribute("stroke-width", "2.5");
    frameElement.setAttribute("vector-effect", "non-scaling-stroke");
    frameElement.setAttribute("pointer-events", "none");
    svgElement.append(frameElement);

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

    onSVGParsed?.(paths);

    // Make SVG responsive
    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "100%");
    svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svgElement.style.maxWidth = "100%";
    svgElement.style.maxHeight = "100%";
  }, [svgContent, defaultCutbedSize.height, defaultCutbedSize.width, onModelLayoutChange, onSVGParsed, scaling]);

  useEffect(() => {
    const placement = contentPlacementRef.current;
    if (!placement) return;

    const clampedScale = getClampedModelScale(modelScale, placement);
    const previousScale = previousModelScaleRef.current;
    const currentOffset = getOffsetFromModelPosition(modelOffset, previousScale, placement);
    const offsetForScale =
      Math.abs(clampedScale - previousScale) > 0.001 && !isResizingModel
        ? getOffsetForScaleAroundCenter({
            offset: currentOffset,
            previousScale,
            nextScale: clampedScale,
            placement,
          })
        : getOffsetFromModelPosition(modelOffset, clampedScale, placement);
    const clampedOffset = getClampedModelOffset(offsetForScale, clampedScale, placement.baseBounds);
    const clampedPosition = getModelPositionFromOffset(clampedOffset, clampedScale, placement);
    applyModelTransform(clampedOffset, clampedScale);
    setModelBounds(getModelBounds(clampedOffset, clampedScale, placement));
    previousModelScaleRef.current = clampedScale;

    if (Math.abs(clampedScale - modelScale) > 0.001) {
      onModelScaleChange?.(clampedScale);
    }
    if (
      Math.abs(clampedPosition.x - modelOffset.x) > 0.001 ||
      Math.abs(clampedPosition.y - modelOffset.y) > 0.001
    ) {
      onModelOffsetChange?.(clampedPosition);
    }
  }, [modelOffset.x, modelOffset.y, modelScale, cutbedSize.height, cutbedSize.width]);

  const getLaserPositionFromPointer = (event: React.PointerEvent<SVGSVGElement>): LaserPosition | null => {
    const overlay = laserOverlayRef.current;
    if (!overlay) return null;

    const point = overlay.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    const screenMatrix = overlay.getScreenCTM();
    if (!screenMatrix) return null;

    const svgPoint = point.matrixTransform(screenMatrix.inverse());
    return {
      x: clamp(svgPoint.x, 0, cutbedSize.width),
      y: clamp(svgPoint.y, 0, cutbedSize.height),
      angle: 0,
    };
  };

  const updateLaserPositionFromPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const nextPosition = getLaserPositionFromPointer(event);
    if (nextPosition) {
      onLaserPositionChange?.(nextPosition);
    }
  };

  const handleLaserPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!(event.target instanceof SVGElement) || !event.target.closest("[data-laser-head]")) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingLaser(true);
    updateLaserPositionFromPointer(event);
  };

  const handleLaserPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingLaser) {
      updateLaserPositionFromPointer(event);
    }
  };

  const handleLaserPointerEnd = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDraggingLaser(false);
  };

  const handleModelPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!(event.target instanceof SVGElement) || !event.target.closest("[data-model-drag-handle]")) {
      return;
    }

    const pointer = getLaserPositionFromPointer(event);
    if (!pointer) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    modelDragStartRef.current = {
      pointer,
      offset: getOffsetFromModelPosition(modelOffset, modelScale),
    };
    setIsDraggingModel(true);
  };

  const handleModelPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingModel || !modelDragStartRef.current) return;

    const pointer = getLaserPositionFromPointer(event);
    if (!pointer) return;

    const nextOffset = getClampedModelOffset({
      x: roundMillimeters(modelDragStartRef.current.offset.x + pointer.x - modelDragStartRef.current.pointer.x),
      y: roundMillimeters(modelDragStartRef.current.offset.y + pointer.y - modelDragStartRef.current.pointer.y),
    });

    onModelOffsetChange?.(getModelPositionFromOffset(nextOffset, modelScale));
  };

  const handleModelPointerEnd = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    modelDragStartRef.current = null;
    setIsDraggingModel(false);
  };

  const handleModelResizePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!(event.target instanceof SVGElement) || !event.target.closest("[data-model-resize-handle]")) {
      return;
    }

    const pointer = getLaserPositionFromPointer(event);
    if (!pointer || !modelBounds) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    modelResizeStartRef.current = {
      pointer,
      offset: getOffsetFromModelPosition(modelOffset, modelScale),
      scale: getClampedModelScale(modelScale),
      bounds: modelBounds,
    };
    setIsResizingModel(true);
  };

  const handleModelResizePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const placement = contentPlacementRef.current;
    if (!isResizingModel || !modelResizeStartRef.current || !placement) return;

    const pointer = getLaserPositionFromPointer(event);
    if (!pointer) return;

    const nextWidth = modelResizeStartRef.current.bounds.width + pointer.x - modelResizeStartRef.current.pointer.x;
    const nextHeight = modelResizeStartRef.current.bounds.height + pointer.y - modelResizeStartRef.current.pointer.y;
    const nextScale = getClampedModelScale(
      Math.round(
        Math.max(
          nextWidth / placement.baseBounds.width,
          nextHeight / placement.baseBounds.height,
          0.05,
        ) * 100,
      ) / 100,
      placement,
    );
    const nextOffset = getClampedModelOffset(modelResizeStartRef.current.offset, nextScale, placement.baseBounds);

    onModelScaleChange?.(nextScale);
    onModelOffsetChange?.(getModelPositionFromOffset(nextOffset, nextScale, placement));
  };

  const handleModelResizePointerEnd = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    modelResizeStartRef.current = null;
    setIsResizingModel(false);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/30 border-2 border-dashed border-border overflow-hidden">
      {svgContent ? (
        <div className="flex h-full w-full items-start justify-center p-2">
          <div className="flex w-full max-w-5xl flex-col gap-1">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span>Laser Cutbed</span>
              <span>{cutbedSize.width} x {cutbedSize.height} mm</span>
            </div>
            <div
              className="relative w-full overflow-hidden bg-background shadow-sm"
              style={{ aspectRatio: `${previewAspectRatio}` }}
            >
              <div
                ref={containerRef}
                className="relative z-10 flex h-full w-full items-center justify-center"
              />
              <svg
                ref={laserOverlayRef}
                viewBox={`0 0 ${cutbedSize.width} ${cutbedSize.height}`}
                preserveAspectRatio="xMidYMid meet"
                className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
                aria-label="Laser head position"
                onPointerDown={(event) => {
                  handleModelResizePointerDown(event);
                  handleLaserPointerDown(event);
                  handleModelPointerDown(event);
                }}
                onPointerMove={(event) => {
                  handleLaserPointerMove(event);
                  handleModelPointerMove(event);
                  handleModelResizePointerMove(event);
                }}
                onPointerUp={(event) => {
                  handleLaserPointerEnd(event);
                  handleModelPointerEnd(event);
                  handleModelResizePointerEnd(event);
                }}
                onPointerCancel={(event) => {
                  handleLaserPointerEnd(event);
                  handleModelPointerEnd(event);
                  handleModelResizePointerEnd(event);
                }}
                onLostPointerCapture={() => {
                  setIsDraggingLaser(false);
                  setIsDraggingModel(false);
                  setIsResizingModel(false);
                  modelDragStartRef.current = null;
                  modelResizeStartRef.current = null;
                }}
              >
                {modelBounds && (
                  <>
                    <rect
                      data-model-drag-handle="true"
                      x={modelBounds.x}
                      y={modelBounds.y}
                      width={modelBounds.width}
                      height={modelBounds.height}
                      fill="transparent"
                      pointerEvents="all"
                      className="pointer-events-auto cursor-move touch-none"
                    />
                    <rect
                      x={modelBounds.x}
                      y={modelBounds.y}
                      width={modelBounds.width}
                      height={modelBounds.height}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="none"
                    />
                    <rect
                      data-model-resize-handle="true"
                      x={modelBounds.x + modelBounds.width - 2.5}
                      y={modelBounds.y + modelBounds.height - 2.5}
                      width="5"
                      height="5"
                      rx="1"
                      fill="hsl(var(--primary))"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="all"
                      className="pointer-events-auto cursor-nwse-resize touch-none"
                    />
                  </>
                )}
                {showLaser && (
                  <g
                    data-laser-head="true"
                    transform={`translate(${clamp(laserPosition.x, 0, cutbedSize.width)} ${clamp(laserPosition.y, 0, cutbedSize.height)}) rotate(0)`}
                    className="pointer-events-auto cursor-grab touch-none active:cursor-grabbing"
                  >
                    <circle
                      r="6"
                      fill={laserActive ? "rgba(239, 68, 68, 0.25)" : "hsl(var(--background))"}
                      stroke="hsl(var(--destructive))"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d="M -11 0 H 11 M 0 -11 V 11"
                      fill="none"
                      stroke="hsl(var(--destructive))"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle r="13" fill="transparent" />
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>
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

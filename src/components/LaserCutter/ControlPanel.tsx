import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CuttingParameters, LaserPosition, MaterialOption, ModelLayout } from "@/types/svg";
import { Switch } from "@/components/ui/switch";
import { Play, Scan, Square } from "lucide-react";

interface ControlPanelProps {
  parameters: CuttingParameters;
  laserPosition: LaserPosition;
  showLaser: boolean;
  modelLayout: ModelLayout | null;
  onParametersChange: (params: CuttingParameters) => void;
  onLaserPositionChange: (position: LaserPosition) => void;
  onShowLaserChange: (showLaser: boolean) => void;
  onTraceOutline: () => void;
  onGenerateGCode: () => void;
  onStartCutting: () => void;
  onAbortCut: () => void;
  disabled?: boolean;
}

const materials: MaterialOption[] = [{ id: "wood", name: "Wood" }];

const numberInputProps = {
  onKeyDown: (e: React.KeyboardEvent) => {
    if (["e", "E", "+", "-", ","].includes(e.key)) e.preventDefault();
  },
};

const formatWholeNumber = (value: number) => `${Number.isFinite(value) ? Math.round(value) : 0}`;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const ControlPanel = ({
  parameters,
  laserPosition,
  showLaser,
  modelLayout,
  onParametersChange,
  onLaserPositionChange,
  onShowLaserChange,
  onTraceOutline,
  onGenerateGCode,
  onStartCutting,
  onAbortCut,
  disabled = false,
}: ControlPanelProps) => {
  const [editingModelSizeField, setEditingModelSizeField] = useState<"width" | "height" | "scale" | null>(null);
  const [modelWidthInput, setModelWidthInput] = useState(
    formatWholeNumber((modelLayout?.baseWidth || 0) * (parameters.model_scale || 1)),
  );
  const [modelHeightInput, setModelHeightInput] = useState(
    formatWholeNumber((modelLayout?.baseHeight || 0) * (parameters.model_scale || 1)),
  );
  const [modelScaleInput, setModelScaleInput] = useState(
    `${Math.round((parameters.model_scale || 1) * 100)}`,
  );

  useEffect(() => {
    if (!editingModelSizeField) {
      setModelWidthInput(formatWholeNumber((modelLayout?.baseWidth || 0) * (parameters.model_scale || 1)));
      setModelHeightInput(formatWholeNumber((modelLayout?.baseHeight || 0) * (parameters.model_scale || 1)));
      setModelScaleInput(`${Math.round((parameters.model_scale || 1) * 100)}`);
    }
  }, [editingModelSizeField, modelLayout?.baseHeight, modelLayout?.baseWidth, parameters.model_scale]);

  const applyModelScale = (scale: number, editingField: "width" | "height" | "scale" | null = null) => {
    const nextScale = Math.max(scale, 0.05);

    if (editingField !== "width") {
      setModelWidthInput(formatWholeNumber((modelLayout?.baseWidth || 0) * nextScale));
    }
    if (editingField !== "height") {
      setModelHeightInput(formatWholeNumber((modelLayout?.baseHeight || 0) * nextScale));
    }
    if (editingField !== "scale") {
      setModelScaleInput(`${Math.round(nextScale * 100)}`);
    }
    onParametersChange({
      ...parameters,
      model_scale: nextScale,
    });
  };

  const commitModelSizeInput = (field: "width" | "height" | "scale", value: string) => {
    const parsedValue = parseFloat(value.replace(',', '.'));

    if (!Number.isFinite(parsedValue)) {
      applyModelScale(parameters.model_scale || 1);
      return;
    }

    if (field === "width" && modelLayout?.baseWidth) {
      applyModelScale(parsedValue / modelLayout.baseWidth);
      return;
    }

    if (field === "height" && modelLayout?.baseHeight) {
      applyModelScale(parsedValue / modelLayout.baseHeight);
      return;
    }

    applyModelScale(parsedValue / 100);
  };

  const preventNumberExponent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === ',') {
      e.preventDefault();
    }
  };

  const update = (patch: Partial<CuttingParameters>) =>
    onParametersChange({ ...parameters, ...patch });

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader>
        <CardTitle>Cutting Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Select
            value={parameters.material}
            onValueChange={(value) => update({ material: value })}
            disabled={disabled}
          >
            <SelectTrigger id="material">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scaling">SVG Scaling</Label>
          <Input
            id="dpi"
            type="number"
            min="0"
            value={parameters.dpi}
            autoComplete="off"
            {...numberInputProps}
            onChange={(e) => {
              const v = parseFloat(e.target.value.replace(",", "."));
              update({ dpi: isNaN(v) ? 0 : v});
            }}
            disabled={disabled}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="model_position">Model Position (mm)</Label>
            <div className="grid grid-cols-2 gap-2" id="model_position">
              <div>
                <Label htmlFor="x_offset">x</Label>
                <Input
                  id="x_offset"
                  type="number"
                  step="1"
                  value={formatWholeNumber(parameters.x_offset)}
                  autoComplete="off"
                  onKeyDown={preventNumberExponent}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value.replace(',', '.'));
                    onParametersChange({
                      ...parameters,
                      x_offset: isNaN(value) ? 0 : Math.round(value),
                    });
                  }}
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="y_offset">y</Label>
                <Input
                  id="y_offset"
                  type="number"
                  step="1"
                  value={formatWholeNumber(parameters.y_offset)}
                  autoComplete="off"
                  onKeyDown={preventNumberExponent}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value.replace(',', '.'));
                    onParametersChange({
                      ...parameters,
                      y_offset: isNaN(value) ? 0 : Math.round(value),
                    });
                  }}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model_size">Model Size (mm)</Label>
            <div className="grid grid-cols-2 gap-2" id="model_size">
              <div>
                <Label htmlFor="model_width">width</Label>
                <Input
                  id="model_width"
                  type="number"
                  min="0"
                  step="1"
                  value={modelWidthInput}
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === ',') {
                      e.preventDefault();
                    }
                    if (e.key === 'Enter') {
                      commitModelSizeInput("width", e.currentTarget.value);
                      e.currentTarget.blur();
                    }
                  }}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    const parsedValue = parseFloat(nextValue.replace(',', '.'));

                    setModelWidthInput(nextValue);
                    if (Number.isFinite(parsedValue) && parsedValue > 0 && modelLayout?.baseWidth) {
                      applyModelScale(parsedValue / modelLayout.baseWidth, "width");
                    }
                  }}
                  onFocus={() => setEditingModelSizeField("width")}
                  onBlur={(e) => {
                    setEditingModelSizeField(null);
                    commitModelSizeInput("width", e.target.value);
                  }}
                  disabled={disabled || !modelLayout}
                />
              </div>
              <div>
                <Label htmlFor="model_height">height</Label>
                <Input
                  id="model_height"
                  type="number"
                  min="0"
                  step="1"
                  value={modelHeightInput}
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === ',') {
                      e.preventDefault();
                    }
                    if (e.key === 'Enter') {
                      commitModelSizeInput("height", e.currentTarget.value);
                      e.currentTarget.blur();
                    }
                  }}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    const parsedValue = parseFloat(nextValue.replace(',', '.'));

                    setModelHeightInput(nextValue);
                    if (Number.isFinite(parsedValue) && parsedValue > 0 && modelLayout?.baseHeight) {
                      applyModelScale(parsedValue / modelLayout.baseHeight, "height");
                    }
                  }}
                  onFocus={() => setEditingModelSizeField("height")}
                  onBlur={(e) => {
                    setEditingModelSizeField(null);
                    commitModelSizeInput("height", e.target.value);
                  }}
                  disabled={disabled || !modelLayout}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="model_scale">Scale (%)</Label>
            <Input
              id="model_scale"
              type="number"
              min="5"
              step="1"
              value={modelScaleInput}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === ',') {
                  e.preventDefault();
                }
                if (e.key === 'Enter') {
                  commitModelSizeInput("scale", e.currentTarget.value);
                  e.currentTarget.blur();
                }
              }}
              onChange={(e) => {
                const nextValue = e.target.value;
                const parsedValue = parseFloat(nextValue.replace(',', '.'));

                setModelScaleInput(nextValue);
                if (Number.isFinite(parsedValue) && parsedValue >= 5) {
                  applyModelScale(parsedValue / 100, "scale");
                }
              }}
              onFocus={() => setEditingModelSizeField("scale")}
              onBlur={(e) => {
                setEditingModelSizeField(null);
                commitModelSizeInput("scale", e.target.value);
              }}
              disabled={disabled || !modelLayout}
            />
          </div>
          <div className="flex justify-start">
            <Button
              type="button"
              variant="outline"
              disabled={disabled || !modelLayout || modelLayout.baseWidth <= 0 || modelLayout.baseHeight <= 0}
              onClick={() => {
                if (!modelLayout) return;

                const fitScale = Math.min(
                  modelLayout.cutbedWidth / modelLayout.baseWidth,
                  modelLayout.cutbedHeight / modelLayout.baseHeight,
                );
                const scalePercent = Math.max(Math.floor(fitScale * 1000) / 10, 5);
                const nextScale = scalePercent / 100;
                const currentWidth = modelLayout.baseWidth * (parameters.model_scale || 1);
                const currentHeight = modelLayout.baseHeight * (parameters.model_scale || 1);
                const nextWidth = modelLayout.baseWidth * nextScale;
                const nextHeight = modelLayout.baseHeight * nextScale;
                const currentCenterX = parameters.x_offset + currentWidth / 2;
                const currentCenterY = parameters.y_offset + currentHeight / 2;
                const nextX = clamp(
                  Math.round(currentCenterX - nextWidth / 2),
                  0,
                  Math.max(modelLayout.cutbedWidth - nextWidth, 0),
                );
                const nextY = clamp(
                  Math.round(currentCenterY - nextHeight / 2),
                  0,
                  Math.max(modelLayout.cutbedHeight - nextHeight, 0),
                );

                setModelWidthInput(formatWholeNumber(nextWidth));
                setModelHeightInput(formatWholeNumber(nextHeight));
                setModelScaleInput(`${scalePercent}`);
                onParametersChange({
                  ...parameters,
                  model_scale: nextScale,
                  x_offset: nextX,
                  y_offset: nextY,
                });
              }}
            >
              Fit to Cutbed
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="thickness">Material Thickness (mm)</Label>
          <Input
            id="thickness"
            type="number"
            min="0"
            step="0.1"
            value={parameters.material_thickness}
            autoComplete="off"
            {...numberInputProps}
            onChange={(e) => {
              const v = parseFloat(e.target.value.replace(",", "."));
              update({ material_thickness: isNaN(v) ? 0 : v });
            }}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="speed">Laser Speed (mm/s)</Label>
          <Input
            id="speed"
            type="number"
            min="0"
            max="100"
            step="1"
            value={parameters.cut_speed}
            {...numberInputProps}
            onChange={(e) => {
              const v = parseFloat(e.target.value.replace(",", "."));
              update({ cut_speed: isNaN(v) ? 0 : Math.min(Math.max(v, 0), 100) });
            }}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="laser_position">Laser Position (mm)</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="show_laser"
                checked={showLaser}
                onCheckedChange={(checked) => onShowLaserChange(checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="show_laser">Show Laser</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2" id="laser_position">
            <div>
              <Label htmlFor="laser_x">x</Label>
              <Input
                id="laser_x"
                type="number"
                  min="0"
                  step="1"
                  value={formatWholeNumber(laserPosition.x)}
                autoComplete="off"
                onKeyDown={preventNumberExponent}
                onChange={(e) => {
                  const value = parseFloat(e.target.value.replace(',', '.'));
                  onLaserPositionChange({
                    ...laserPosition,
                    x: isNaN(value) ? 0 : Math.round(value),
                    angle: 0,
                  });
                }}
                disabled={disabled || !showLaser}
              />
            </div>
            <div>
              <Label htmlFor="laser_y">y</Label>
              <Input
                id="laser_y"
                type="number"
                  min="0"
                  step="1"
                  value={formatWholeNumber(laserPosition.y)}
                autoComplete="off"
                onKeyDown={preventNumberExponent}
                onChange={(e) => {
                  const value = parseFloat(e.target.value.replace(',', '.'));
                  onLaserPositionChange({
                    ...laserPosition,
                    y: isNaN(value) ? 0 : Math.round(value),
                    angle: 0,
                  });
                }}
                disabled={disabled || !showLaser}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <Label htmlFor="laser-active">Laser Active</Label>
          <Switch
            id="laser-active"
            checked={!parameters.laser_off}
            onCheckedChange={(checked) => update({ laser_off: !checked })}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <Label htmlFor="optimize-cuts">Optimize cuts</Label>
          <Switch
            id="optimize-cuts"
            checked={parameters.optimize}
            onCheckedChange={(checked) => update({ optimize: checked })}
            disabled={disabled}
          />
        </div>

        <div className="pt-4 space-y-3">
          <Button onClick={onGenerateGCode} disabled={disabled} className="w-full" variant="outline">
            Generate G-Code
          </Button>
          <Button onClick={onTraceOutline} disabled={disabled} className="w-full" variant="outline">
            <Scan className="mr-2 h-4 w-4" />
            Trace Outline
          </Button>
          <Button
            onClick={onStartCutting}
            disabled={disabled}
            className="w-full bg-gray-500 text-white hover:bg-gray-400"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Cutting
          </Button>
          <Button
            onClick={onAbortCut}
            disabled={disabled}
            variant="destructive"
            className="w-full"
          >
            <Square className="mr-2 h-4 w-4" />
            Abort Cut
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
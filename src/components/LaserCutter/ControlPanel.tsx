import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CuttingParameters, MaterialOption, ScalingOption } from "@/types/svg";
import { Play, Scan } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ControlPanelProps {
  parameters: CuttingParameters;
  onParametersChange: (params: CuttingParameters) => void;
  onTraceOutline: () => void;
  onStartCutting: () => void;
  disabled?: boolean;
}

const materials: MaterialOption[] = [
  { id: "wood", name: "Wood" },
];
const scalings: ScalingOption[] = [
  { id: "mm", name: "Millimeter" },
  { id: "illustrator", name: "Adobe Illustrator" },
];

export const ControlPanel = ({
  parameters,
  onParametersChange,
  onTraceOutline,
  onStartCutting,
  disabled = false,
}: ControlPanelProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Cutting Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Select
            value={parameters.material}
            onValueChange={(value) =>
              onParametersChange({ ...parameters, material: value })
            }
            disabled={disabled}
          >
            <SelectTrigger id="material">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((material) => (
                <SelectItem key={material.id} value={material.id}>
                  {material.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scaling">SVG Scaling</Label>
          <Select
            value={parameters.scaling}
            onValueChange={(value) =>
              onParametersChange({ ...parameters, scaling: value })
            }
            disabled={disabled}
          >
            <SelectTrigger id="scaling">
              <SelectValue placeholder="Select scaling" />
            </SelectTrigger>
            <SelectContent>
              {scalings.map((scaling) => (
                <SelectItem key={scaling.id} value={scaling.id}>
                  {scaling.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="svg_offset">Model Offset (mm)</Label>
          <div className="flex w-full gap-2" id="svg_offset">
            <div>
              <Label htmlFor="x_offset">x offset</Label>
              <Input
                id="x_offset"
                type="number"
                min="0"
                step="1"
                value={parameters.x_offset || 0}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const value = parseFloat(e.target.value.replace(',', '.'));
                  onParametersChange({
                    ...parameters,
                    x_offset: isNaN(value) ? 0 : value,
                  });
                }}
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="y_offset" className="text-center w-full">y offset</Label>
              <Input
                id="y_offset"
                type="number"
                min="0"
                step="1"
                value={parameters.y_offset || 0}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const value = parseFloat(e.target.value.replace(',', '.'));
                  onParametersChange({
                    ...parameters,
                    y_offset: isNaN(value) ? 0 : value,
                  });
                }}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="thickness">Thickness (mm)</Label>
          <Input
            id="thickness"
            type="number"
            min="0"
            step="0.1"
            value={parameters.material_thickness || ""}
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              const value = parseFloat(e.target.value.replace(',', '.'));
              onParametersChange({
                ...parameters,
                material_thickness: isNaN(value) ? 0 : value,
              });
            }}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="speed">Speed (mm/s)</Label>
          <Input
            id="speed"
            type="number"
            min="0"
            max="100"
            step="1"
            value={parameters.cut_speed || ""}
            onKeyDown={(e) => {
              if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              const clampedValue = isNaN(value) ? 0 : Math.min(Math.max(value, 0), 100);
              onParametersChange({
                ...parameters,
                cut_speed: clampedValue,
              });
            }}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <Label htmlFor="laser-active">Laser Active</Label>
          <Switch
            id="laser-active"
            defaultChecked
            onCheckedChange={(e) => {
              onParametersChange({
                ...parameters,
                laser_off: !e
              });
            }}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <Label htmlFor="optimize-cuts">Optimize cuts</Label>
          <Switch
            id="optimize-cuts"
            defaultChecked
            onCheckedChange={(e) => {
              onParametersChange({
                ...parameters,
                optimize: e
              });
            }}
            disabled={disabled}
          />
        </div>

        <div className="pt-4 space-y-3">
          <Button
            onClick={onTraceOutline}
            disabled={disabled}
            className="w-full"
            variant="outline"
          >
            <Scan className="mr-2 h-4 w-4" />
            Trace Outline
          </Button>

          <Button
            onClick={onStartCutting}
            disabled={disabled}
            className="w-full bg-gray-500 text-white hover:bg-gray-400 disabled:bg-gray-500 disabled:text-white disabled:opacity-100"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Cutting
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

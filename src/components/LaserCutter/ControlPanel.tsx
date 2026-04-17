import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CuttingParameters, MaterialOption } from "@/types/svg";
import { Play, Scan, Square } from "lucide-react";

interface ControlPanelProps {
  parameters: CuttingParameters;
  onParametersChange: (params: CuttingParameters) => void;
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

export const ControlPanel = ({
  parameters,
  onParametersChange,
  onTraceOutline,
  onGenerateGCode,
  onStartCutting,
  onAbortCut,
  disabled = false,
}: ControlPanelProps) => {
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

        <div className="space-y-2">
          <Label>Model Offset (mm)</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="x_offset">X offset</Label>
              <Input
                id="x_offset"
                type="number"
                min="0"
                step="1"
                value={parameters.x_offset}
                autoComplete="off"
                {...numberInputProps}
                onChange={(e) => {
                  const v = parseFloat(e.target.value.replace(",", "."));
                  update({ x_offset: isNaN(v) ? 0 : v });
                }}
                disabled={disabled}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="y_offset">Y offset</Label>
              <Input
                id="y_offset"
                type="number"
                min="0"
                step="1"
                value={parameters.y_offset}
                autoComplete="off"
                {...numberInputProps}
                onChange={(e) => {
                  const v = parseFloat(e.target.value.replace(",", "."));
                  update({ y_offset: isNaN(v) ? 0 : v });
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
          <Label htmlFor="speed">Speed (mm/s)</Label>
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
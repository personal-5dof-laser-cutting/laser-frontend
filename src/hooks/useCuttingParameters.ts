import { useState } from "react";
import { CuttingParameters } from "@/types/svg";

const DEFAULT_PARAMETERS: CuttingParameters = {
    material: "wood",
    material_thickness: 3,
    cut_speed: 5,
    laser_off: false,
    optimize: false,
    svg: null,
    dpi: 72,
    x_offset: 0,
    y_offset: 0,
    model_scale: 1,
};

export function useCuttingParameters() {
    const [parameters, setParameters] = useState<CuttingParameters>(DEFAULT_PARAMETERS)

    const setSvg = (svg: string | null) =>
        setParameters((prev) => ({...prev, svg}));

    const setModelOffset = (offset: { x: number, y: number }) =>
        setParameters((prev) => ({ ...prev, x_offset: offset.x, y_offset: offset.y}));

    const setModelScale = (scale: number) =>
        setParameters((prev) => ({ ...prev, model_scale: scale}));

    const resetForNewFile = () =>
        setParameters((prev) => ({
            ...prev,
            svg: null,
            x_offset: 0,
            y_offset: 0,
            model_scale: 1
        }));

    return { parameters, setParameters, setSvg, setModelOffset, setModelScale, resetForNewFile };
}
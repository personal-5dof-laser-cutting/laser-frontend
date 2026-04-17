import { useState } from "react";
import { CuttingParameters } from "@/types/svg";

const DEFAULT_PARAMETERS: CuttingParameters = {
    material: "wood",
    material_thickness: 3,
    cut_speed: 5,
    laser_off: false,
    optimize: false,
    svg: null,
    scaling: "mm",
    x_offset: 0,
    y_offset: 0,
};

export function useCuttingParameters() {
    const [parameters, setParameters] = useState<CuttingParameters>(DEFAULT_PARAMETERS)

    const setSvg = (svg: string | null) =>
        setParameters((prev) => ({...prev, svg}));

    return { parameters, setParameters, setSvg };
}
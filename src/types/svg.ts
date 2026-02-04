export interface SVGPathData {
  rotation?: string;
  tilt?: string;
  depth?: string;
  element: SVGElement;
  stroke?: string;
  fill?: string;
}

export interface MaterialOption {
  id: string;
  name: string;
}

export interface ScalingOption {
  id: string;
  name: string;
}

export interface CuttingParameters {
  material: string;
  material_thickness: number;
  cut_speed: number;
  laserActive: boolean;
  optimizeCuts: boolean;
  svg_scaling: string;
}

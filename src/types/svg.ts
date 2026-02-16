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
  laser_off: boolean;
  optimize: boolean;
  svg: string | null;
  scaling: string;
  x_offset: number;
  y_offset: number;
}

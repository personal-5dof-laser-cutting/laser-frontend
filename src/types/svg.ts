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

export interface LaserPosition {
  x: number;
  y: number;
  angle: number;
}

export interface ModelLayout {
  baseWidth: number;
  baseHeight: number;
  cutbedWidth: number;
  cutbedHeight: number;
}

export interface CuttingParameters {
  material: string;
  material_thickness: number;
  cut_speed: number;
  laser_off: boolean;
  optimize: boolean;
  svg: string | null;
  dpi: number;
  x_offset: number;
  y_offset: number;
  model_scale: number;
}

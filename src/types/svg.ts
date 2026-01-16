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

export interface CuttingParameters {
  material: string;
  thickness: number;
  speed: number;
  power: number;
  laserActive: boolean;
}

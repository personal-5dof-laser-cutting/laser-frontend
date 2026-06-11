import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type AxisData = {
  homed: boolean;
  value: number | null;
  motor_enabled: boolean;
};

type AxisLabel = "x" | "y" | "z" | "a" | "b";
type AxesState = Record<AxisLabel, AxisData>;

type CutbedLabel = "width" | "depth" | "height";
type CutbedState = Record<CutbedLabel, number>;

interface CutterState {
  axes: AxesState;
  cutbed: CutbedState;
}

interface CutterActions {
  updateAxis: (axis: AxisLabel, updates: Partial<AxisData>) => void;
  setAxes: (axes: Partial<Record<AxisLabel, Partial<AxisData>>>) => void;
  updateCutbed: (dimension: CutbedLabel, value: number) => void;
  setCutbed: (cutbed: Partial<CutbedState>) => void;
}

type CutterStore = CutterState & CutterActions;

const INITIAL_STATE: CutterState = {
  axes: {
    x: { homed: false, value: null, motor_enabled: false },
    y: { homed: false, value: null, motor_enabled: false },
    z: { homed: false, value: null, motor_enabled: false },
    a: { homed: false, value: null, motor_enabled: false },
    b: { homed: false, value: null, motor_enabled: false },
  },
  cutbed: {
    width: 0,
    depth: 0,
    height: 0,
  },
};

export const useCutterStore = create<CutterStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...INITIAL_STATE,

        updateAxis: (axis, updates) =>
          set((state) => {
            Object.assign(state.axes[axis], updates);
          }),

        setAxes: (incomingAxes) =>
          set((state) => {
            for (const [axis, updates] of Object.entries(incomingAxes)) {
              if (updates) {
                Object.assign(state.axes[axis as AxisLabel], updates);
              }
            }
          }),

        updateCutbed: (dimension, value) =>
          set((state) => {
            state.cutbed[dimension] = value;
          }),

        setCutbed: (updates) =>
          set((state) => {
            Object.assign(state.cutbed, updates);
          }),
      })),
      {
        name: "LaserFrontend-Cutter-Storage",
      },
    ),
    {
      name: "LaserFrontend DevTools",
      enabled: true,
    },
  ),
);

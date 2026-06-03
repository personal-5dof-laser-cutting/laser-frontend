import { useState } from "react";
import { LaserPosition } from "@/types/svg";

const DEFAULT_POSITION: LaserPosition = {x: 0, y: 0, angle: 0};

export function useLaserPosition() {
    const [laserPosition, setLaserPosition] = useState<LaserPosition>(DEFAULT_POSITION);

    function updateFromWebSocket(content: string) {
        try {
            const nextPosition = JSON.parse(content) as Partial<LaserPosition>;
            setLaserPosition((current) => ({
                x: typeof nextPosition.x === "number" ? nextPosition.x : current.x,
                y: typeof nextPosition.y === "number" ? nextPosition.y : current.y,
                angle: 0,
            }));
        } catch (err) {
            console.error("Failed to parse laser position:", err);
        }
    }

    function updateFromEditor(position: LaserPosition) {
        setLaserPosition({ ...position, angle: 0 });
    }

    function resetLaserPosition() {
        setLaserPosition(DEFAULT_POSITION)
    }

    return { laserPosition, updateFromWebSocket, updateFromEditor, resetLaserPosition };
}
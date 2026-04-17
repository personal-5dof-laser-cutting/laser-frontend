import { useState } from "react";

interface ProgressState {
    visible: boolean;
    value: number;
    text: string;
}

export function useProgress() {
    const [progress, setProgress] = useState<ProgressState>({
        visible: false,
        value: 0,
        text: "",
    });

    const update = (message: string) => {
        const percentMatch = message.match(/(\d+(?:\.\d+)?)%/);
        if (percentMatch) {
            const percentage = parseFloat(percentMatch[1])
            if (percentage >= 100) {
                setTimeout(() => setProgress({ visible: false, value: 0, text: " "}), 2000);
            } else {
                setProgress({ visible: true, value: percentage, text: message})
            }
        } else {
            setProgress({ visible: true, value: 0, text: message})
        }
    };

    const reset = () => setProgress({ visible: false, value: 0, text: ""});

    return { progress, update, reset };
}
import { toast } from "sonner";
import { CuttingParameters } from "@/types/svg";

export function useGCodeExport() {
    const generateGCode = async (parameters: CuttingParameters) => {
        if (!parameters.svg) {
            toast.error("Please load an SVG file first");
            return;
        }
        toast.success("Generating G-Code...");
        try {
            const response = await fetch("http://127.0.0.1:8000/generate_gcode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parameters)
            });
            if (!response.ok) {
                const errorBody = await response.json();
                console.error("G-Code generation failed:", errorBody);
                toast.error(`Failed: ${response.statusText}`)
                return;
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "model.gcode";
            document.body.appendChild(link);
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error("Failed to generate G-Code");
            console.error(err)
        }
    };

    return { generateGCode }
}
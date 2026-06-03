import { toast } from "sonner";
import { CuttingParameters } from "@/types/svg";

export function useTraceOutline() {
    const traceOutline = async (parameters: CuttingParameters) => {
        if (!parameters.svg){
            toast.error("Please load an SVG file first");
            return;
        }
        toast.success("Starting trace outline...");
        try {
            const response = await fetch("http://127.0.0.1:8000/trace_outline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parameters),
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error("Failed to start cutting:", errorBody);
                toast.error(`Failed: ${response.statusText}`)
                return;
            }
            const result = await response.json();
            toast.success("Got outline")
            console.log(result)
        } catch (err) {
            toast.error("Failed to trace outline")
            console.log(err)
        }
    };

    return { traceOutline }
}
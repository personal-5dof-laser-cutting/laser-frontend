import { toast } from "sonner";
import { CuttingParameters, ResponseMessage } from "@/types/svg";

type EndpointResponse =
    | { success: true; http_response: Response }
    | { success: false; error: string }

async function postToEndpoint(URI: string, body: string): Promise<EndpointResponse> {
    try {
        const response = await fetch(URI, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body
        });
        if (!response.ok) {
            const errorMessage = await extractErrorMessage(response, response.status)
            return {success: false, error: errorMessage}
        }
        return { success: true, http_response: response}
    } catch (err) {
        return {success: false, error: "Cannot connect to backend. Please ensure the server is running"}
    }
}

async function extractErrorMessage(response: Response, statusCode: number): Promise<string> {
    const errorBody = await response.json()
    const code_validation_error = 442
    const code_internal_server_error = 500
    console.log(0);
    if (statusCode === code_validation_error && errorBody.detail && Array.isArray(errorBody.detail)) {
        const errors = errorBody.detail
            .map((err: any) => `${err.loc.join(".")}: ${err.msg}`)
            .join("; ");
        return `Validation error: ${errors}`
    }
    console.log(1)
    if (statusCode === code_internal_server_error) {
        const result = ResponseMessage.safeParse(errorBody)
        if (result.success) {
            console.log(2)
            const message: ResponseMessage = result.data
            if (message.type === "error") {
                return `${message.reason ?? "Internal server error"}: ${message.content}`
            }
        }
    }
    return `An unknown error occured. Status code ${statusCode}.\n${errorBody}`
}

export function useBackendCalling() {

    const generateGCode = async (parameters: CuttingParameters) => {
        if (!parameters.svg) {
            toast.error("Please load an SVG file first");
            return;
        }
        toast.success("Generating G-Code...");
        const postResponse = await postToEndpoint("http://127.0.0.1:8000/generate_gcode", JSON.stringify(parameters))
        if (postResponse.success === false) {
            console.error("G-Code generation failed:", postResponse.error);
            toast.error(`Failed: ${postResponse.error}`)
            return
        }
        const blob = await postResponse.http_response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "model.gcode";
        document.body.appendChild(link);
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url);
    };

    return { generateGCode }
}
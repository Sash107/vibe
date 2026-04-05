export function isValidResponse(curlOutput: string): boolean {
    return curlOutput.trim() === "200";
}
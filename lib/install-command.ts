import { BASE_URL } from "@/lib/baseURL";

export function normalizeAgentInstallCommand(command: string) {
    return command
        .replace(/https?:\/\/[^\s]+\/cocktail\/install\.sh/g, `${BASE_URL}/cocktail/install.sh`)
        .replace(/--serverUrl\s+https?:\/\/[^\s]+/g, `--serverUrl ${BASE_URL}`);
}

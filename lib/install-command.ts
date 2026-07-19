import { BASE_URL } from "@/lib/baseURL";

export function normalizeAgentInstallCommand(command: string) {
    return command
        .replace(/https?:\/\/[^\s]+\/cocktail\/install\.sh/g, `${BASE_URL}/cocktail/install.sh`)
        .replace(/SERVER_URL=(['"])https?:\/\/[^'"\s]+\1/g, `SERVER_URL='${BASE_URL}'`)
        .replace(/--serverUrl\s+https?:\/\/[^\s]+/g, `--serverUrl ${BASE_URL}`);
}

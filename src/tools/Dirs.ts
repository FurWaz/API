import { fileURLToPath } from 'url';

export function getRootDir() {
    return fileURLToPath(new URL('.', import.meta.url));
}

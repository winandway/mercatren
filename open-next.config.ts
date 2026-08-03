import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Adaptador que convierte la aplicacion Next.js en un solo archivo _worker.js
 * para publicarla en YaDominios Cloud.
 */
export default defineCloudflareConfig();

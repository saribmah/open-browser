import { Log } from "../util/log";
import { Instance } from "../instance/instance";
import { SDK } from "../sdk/sdk";

const log = Log.create({ service: "config" });

export namespace Config {
    /**
     * Get providers for the current instance
     */
    export async function providers(): Promise<{ success: boolean; providers?: SDK.ProvidersResponse; error?: string }> {
        log.info("Getting providers");

        try {
            // Get current instance
            const currentInstance = Instance.getCurrent();
            
            if (!currentInstance) {
                log.error("No current instance set");
                return {
                    success: false,
                    error: "No current instance set"
                };
            }

            log.info("Getting providers for instance", {
                instanceId: currentInstance.id,
                sdkType: currentInstance.sdkType,
                directory: currentInstance.directory
            });

            // Get providers from SDK
            const providersData = await SDK.getProviders({
                type: currentInstance.sdkType,
                directory: currentInstance.directory
            });

            log.info("Providers retrieved successfully", {
                instanceId: currentInstance.id,
                providersCount: providersData.providers?.length || 0
            });

            return {
                success: true,
                providers: providersData
            };
        } catch (error: any) {
            log.error("Failed to get providers", {
                error: error.message
            });
            return {
                success: false,
                error: error.message
            };
        }
    }
}

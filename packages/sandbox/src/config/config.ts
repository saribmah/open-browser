import { Log } from "../util/log";
import { Instance } from "../instance/instance";
import { SDK } from "../sdk/sdk";

const log = Log.create({ service: "config" });

export namespace Config {
    /**
     * Config data structure
     */
    export interface ConfigData {
        sdkType: SDK.Type;
        directory: string;
        initialized: boolean;
    }

    /**
     * Get current instance config
     */
    export async function get(): Promise<{ success: boolean; config?: ConfigData; error?: string }> {
        log.info("Getting config");

        try {
            // Get instance state
            const state = Instance.getState();
            const initialized = Instance.isInitialized();

            const configData: ConfigData = {
                sdkType: state.sdkType,
                directory: state.directory,
                initialized
            };

            log.info("Config retrieved successfully", {
                sdkType: configData.sdkType,
                directory: configData.directory,
                initialized: configData.initialized
            });

            return {
                success: true,
                config: configData
            };
        } catch (error: any) {
            log.error("Failed to get config", {
                error: error.message
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get providers for the current instance
     */
    export async function providers(): Promise<{ success: boolean; providers?: SDK.ProvidersResponse; error?: string }> {
        log.info("Getting providers");

        try {
            // Get instance state
            const state = Instance.getState();
            const directory = Instance.getDirectory();

            log.info("Getting providers for instance", {
                sdkType: state.sdkType,
                directory
            });

            // Get providers from SDK
            const providersData = await SDK.getProviders({
                type: state.sdkType,
                directory
            });

            log.info("Providers retrieved successfully", {
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

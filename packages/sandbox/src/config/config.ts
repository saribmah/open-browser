import { Log } from "../util/log";
import { Instance } from "../instance/instance";
import { Project } from "../instance/project";
import { SDK } from "../sdk/sdk";

const log = Log.create({ service: "config" });

export namespace Config {
    /**
     * Get providers for the current instance
     */
    export async function providers(): Promise<{ success: boolean; providers?: SDK.ProvidersResponse; error?: string }> {
        log.info("Getting providers");

        try {
            // Get current project
            const currentProject = Project.getCurrent();
            
            if (!currentProject) {
                log.error("No current project set");
                return {
                    success: false,
                    error: "No current project set"
                };
            }

            // Get SDK type from instance state
            const state = Instance.getState();

            log.info("Getting providers for project", {
                projectId: currentProject.id,
                sdkType: state.sdkType,
                directory: currentProject.directory
            });

            // Get providers from SDK
            const providersData = await SDK.getProviders({
                type: state.sdkType,
                directory: currentProject.directory
            });

            log.info("Providers retrieved successfully", {
                projectId: currentProject.id,
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

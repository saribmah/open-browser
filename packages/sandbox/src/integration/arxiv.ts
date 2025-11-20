import { Integration } from "./integration";
import { $ } from "bun";
import { Log } from "../util/log";
import path from "path";

const log = Log.create({ service: "arxiv-integration" });

/**
 * arXiv integration configuration
 */
export const ARXIV: Integration.Config = {
    type: "ARXIV",
    urlPattern: /arxiv\.org\/abs\/([^\/]+)/,
    parseUrl: (url: string) => {
        const match = url.match(/arxiv\.org\/abs\/([^\/]+)/);
        if (!match) return null;
        const [, paperId] = match;
        return {
            id: `arxiv-${paperId}`,
            metadata: {
                paperId
            }
        };
    },
    setup: async (opts) => {
        const { url, directory, metadata } = opts;
        const paperId = metadata?.paperId;
        
        log.info("Setting up arXiv paper", { 
            url, 
            directory,
            paperId
        });

        if (!paperId) {
            throw new Error("Paper ID not found in metadata");
        }

        try {
            // Construct PDF download URL
            const pdfUrl = `https://arxiv.org/pdf/${paperId}.pdf`;
            const pdfPath = path.join(directory, `${paperId}.pdf`);
            
            // Create directory if it doesn't exist
            await $`mkdir -p ${directory}`.quiet();
            
            // Download the PDF using curl
            await $`curl -L -o ${pdfPath} ${pdfUrl}`.quiet();
            
            log.info("arXiv paper downloaded successfully", { 
                directory,
                pdfPath,
                paperId
            });
        } catch (error: any) {
            log.error("Failed to download arXiv paper", { 
                error: error.message,
                url,
                directory,
                paperId
            });
            throw new Error(`Failed to download arXiv paper: ${error.message}`);
        }
    }
};

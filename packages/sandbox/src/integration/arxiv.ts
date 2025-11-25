import { Integration } from "./integration";
import { $ } from "bun";
import { Log } from "../util/log";
import path from "path";
import * as fs from "fs/promises";

const log = Log.create({ service: "arxiv-integration" });

/**
 * Convert HTML to Markdown
 * Simple conversion that handles common HTML elements
 */
function htmlToMarkdown(html: string): string {
    let md = html;
    
    // Remove script and style tags
    md = md.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    md = md.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Convert headers
    md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n');
    md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n');
    md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '##### $1\n\n');
    md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '###### $1\n\n');
    
    // Convert paragraphs
    md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
    
    // Convert bold and italic
    md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
    
    // Convert links
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
    
    // Convert code blocks
    md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
    md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
    
    // Convert lists
    md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '$1\n');
    md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, '$1\n');
    md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
    
    // Convert blockquotes
    md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n\n');
    
    // Convert line breaks
    md = md.replace(/<br\s*\/?>/gi, '\n');
    
    // Convert horizontal rules
    md = md.replace(/<hr\s*\/?>/gi, '\n---\n\n');
    
    // Remove remaining HTML tags
    md = md.replace(/<[^>]+>/g, '');
    
    // Decode HTML entities
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/&quot;/g, '"');
    md = md.replace(/&#39;/g, "'");
    
    // Clean up extra whitespace
    md = md.replace(/\n{3,}/g, '\n\n');
    md = md.trim();
    
    return md;
}

/**
 * Fetch arXiv paper metadata from the API
 */
async function fetchArxivMetadata(paperId: string): Promise<{ title: string; authors: string[]; abstract: string } | null> {
    try {
        const apiUrl = `http://export.arxiv.org/api/query?id_list=${paperId}`;
        const response = await fetch(apiUrl);
        if (!response.ok) return null;
        
        const xml = await response.text();
        
        // Parse title
        const titleMatch = xml.match(/<title>([^<]+)<\/title>/);
        const title = titleMatch?.[1]?.trim() || paperId;
        
        // Parse authors
        const authorMatches = xml.matchAll(/<author>\s*<name>([^<]+)<\/name>/g);
        const authors = Array.from(authorMatches).map(m => m[1]?.trim()).filter(Boolean) as string[];
        
        // Parse abstract (summary in arXiv API)
        const abstractMatch = xml.match(/<summary>([^<]+)<\/summary>/);
        const abstract = abstractMatch?.[1]?.trim() || '';
        
        return { title, authors, abstract };
    } catch (error) {
        log.warn("Failed to fetch arXiv metadata", { error, paperId });
        return null;
    }
}

/**
 * Try to fetch HTML version of the paper
 * Returns both the raw HTML and converted markdown
 */
async function fetchArxivHtml(paperId: string): Promise<{ html: string; markdown: string } | null> {
    try {
        // arXiv provides HTML versions at /html/{paperId}
        const htmlUrl = `https://arxiv.org/html/${paperId}`;
        const response = await fetch(htmlUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; OpenBrowser/1.0)'
            }
        });
        
        if (!response.ok) {
            log.info("HTML version not available", { paperId, status: response.status });
            return null;
        }
        
        const html = await response.text();
        
        // Extract the main content (article body) for markdown conversion
        const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                            html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                            html.match(/<div[^>]*class="[^"]*ltx_page_content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        
        if (articleMatch && articleMatch[1]) {
            return { html, markdown: htmlToMarkdown(articleMatch[1]) };
        }
        
        // Fallback: convert the whole body
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch && bodyMatch[1]) {
            return { html, markdown: htmlToMarkdown(bodyMatch[1]) };
        }
        
        // Return HTML even if we couldn't extract content for markdown
        return { html, markdown: '' };
    } catch (error) {
        log.warn("Failed to fetch arXiv HTML", { error, paperId });
        return null;
    }
}

/**
 * arXiv integration configuration
 */
export const ARXIV: Integration.Config = {
    type: "ARXIV",
    urlPattern: /arxiv\.org\/(?:abs|pdf)\/([^\/?#]+)/,
    parseUrl: (url: string) => {
        // Match both /abs/ and /pdf/ URLs, and strip .pdf extension if present
        const match = url.match(/arxiv\.org\/(?:abs|pdf)\/([^\/?#]+)/);
        if (!match) return null;
        const [, rawPaperId] = match;
        // Remove .pdf extension if present (e.g., "2510.18234.pdf" -> "2510.18234")
        const paperId = rawPaperId?.replace(/\.pdf$/, "");
        if (!paperId) return null;
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
            // Create directory if it doesn't exist
            await $`mkdir -p ${directory}`.quiet();
            
            // Fetch metadata from arXiv API
            const arxivMetadata = await fetchArxivMetadata(paperId);
            
            // Try to get HTML version and convert to markdown
            const htmlResult = await fetchArxivHtml(paperId);
            let markdownContent: string | null = htmlResult?.markdown || null;
            
            // Save HTML file if we have it
            if (htmlResult?.html) {
                const htmlPath = path.join(directory, `${paperId}.html`);
                await fs.writeFile(htmlPath, htmlResult.html, 'utf-8');
                log.info("HTML file saved", { htmlPath });
            }
            
            // If HTML is not available or markdown extraction failed, create markdown from metadata
            if (!markdownContent && arxivMetadata) {
                log.info("HTML not available, creating markdown from metadata", { paperId });
                markdownContent = [
                    `# ${arxivMetadata.title}`,
                    '',
                    `**Authors:** ${arxivMetadata.authors.join(', ')}`,
                    '',
                    `**arXiv:** [${paperId}](https://arxiv.org/abs/${paperId})`,
                    '',
                    '## Abstract',
                    '',
                    arxivMetadata.abstract,
                    '',
                    '---',
                    '',
                    '*Note: Full paper content is available in the PDF file.*',
                ].join('\n');
            }
            
            // Save markdown file if we have content
            if (markdownContent) {
                const mdPath = path.join(directory, `${paperId}.md`);
                
                // Add header with metadata if we have it
                if (arxivMetadata) {
                    const header = [
                        '---',
                        `title: "${arxivMetadata.title.replace(/"/g, '\\"')}"`,
                        `authors: [${arxivMetadata.authors.map(a => `"${a}"`).join(', ')}]`,
                        `arxiv_id: "${paperId}"`,
                        `pdf_url: "https://arxiv.org/pdf/${paperId}.pdf"`,
                        `html_url: "https://arxiv.org/html/${paperId}"`,
                        '---',
                        '',
                    ].join('\n');
                    markdownContent = header + markdownContent;
                }
                
                await fs.writeFile(mdPath, markdownContent, 'utf-8');
                log.info("Markdown file created", { mdPath });
            }
            
            // Also download the PDF for visual reference
            const pdfUrl = `https://arxiv.org/pdf/${paperId}.pdf`;
            const pdfPath = path.join(directory, `${paperId}.pdf`);
            await $`curl -L -o ${pdfPath} ${pdfUrl}`.quiet();
            
            log.info("arXiv paper setup completed", { 
                directory,
                pdfPath,
                hasHtml: !!htmlResult?.html,
                hasMarkdown: !!markdownContent,
                paperId
            });
        } catch (error: any) {
            log.error("Failed to setup arXiv paper", { 
                error: error.message,
                url,
                directory,
                paperId
            });
            throw new Error(`Failed to setup arXiv paper: ${error.message}`);
        }
    },
    remove: async (opts) => {
        const { directory, metadata } = opts;
        const paperId = metadata?.paperId;
        
        log.info("Removing arXiv paper", { 
            directory,
            paperId
        });

        try {
            // Remove the directory
            await $`rm -rf ${directory}`.quiet();
            
            log.info("arXiv paper removed successfully", { 
                directory,
                paperId
            });
        } catch (error: any) {
            log.error("Failed to remove arXiv paper", { 
                error: error.message,
                directory,
                paperId
            });
            throw new Error(`Failed to remove arXiv paper: ${error.message}`);
        }
    }
};

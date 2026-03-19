
/**
 * puterService.ts
 * Service to interact with Puter.js AI (Grok)
 */

export interface PuterMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface PuterChatOptions {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}

const DEFAULT_MODEL = 'x-ai/grok-4-1-fast';

export const puterChat = async (
    messages: string | PuterMessage[],
    options: PuterChatOptions = {}
): Promise<any> => {
    try {
        if (typeof puter === 'undefined') {
            throw new Error('Puter.js not loaded. Make sure to include the script in index.html');
        }

        const model = options.model || DEFAULT_MODEL;
        console.log(`[PuterService] Calling model ${model}...`);
        const response = await puter.ai.chat(messages, { 
            ...options, 
            model 
        });

        console.log(`[PuterService] AI Response received.`);
        return response;
    } catch (error) {
        console.error('[PuterService] Puter AI Error:', error);
        // Specifically try to log properties if it's an object
        if (typeof error === 'object' && error !== null) {
            console.error('[PuterService] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        }
        throw error;
    }
};

/**
 * Specifically for JSON responses, ensuring we extract and parse correctly
 */
export const puterChatJSON = async <T>(
    prompt: string,
    options: PuterChatOptions = {}
): Promise<T> => {
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond with a valid JSON object or array.`;
    
    const response = await puterChat(jsonPrompt, {
        temperature: 0.1,
        max_tokens: 3000, // Generous limit for complex plans
        ...options,
    });

    const content = response.message.content.trim();
    console.log(`[PuterService] Raw content length: ${content.length}`);
    console.log(`[PuterService] Starting extraction...`);
    
    try {
        // Try simple parse first
        return JSON.parse(content) as T;
    } catch (e) {
        // Try to extract JSON from markdown blocks
        const markdownMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
        if (markdownMatch && markdownMatch[1]) {
            try {
                console.log(`[PuterService] Found JSON in markdown block.`);
                return JSON.parse(markdownMatch[1].trim()) as T;
            } catch (innerE) { /* continue */ }
        }

        // Final attempt: find the first '[' or '{' and last ']' or '}'
        const firstBracket = content.indexOf('[');
        const firstBrace = content.indexOf('{');
        const start = (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) ? firstBracket : firstBrace;
        
        if (start !== -1) {
            const lastBracket = content.lastIndexOf(']');
            const lastBrace = content.lastIndexOf('}');
            const end = Math.max(lastBracket, lastBrace);
            
            if (end > start) {
                try {
                    console.log(`[PuterService] Found JSON by bracket scanning.`);
                    return JSON.parse(content.substring(start, end + 1)) as T;
                } catch (innerE) { /* continue */ }
            }
        }

        console.error("[PuterService] Failed to parse JSON from content:", content);
        throw new Error("Invalid JSON response from AI");
    }
};

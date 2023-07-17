import fs from 'fs';
import { Configuration, OpenAIApi } from 'openai';
import { ChatCompletionRequestMessage } from 'openai/api';
import { AxiosError } from 'axios';
import { encode } from 'gpt-tokenizer';
import api from 'gpt-tokenizer';

const openAiConfig = JSON.parse(fs.readFileSync('.openai/config.json', 'utf8'));

const configuration = new Configuration({
    apiKey: openAiConfig.apiKey,
});

const openAi = new OpenAIApi(configuration);

export default openAi;

export const createChatCompletion = async (
    sid: string,
    messages: Array<ChatCompletionRequestMessage>
): Promise<string> => {
    try {
        const maxTokens = 8000;
        const model = 'gpt-3.5-turbo';

        const massagesWithinTokenLimit = await fitIntoTokenLimit(model, maxTokens, messages);

        const response = await openAi.createChatCompletion({
            model: model,
            messages: massagesWithinTokenLimit,
            temperature: 0.2,
        });

        return response.data.choices[0].message?.content || '';
    } catch (error: unknown) {
        if (error instanceof AxiosError && error.response) {
            console.error(error.message, JSON.stringify(error.response.data), error.response.headers);
        } else {
            console.error(error);
        }
        throw error;
    }
};

export const generateEmbedding = async (text: string): Promise<EmbeddingResult | undefined> => {
    try {
        const maxTokens = 8191;
        const tokens = encode(text);

        if (tokens.length > maxTokens) {
            console.warn(`Text is too long for embedding: ${tokens.length}/${maxTokens} tokens`);
            return undefined;
        }

        const response = await openAi.createEmbedding({
            model: 'text-embedding-ada-002',
            input: text,
        });

        return {
            text: text,
            embedding: response.data.data[0].embedding,
        };
    } catch (error: AxiosError | unknown) {
        if (error instanceof AxiosError && error.response) {
            console.error(error.message, JSON.stringify(error.response.data), error.response.headers);
        } else {
            console.error(error);
        }
        throw error;
    }
};

export interface EmbeddingResult {
    text: string;
    embedding: number[];
}

export const fitIntoTokenLimit = async (
    model: 'gpt-4' | 'gpt-3.5-turbo',
    maxTokens: number,
    messages: Array<ChatCompletionRequestMessage>
): Promise<Array<ChatCompletionRequestMessage>> => {
    const massagesWithinTokenLimit: ChatCompletionRequestMessage[] = [];

    api.modelName = model;

    for (const message of [...messages].reverse()) {
        if (api.isWithinTokenLimit([...massagesWithinTokenLimit, message], maxTokens)) {
            massagesWithinTokenLimit.push(message);
        } else {
            break;
        }
    }

    massagesWithinTokenLimit.reverse();

    return massagesWithinTokenLimit;
};

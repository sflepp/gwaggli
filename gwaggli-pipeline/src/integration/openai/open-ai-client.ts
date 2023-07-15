import fs from "fs";
import {Configuration, OpenAIApi} from "openai";
import {ChatCompletionRequestMessage} from "openai/api";
import {PipelineEventType} from "@gwaggli/events/dist/events/pipeline-events";
import {AxiosError} from "axios";
import {
    encode,
} from 'gpt-tokenizer'
import api from "gpt-tokenizer"

const openAiConfig = JSON.parse(fs.readFileSync(".openai/config.json", "utf8"));

const configuration = new Configuration({
    apiKey: openAiConfig.apiKey,
})

const openAi = new OpenAIApi(configuration);

export default openAi;

export const createChatCompletion = async (sid: string, messages: Array<ChatCompletionRequestMessage>): Promise<string> => {
    try {
        const maxTokens = 8000;
        const model = 'gpt-3.5-turbo';

        const massagesWithinTokenLimit = await fitIntoTokenLimit(model, maxTokens, messages);

        const response = await openAi.createChatCompletion(
            {
                model: model,
                messages: massagesWithinTokenLimit,
                temperature: 0.2
            }
        )

        return (response.data.choices[0].message?.content || '');
    } catch (error: any) {
        let message: string;
        let cause: any;

        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);

            message = JSON.stringify(error.response.data);
            cause = error.response.data;

        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(error.request);

            message = JSON.stringify(error.request);
            cause = error.request;
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message);
            message = error.message;
            cause = error;
        }
        console.log(error.config);

        throw {
            type: PipelineEventType.PipelineError,
            subsystem: 'pipeline',
            timestamp: Date.now(),
            error: message,
            cause: cause,
            sid: sid
        };
    }
}

export const generateEmbedding = async (text: string): Promise<EmbeddingResult | undefined> => {
    try {
        const maxTokens = 8191;
        const tokens = encode(text)

        if (tokens.length > maxTokens) {
            console.warn(`Text is too long for embedding: ${tokens.length}/${maxTokens} tokens`)
            return undefined;
        }

        const response = await openAi.createEmbedding(
            {
                model: 'text-embedding-ada-002',
                input: text,
            }
        )

        return {
            text: text,
            embedding: response.data.data[0].embedding
        };
    } catch (e: AxiosError | any) {

        if (e.response) {
            console.error(e.message, JSON.stringify(e.response.data), e.response.headers);
        } else {
            console.error(e)
        }
        throw e;
    }
}

export interface EmbeddingResult {
    text: string;
    embedding: number[]
}


export const fitIntoTokenLimit = async (model: 'gpt-4' | 'gpt-3.5-turbo', maxTokens: number, messages: Array<ChatCompletionRequestMessage>): Promise<Array<ChatCompletionRequestMessage>> => {
    let massagesWithinTokenLimit: ChatCompletionRequestMessage[] = []

    api.modelName = model

    for (const message of [...messages].reverse()) {

        if (api.isWithinTokenLimit([...massagesWithinTokenLimit, message], maxTokens)) {
            massagesWithinTokenLimit.push(message);
        } else {
            break;
        }
    }

    massagesWithinTokenLimit.reverse();

    return massagesWithinTokenLimit;
}
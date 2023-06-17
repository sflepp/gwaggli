import fs from "fs";
import {Configuration, OpenAIApi} from "openai";
import {ChatCompletionRequestMessage} from "openai/api";
import {PipelineEventType} from "@gwaggli/events/dist/events/pipeline-events";

const openAiConfig = JSON.parse(fs.readFileSync(".openai/config.json", "utf8"));

const configuration = new Configuration({
    apiKey: openAiConfig.apiKey,
})

const openAi = new OpenAIApi(configuration);

export default openAi;

export const createChatCompletion = async (sid: string, messages: Array<ChatCompletionRequestMessage>) => {
    try {
        const response = await openAi.createChatCompletion(
            {
                model: 'gpt-3.5-turbo-16k-0613',
                messages: messages,
                temperature: 0.5
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
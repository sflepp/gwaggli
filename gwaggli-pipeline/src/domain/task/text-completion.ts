import {TranscriptionComplete} from "@gwaggli/events/dist/events/pipeline-events";
import openAi from "../../integration/openai/open-ai-client";
import {EventSystem, PipelineEventType} from "@gwaggli/events";

const model = "text-davinci-003"
const chatModel = "gpt-3.5-turbo"

export const registerChatStyleTextCompletion = (eventSystem: EventSystem) => {

    const history = new Map<string, {
        prompt: string,
        answer: string
    }[]>();


    eventSystem.on<TranscriptionComplete>(PipelineEventType.TranscriptionComplete, async (event) => {
        const currentHistory = history.get(event.sid) || [];
        const historyPrompt = currentHistory.map((historyEntry) => {
            return `Human: ${historyEntry.prompt}\nAI copilot: ${historyEntry.answer}\n`
        }).join("\n") || '';

        const prompt = "The following is a conversation with an AI text copilot on the side of a human. The AI copilot listens to the conversation and tries to give interesting, funny, smart and clever inputs, which the human can use to improve the conversation" +
            `${historyPrompt}\nHuman: ${event.text}\nAI copilot: `;

        console.log(prompt)


        try {
            const response = await openAi.createCompletion({
                model: model,
                prompt: prompt,
                temperature: 0.6,
                max_tokens: 3000,
            });

            const answer = response.data.choices[0].text || '';

            history.set(event.sid, [...currentHistory, {
                prompt: event.text,
                answer: answer
            }]);

            eventSystem.dispatch({
                type: PipelineEventType.TextCompletionFinish,
                subsystem: "pipeline",
                sid: event.sid,
                timestamp: Date.now(),
                trackId: event.trackId,
                language: event.language,
                text: answer,
            });
        } catch (error) {
            console.log(error)
        }
    });
}

export const registerCopilotStyleTextCompletion = (eventSystem: EventSystem) => {

    const history: TranscriptionComplete[] = [];

    eventSystem.on<TranscriptionComplete>(PipelineEventType.TranscriptionComplete, async (event) => {

        history.push(event);

        try {
            const historyText = history.map(it => it.text).join("\n").substring(-3000)

            const [summary, facts, questions, buzzwords] = await Promise.all([
                createSummary(historyText),
                createFacts(historyText),
                createQuestions(historyText),
                createBuzzwords(historyText)
            ])

            eventSystem.dispatch({
                type: PipelineEventType.CopilotProcessingComplete,
                subsystem: "pipeline",
                sid: event.sid,
                timestamp: Date.now(),
                trackId: event.trackId,
                language: event.language,
                history: historyText,
                summary: summary,
                facts: facts,
                questions: questions,
                buzzwords: buzzwords,
            });
        } catch (error: any) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                console.log(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error', error.message);
            }
        }
    });
}

const createSummary = async (text: string) => {
    const response = await openAi.createChatCompletion({
        model: chatModel,
        messages: [
            {
                role: "system",
                content: "Summarize the following text into one sentence."
            },
            {
                role: "user",
                content: text
            }
        ],
        temperature: 0.6,
    });

    return (response.data.choices[0].message?.content || '').trim();
}

const createFacts = async (text: string) => {
    const response = await openAi.createChatCompletion({
        model: chatModel,
        messages: [
            {
                role: "system",
                content: "Provide interesting facts as an addition to the following text."
            },
            {
                role: "user",
                content: text
            }
        ],
        temperature: 0.6,
    });

    return (response.data.choices[0].message?.content || '').trim();
}

const createQuestions = async (text: string) => {

    const response = await openAi.createChatCompletion({
        model: chatModel,
        messages: [
            {
                role: "system",
                content: "Provide follow-up questions for the following text."
            },
            {
                role: "user",
                content: text
            }
        ],
        temperature: 0.6,
    });

    return (response.data.choices[0].message?.content || '').trim();
}

const createBuzzwords = async (text: string) => {
    const response = await openAi.createChatCompletion({
        model: chatModel,
        messages: [
            {
                role: "system",
                content: "You are going to generate a shortlist of buzzwords for the following text."
            },
            {
                role: "user",
                content: text
            }
        ],
        temperature: 0.6,
    });

    return (response.data.choices[0].message?.content || '').trim();
}
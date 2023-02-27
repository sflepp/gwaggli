import {EventSystem, PipelineEventType} from "@gwaggli/events";
import {TranscriptionComplete} from "@gwaggli/events/dist/events/pipeline-events";
import openAi from "../../integration/openai/open-ai-client";

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
                model: "text-davinci-003",
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

export const registerSuggestionStyleTextCompletion = (eventSystem: EventSystem) => {

}
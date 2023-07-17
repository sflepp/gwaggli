import { PipelineError, TranscriptionComplete } from '@gwaggli/events/dist/events/pipeline-events';
import openAi, { createChatCompletion, generateEmbedding } from '../../integration/openai/open-ai-client';
import { EventSystem, PipelineEventType } from '@gwaggli/events';
import { ChatCompletionRequestMessage } from 'openai/api';
import { knowledgeBase } from './knowledge-loader';

const chatModel = 'gpt-3.5-turbo';

export const registerChatStyleTextCompletion = (eventSystem: EventSystem) => {
    const history: ChatCompletionRequestMessage[] = [];

    eventSystem.on<TranscriptionComplete>(PipelineEventType.TranscriptionComplete, async (event) => {
        const embedding = await generateEmbedding(event.text);

        if (embedding !== undefined) {
            const bestEmbeddings = knowledgeBase.search(embedding.embedding, 3, 0.5);

            for (const bestEmbedding of bestEmbeddings) {
                history.push({
                    role: 'user', // TODO: analyze why user works best... Shouldn't it be assistant?
                    content: bestEmbedding.entry.text,
                });
            }
        }

        history.push({
            role: 'user',
            content: event.text,
        });

        let answer;
        try {
            answer = await createChatCompletion(event.sid, [
                {
                    role: 'system',
                    content:
                        'Ich bin ein freundlicher, weltoffener Chatpartner. Ich heisse Gwaggli und beantworte gerne Fragen zu allen möglichen Themen. Ich gebe kurze und knackige Antworten.',
                },
                ...history,
            ]);
        } catch (e: unknown) {
            eventSystem.dispatch(e as PipelineError);
            answer =
                'Ich habe gerade ein technisches Problem und kann dir nicht weiterhelfen. Bitte versuche es nocheinmal.';
        }

        history.push({
            role: 'assistant',
            content: answer,
        });

        console.log(history);

        eventSystem.dispatch({
            type: PipelineEventType.TextCompletionFinish,
            subsystem: 'pipeline',
            sid: event.sid,
            timestamp: Date.now(),
            trackId: event.trackId,
            language: event.language,
            text: answer,
        });
    });
};

export const registerCopilotStyleTextCompletion = (eventSystem: EventSystem) => {
    const history: TranscriptionComplete[] = [];

    eventSystem.on<TranscriptionComplete>(PipelineEventType.TranscriptionComplete, async (event) => {
        history.push(event);

        try {
            const historyText = history
                .map((it) => it.text)
                .join('\n')
                .substring(-3000);

            const [summary, facts, questions, buzzwords] = await Promise.all([
                createSummary(historyText),
                createFacts(historyText),
                createQuestions(historyText),
                createBuzzwords(historyText),
            ]);

            eventSystem.dispatch({
                type: PipelineEventType.CopilotProcessingComplete,
                subsystem: 'pipeline',
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
        } catch (error: unknown) {
            console.error(error);
        }
    });
};

const createSummary = async (text: string) => {
    const response = await openAi.createChatCompletion({
        model: chatModel,
        messages: [
            {
                role: 'system',
                content: 'Erstelle eine kurze Zusammenfassung.',
            },
            {
                role: 'user',
                content: text,
            },
        ],
        temperature: 0,
    });

    return (response.data.choices[0].message?.content || '').trim();
};

const createFacts = async (text: string) => {
    const response = await openAi.createChatCompletion({
        model: chatModel,
        messages: [
            {
                role: 'system',
                content: 'Liefere interessante Fakten.',
            },
            {
                role: 'user',
                content: text,
            },
        ],
        temperature: 0,
    });

    return (response.data.choices[0].message?.content || '').trim();
};

const createQuestions = async (text: string) => {
    const response = await openAi.createChatCompletion({
        model: chatModel,
        messages: [
            {
                role: 'system',
                content: 'Erstelle kurze Fragen, die die Diskussion weiterführen könnten.',
            },
            {
                role: 'user',
                content: text,
            },
        ],
        temperature: 0,
    });

    return (response.data.choices[0].message?.content || '').trim();
};

const createBuzzwords = async (text: string) => {
    const response = await openAi.createChatCompletion({
        model: chatModel,
        messages: [
            {
                role: 'system',
                content: 'Erstelle eine kurze Liste von Buzzwords und Schlagworten.',
            },
            {
                role: 'user',
                content: text,
            },
        ],
        temperature: 0,
    });

    return (response.data.choices[0].message?.content || '').trim();
};

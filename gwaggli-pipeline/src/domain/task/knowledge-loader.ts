import { generateEmbedding } from '../../integration/openai/open-ai-client';
import { EmbeddingsKnowledgeBase } from '../../storage/knowledge-base/embeddings-knowledge-base';
import { loaderByLocationType } from '../data-loader/loader-factory';
import { NoopSplitter } from '../../storage/knowledge-base/splitters/noop-splitter';
import { ChunkSplitter } from '../../storage/knowledge-base/splitters/chunk-splitter';
import {
    EventSystem,
    GwaggliEventType,
    KnowledgeEmbeddingAvailable,
    KnowledgeLocationAvailable,
    KnowledgeTextAvailable,
} from '@gwaggli/events';

const splitters = [new NoopSplitter(), new ChunkSplitter(1500)];

// TODO: This is a temporary solution to get the knowledge base working, find a better place for this
export const knowledgeBase = new EmbeddingsKnowledgeBase();

export const registerKnowledgeLoader = (eventSystem: EventSystem) => {
    eventSystem.on<KnowledgeLocationAvailable>(GwaggliEventType.KnowledgeLocationAvailable, async (event) => {
        const loader = loaderByLocationType(event.locationType);

        const results = await loader.load(event);

        for (const result of results) {
            eventSystem.dispatch({
                type: GwaggliEventType.KnowledgeTextAvailable,
                subsystem: 'pipeline',
                sid: event.sid,
                timestamp: Date.now(),
                source: result.location,
                text: result.text,
            });
        }
    });

    eventSystem.on<KnowledgeTextAvailable>(GwaggliEventType.KnowledgeTextAvailable, async (event) => {
        for (const splitter of splitters) {
            const splitTexts = splitter.split(event.text);

            for (let i = 0; i < splitTexts.length; i++) {
                const splitText = splitTexts[i];
                console.log(`Processing ${splitter.name()}: ${i + 1}/${splitTexts.length}`);

                const embedding = await generateEmbedding(splitText);

                if (embedding === undefined) {
                    console.warn(`Skipping ${splitter.name()}: ${i + 1}/${splitTexts.length}`);
                    continue;
                }

                eventSystem.dispatch({
                    type: GwaggliEventType.KnowledgeEmbeddingAvailable,
                    subsystem: 'pipeline',
                    sid: event.sid,
                    timestamp: Date.now(),
                    source: event.source,
                    text: embedding.text,
                    embedding: embedding.embedding,
                });
            }
        }
    });

    eventSystem.on<KnowledgeEmbeddingAvailable>(GwaggliEventType.KnowledgeEmbeddingAvailable, async (event) => {
        knowledgeBase.add(event);
    });
};

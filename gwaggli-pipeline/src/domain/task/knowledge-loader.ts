import {EventSystem, PipelineEventType} from "@gwaggli/events";
import {
    KnowledgeEmbeddingAvailable,
    KnowledgeLocationAvailable,
    KnowledgeTextAvailable
} from "@gwaggli/events/dist/events/pipeline-events";

import {generateEmbedding} from "../../integration/openai/open-ai-client";
import {EmbeddingsKnowledgeBase} from "../../storage/knowledge-base/embeddings-knowledge-base";
import {loaderByLocationType} from "../data-loader/loader-factory";
import {NoopSplitter} from "../../storage/knowledge-base/splitters/noop-splitter";
import {ChunkSplitter} from "../../storage/knowledge-base/splitters/chunk-splitter";

const splitters = [
    new NoopSplitter(),
    new ChunkSplitter(250),
]

export const registerKnowledgeLoader = (eventSystem: EventSystem) => {

    const knowledgeBase = new EmbeddingsKnowledgeBase();

    eventSystem.on<KnowledgeLocationAvailable>(PipelineEventType.KnowledgeLocationAvailable, async (event) => {
        let loader = loaderByLocationType(event.locationType);

        const results = await loader.load(event);

        for (const result of results) {
            eventSystem.dispatch({
                type: PipelineEventType.KnowledgeTextAvailable,
                subsystem: "pipeline",
                sid: event.sid,
                timestamp: Date.now(),
                source: result.location,
                text: result.text
            })
        }
    });


    eventSystem.on<KnowledgeTextAvailable>(PipelineEventType.KnowledgeTextAvailable, async (event) => {
        for (const splitter of splitters) {
            const splitTexts = splitter.split(event.text);

            for (let i = 0; i < splitTexts.length; i++) {
                const splitText = splitTexts[i];
                console.log(`Processing ${splitter.name()}: ${i + 1}/${splitTexts.length}`)


                eventSystem.dispatch({
                    type: PipelineEventType.KnowledgeEmbeddingAvailable,
                    subsystem: "pipeline",
                    sid: event.sid,
                    timestamp: Date.now(),
                    source: event.source,
                    ...await generateEmbedding(splitText)
                })
            }
        }
    });

    eventSystem.on<KnowledgeEmbeddingAvailable>(PipelineEventType.KnowledgeEmbeddingAvailable, async (event) => {
        knowledgeBase.add(event);
    });
}
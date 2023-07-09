import { EventSystem, GwaggliEvent, PipelineEventType } from "@gwaggli/events";
import { registerKnowledgeLoader } from "./knowledge-loader";

describe("knowledge-loader", () => {
    let eventSystem: EventSystem;
    let result: GwaggliEvent[];

    beforeEach(() => {
       result = [];
       eventSystem = new EventSystem();

       registerKnowledgeLoader(eventSystem);
    });


    it('should create an embedding', () => {
        eventSystem.dispatch({
            type: PipelineEventType.TextKnowledgeAvailable,
            subsystem: "pipeline",
            sid: "123",
            timestamp: Date.now(),
            source: "test-data",
            text: "This is an example text."
        })
    });
})

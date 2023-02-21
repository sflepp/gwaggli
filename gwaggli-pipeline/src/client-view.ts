import {dispatch, on} from "./event-system/event-system";
import {
    ClientEventType,
    ClientViewState,
    ConversationChunk
} from "./event-system/events/client-events";
import {
    PipelineEventType, TextCompletionFinish, TranscriptionComplete,
    VoiceActivationEnd, VoiceActivationLevelUpdate,
    VoiceActivationStart, VoicePersist
} from "./event-system/events/pipeline-events";


export const registerClientView = () => {

    const views = new Map<string, ClientViewState>();

    on<VoiceActivationStart>(PipelineEventType.VoiceActivationStart, (event) => {
        if (!views.has(event.sid)) {
            views.set(event.sid, {sid: event.sid, conversation: []});
        }

        const view = views.get(event.sid) as ClientViewState;

        const conversationChunk: ConversationChunk = {
            id: event.trackId,
            timestamp: Date.now(),
            currentStep: event.type,
            voiceActivationActive: true,
        };

        view.conversation.push(conversationChunk);

        dispatchClientView(view)
    });

    on<VoiceActivationEnd>(PipelineEventType.VoiceActivationEnd, (event) => {
        const view = views.get(event.sid) as ClientViewState;

        const conversationChunk = view.conversation.find((chunk) => chunk.id === event.trackId);

        if (conversationChunk) {
            conversationChunk.currentStep = event.type;
            conversationChunk.voiceActivationActive = false;
        }

        dispatchClientView(view)
    });

    on<TranscriptionComplete>(PipelineEventType.TranscriptionComplete, (event) => {
        console.log(event.sid)
        const view = views.get(event.sid) as ClientViewState;

        const conversationChunk = view.conversation.find((chunk) => chunk.id === event.trackId);

        if (conversationChunk) {
            conversationChunk.currentStep = event.type;
            conversationChunk.promptLanguage = event.language;
            conversationChunk.prompt = event.text;
        }

        dispatchClientView(view)
    });

    on<TextCompletionFinish>(PipelineEventType.TextCompletionFinish, (event) => {
        const view = views.get(event.sid) as ClientViewState;

        const conversationChunk = view.conversation.find((chunk) => chunk.id === event.trackId);

        if (conversationChunk) {
            conversationChunk.currentStep = event.type;
            conversationChunk.answerLanguage = event.language;
            conversationChunk.answer = event.text;
        }

        dispatchClientView(view)
    });

    on<VoicePersist>(PipelineEventType.VoicePersist, (event) => {
        const view = views.get(event.sid) as ClientViewState;

        const conversationChunk = view.conversation.find((chunk) => chunk.id === event.trackId);

        if (conversationChunk) {
            conversationChunk.currentStep = event.type;
            conversationChunk.answerAudioUrl = event.fileName;
        }

        dispatchClientView(view)
    });

    on<VoiceActivationLevelUpdate>(PipelineEventType.VoiceActivationLevelUpdate, (event) => {
        dispatch({
            type: ClientEventType.ClientViewVoiceActivation,
            subsystem: "client",
            timestamp: Date.now(),
            sid: event.sid,
            level: event.level
        })
    });
}

const dispatchClientView = (view: ClientViewState) => {
    dispatch({
        type: ClientEventType.ClientViewUpdate,
        subsystem: "client",
        timestamp: Date.now(),
        sid: view.sid,
        data: view
    })
}

export const dispatchClientMessage = (sid: string, data: string) => {
    dispatch({
        ...JSON.parse(data),
        sid: sid,
    })
}

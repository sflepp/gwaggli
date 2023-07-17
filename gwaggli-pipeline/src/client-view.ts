import {
    ClientViewState,
    ConversationChunk,
    EventSystem,
    GwaggliEventType,
    TextCompletionFinish,
    TranscriptionComplete,
    VoiceActivationEnd,
    VoiceActivationLevelUpdate,
    VoiceActivationStart,
    VoicePersist,
} from '@gwaggli/events';

export const registerClientView = (eventSystem: EventSystem) => {
    const views = new Map<string, ClientViewState>();

    eventSystem.on<VoiceActivationStart>(GwaggliEventType.VoiceActivationStart, (event) => {
        if (!views.has(event.sid || '')) {
            views.set(event.sid || '', { sid: event.sid || '', conversation: [] });
        }

        const view = views.get(event.sid || '') as ClientViewState;

        const conversationChunk: ConversationChunk = {
            id: event.trackId,
            timestamp: Date.now(),
            currentStep: event.type,
            voiceActivationActive: true,
        };

        view.conversation.push(conversationChunk);

        dispatchClientView(eventSystem, view);
    });

    eventSystem.on<VoiceActivationEnd>(GwaggliEventType.VoiceActivationEnd, (event) => {
        const view = views.get(event.sid || '') as ClientViewState;

        const conversationChunk = view.conversation.find((chunk) => chunk.id === event.trackId);

        if (conversationChunk) {
            conversationChunk.currentStep = event.type;
            conversationChunk.voiceActivationActive = false;
        }

        dispatchClientView(eventSystem, view);
    });

    eventSystem.on<TranscriptionComplete>(GwaggliEventType.TranscriptionComplete, (event) => {
        console.log(event.sid);
        const view = views.get(event.sid || '') as ClientViewState;

        const conversationChunk = view.conversation.find((chunk) => chunk.id === event.trackId);

        if (conversationChunk) {
            conversationChunk.currentStep = event.type;
            conversationChunk.promptLanguage = event.language;
            conversationChunk.prompt = event.text;
        }

        dispatchClientView(eventSystem, view);
    });

    eventSystem.on<TextCompletionFinish>(GwaggliEventType.TextCompletionFinish, (event) => {
        const view = views.get(event.sid || '') as ClientViewState;

        const conversationChunk = view.conversation.find((chunk) => chunk.id === event.trackId);

        if (conversationChunk) {
            conversationChunk.currentStep = event.type;
            conversationChunk.answerLanguage = event.language;
            conversationChunk.answer = event.text;
        }

        dispatchClientView(eventSystem, view);
    });

    eventSystem.on<VoicePersist>(GwaggliEventType.VoicePersist, (event) => {
        const view = views.get(event.sid || '') as ClientViewState;

        const conversationChunk = view.conversation.find((chunk) => chunk.id === event.trackId);

        if (conversationChunk) {
            conversationChunk.currentStep = event.type;
            conversationChunk.answerAudioUrl = event.fileName;
        }

        dispatchClientView(eventSystem, view);
    });

    eventSystem.on<VoiceActivationLevelUpdate>(GwaggliEventType.VoiceActivationLevelUpdate, (event) => {
        eventSystem.dispatch({
            type: GwaggliEventType.ClientViewVoiceActivation,
            subsystem: 'client',
            timestamp: Date.now(),
            sid: event.sid,
            level: event.level,
        });
    });
};

const dispatchClientView = (eventSystem: EventSystem, view: ClientViewState) => {
    eventSystem.dispatch({
        type: GwaggliEventType.ClientViewUpdate,
        subsystem: 'client',
        timestamp: Date.now(),
        sid: view.sid,
        data: view,
    });
};

export const dispatchClientMessage = (eventSystem: EventSystem, sid: string, data: string) => {
    eventSystem.dispatch({
        ...JSON.parse(data),
        sid: sid,
        timestamp: new Date().getTime(),
    });
};

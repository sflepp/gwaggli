import { transcribeUsingWhisper } from '../../integration/replicate/whisper';
import openAi from '../../integration/openai/open-ai-client';
import { Buffer } from 'buffer';
import { Readable } from 'stream';
import { EventSystem, GwaggliEventType, VoiceActivationDataAvailable, withTrace } from '@gwaggli/events';

export const registerReplicateWhisper = (eventSystem: EventSystem) => {
    eventSystem.on<VoiceActivationDataAvailable>(GwaggliEventType.VoiceActivationDataAvailable, async (event) => {
        const generator = transcribeUsingWhisper(event.audio);

        for await (const transcriptionEvent of generator) {
            if (transcriptionEvent.status === 'succeeded' && transcriptionEvent.output !== undefined) {
                eventSystem.dispatch({
                    meta: withTrace(event),
                    type: GwaggliEventType.TranscriptionComplete,
                    language: transcriptionEvent.output.detected_language,
                    text: transcriptionEvent.output.transcription,
                });
            } else {
                eventSystem.dispatch({
                    meta: withTrace(event),
                    type: GwaggliEventType.TranscriptionProcessing,
                    status: transcriptionEvent.status,
                });
            }
        }
    });
};

export const registerOpenaiWhisper = (eventSystem: EventSystem) => {
    eventSystem.on<VoiceActivationDataAvailable>(GwaggliEventType.VoiceActivationDataAvailable, async (event) => {
        const audioFile = Readable.from(Buffer.from(event.audio, 'base64')) as unknown as File;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        audioFile.path = 'in-memory.wav'; // workaround, see https://github.com/openai/openai-node/issues/77

        const language = 'de';

        try {
            const transcription = await openAi.createTranscription(
                audioFile,
                'whisper-1',
                undefined,
                undefined,
                undefined,
                language
            );

            eventSystem.dispatch({
                meta: withTrace(event),
                type: GwaggliEventType.TranscriptionComplete,
                language: language,
                text: transcription.data.text,
            });
        } catch (e) {
            eventSystem.dispatch({
                meta: withTrace(event),
                type: GwaggliEventType.TranscriptionComplete,
                language: language,
                text: 'Failed to process audio.',
            });
        }
    });
};

export const registerTranscription = (eventSystem: EventSystem) => {
    registerOpenaiWhisper(eventSystem);
};

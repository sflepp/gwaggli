import fs from 'fs';
import { Buffer } from 'buffer';
import { textToSpeechAwsPolly } from '../../integration/aws/aws-client';
import { EventSystem, GwaggliEventType, TextCompletionFinish, TextToVoiceFinish } from '@gwaggli/events';

export const registerPollyTextToSpeech = (eventSystem: EventSystem) => {
    eventSystem.on<TextCompletionFinish>(GwaggliEventType.TextCompletionFinish, async (event) => {
        const voiceId = speakerForLanguage(event.language);
        const audio = await textToSpeechAwsPolly(event.text, speakerForLanguage(event.language));

        eventSystem.dispatch({
            type: GwaggliEventType.TextToVoiceFinish,
            subsystem: 'pipeline',
            sid: event.sid,
            timestamp: Date.now(),
            trackId: event.trackId,
            language: event.language,
            voiceId: voiceId,
            audio: audio.buffer.toString('base64'),
        });
    });
};

export const registerTextToSpeechPersist = (eventSystem: EventSystem) => {
    eventSystem.on<TextToVoiceFinish>(GwaggliEventType.TextToVoiceFinish, async (event) => {
        const fileName = `${event.voiceId}_${new Date().getTime()}.wav`;
        const folder = `generated/voices`;
        const path = `${folder}/${fileName}`;

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        fs.writeFile(path, Buffer.from(event.audio, 'base64'), (err) => {
            eventSystem.dispatch({
                type: GwaggliEventType.VoicePersist,
                subsystem: 'pipeline',
                timestamp: Date.now(),
                sid: event.sid,
                trackId: event.trackId,
                fileName: fileName,
            });

            if (err) {
                console.error(err);
            }
        });
    });
};

export const registerTextToSpeech = (eventSystem: EventSystem) => {
    registerPollyTextToSpeech(eventSystem);
    registerTextToSpeechPersist(eventSystem);
};

const speakerForLanguage = (language: string) => {
    switch (language) {
        case 'de':
        case 'german':
            return 'Daniel';
        case 'en':
        case 'english':
            return 'Matthew';
        default:
            return 'Matthew';
    }
};

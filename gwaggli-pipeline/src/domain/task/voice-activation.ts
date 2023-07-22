import { Buffer } from 'buffer';
import fs from 'fs';
import { SubPipelineConfig } from '../../pipeline';
import { SimplePcmVoiceActivation } from '../algorithms/voice-activation/simple-pcm-voice-activation';

import { AudioChunk, EventSystem, GwaggliEventType, VoiceActivationDataAvailable, withTrace } from '@gwaggli/events';

export const registerVoiceActivationDetection = (eventSystem: EventSystem, config: SubPipelineConfig) => {
    const voiceActivation = new SimplePcmVoiceActivation({
        observeMilliseconds: 1000,
        observeSampleResolution: 1000,
        activationThreshold: config.voiceActivationStartLevel,
        deactivationThreshold: config.voiceActivationEndLevel,
    });

    let active: AudioChunk | undefined;

    eventSystem.on<AudioChunk>(GwaggliEventType.AudioChunk, (event: AudioChunk) => {
        const voiceData = voiceActivation.next(Buffer.from(event.audio, 'base64'));
        const currentLevel = voiceActivation.currentLevel();

        eventSystem.dispatch({
            meta: withTrace(event),
            type: GwaggliEventType.VoiceActivationLevelUpdate,
            level: Math.min(100, Math.round((currentLevel / config.voiceActivationStartLevel) * 100)),
        });

        if (!active && voiceActivation.isActive()) {
            active = event;

            eventSystem.dispatch({
                meta: withTrace(active),
                type: GwaggliEventType.VoiceActivationStart,
            });
        }

        if (active && voiceData) {
            eventSystem.dispatch({
                meta: withTrace(active),
                type: GwaggliEventType.VoiceActivationEnd,
            });

            eventSystem.dispatch({
                meta: withTrace(active),
                type: GwaggliEventType.VoiceActivationDataAvailable,
                audio: voiceData.buffer.toString('base64'),
            });

            active = undefined;
        }
    });
};

export const registerVoiceActivationPersist = (eventSystem: EventSystem) => {
    eventSystem.on<VoiceActivationDataAvailable>(GwaggliEventType.VoiceActivationDataAvailable, (event) => {
        const fileName = `audio-${new Date().getTime()}-${event.meta.id}.wav`;
        const folder = `./generated/voice-activation`;
        const path = `${folder}/${fileName}`;

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        fs.writeFileSync(path, Buffer.from(event.audio, 'base64'));

        eventSystem.dispatch({
            meta: withTrace(event),
            type: GwaggliEventType.VoiceActivationPersist,
            fileName: fileName,
        });
    });
};

export const registerVoiceActivation = (eventSystem: EventSystem, config: SubPipelineConfig) => {
    registerVoiceActivationDetection(eventSystem, config);
    registerVoiceActivationPersist(eventSystem);
};

import { Buffer } from 'buffer';
import fs from 'fs';
import { SubPipelineConfig } from '../../pipeline';
import { SimplePcmVoiceActivation } from '../algorithms/voice-activation/simple-pcm-voice-activation';

import { v4 as uuidv4 } from 'uuid';
import { AudioChunk, EventSystem, GwaggliEventType, VoiceActivationDataAvailable } from '@gwaggli/events';

export const registerVoiceActivationDetection = (eventSystem: EventSystem, config: SubPipelineConfig) => {
    const voiceActivation = new SimplePcmVoiceActivation({
        observeMilliseconds: 1000,
        observeSampleResolution: 1000,
        activationThreshold: config.voiceActivationStartLevel,
        deactivationThreshold: config.voiceActivationEndLevel,
    });

    let trackId: string | undefined;
    let isActive = false;

    eventSystem.on<AudioChunk>(GwaggliEventType.AudioChunk, (event: AudioChunk) => {
        const voiceData = voiceActivation.next(Buffer.from(event.audio, 'base64'));
        const currentLevel = voiceActivation.currentLevel();

        eventSystem.dispatch({
            type: GwaggliEventType.VoiceActivationLevelUpdate,
            subsystem: 'pipeline',
            sid: event.sid,
            timestamp: Date.now(),
            level: Math.min(100, Math.round((currentLevel / config.voiceActivationStartLevel) * 100)),
        });

        if (!isActive && voiceActivation.isActive()) {
            trackId = uuidv4();
            isActive = true;

            eventSystem.dispatch({
                type: GwaggliEventType.VoiceActivationStart,
                subsystem: 'pipeline',
                sid: event.sid,
                timestamp: Date.now(),
                trackId: trackId as string,
            });
        }

        if (voiceData) {
            eventSystem.dispatch({
                type: GwaggliEventType.VoiceActivationEnd,
                subsystem: 'pipeline',
                sid: event.sid,
                timestamp: Date.now(),
                trackId: trackId as string,
            });

            eventSystem.dispatch({
                type: GwaggliEventType.VoiceActivationDataAvailable,
                subsystem: 'pipeline',
                sid: event.sid,
                timestamp: Date.now(),
                trackId: trackId as string,
                audio: voiceData.buffer.toString('base64'),
            });

            isActive = false;
            trackId = undefined;
        }
    });
};

export const registerVoiceActivationPersist = (eventSystem: EventSystem) => {
    eventSystem.on<VoiceActivationDataAvailable>(GwaggliEventType.VoiceActivationDataAvailable, (event) => {
        const fileName = `audio-${new Date().getTime()}-${event.trackId}.wav`;
        const folder = `./generated/voice-activation`;
        const path = `${folder}/${fileName}`;

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        fs.writeFileSync(path, Buffer.from(event.audio, 'base64'));

        eventSystem.dispatch({
            type: GwaggliEventType.VoiceActivationPersist,
            subsystem: 'pipeline',
            sid: event.sid,
            timestamp: Date.now(),
            trackId: event.trackId,
            fileName: fileName,
        });
    });
};

export const registerVoiceActivation = (eventSystem: EventSystem, config: SubPipelineConfig) => {
    registerVoiceActivationDetection(eventSystem, config);
    registerVoiceActivationPersist(eventSystem);
};

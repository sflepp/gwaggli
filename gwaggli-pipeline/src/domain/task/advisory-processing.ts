import { advisoryRepository } from '../../repository/advisory-repository';
import { createChatCompletion } from '../../integration/openai/open-ai-client';
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { textToSpeechAwsPolly } from '../../integration/aws/aws-client';
import { advisorConfigurations } from '../model/advisory/advisor-configurations';
import { textToSpeechElevenLabs } from '../../integration/elevenlabs/eleven-labs-client';
import {
    AddAdvisorEvent,
    EventSystem,
    GwaggliEventType,
    JoinAdvisoryEvent,
    PipelineError,
    TranscriptionComplete,
    withTrace,
} from '@gwaggli/events';

export const registerAdvisoryProcessing = (eventSystem: EventSystem) => {
    eventSystem.on<JoinAdvisoryEvent>(GwaggliEventType.JoinAdvisory, (event) => {
        let advisory = advisoryRepository.findById(event.advisoryId);
        if (advisory === undefined) {
            advisory = {
                id: event.advisoryId,
                sids: [],
                advisors: [],
                conversation: [],
            };
        }

        advisory.sids.push(event.meta.sid);

        advisoryRepository.save(advisory);
    });

    eventSystem.on<AddAdvisorEvent>(GwaggliEventType.AddAdvisor, (event) => {
        const advisory = advisoryRepository.findBySid(event.meta.sid);
        if (advisory === undefined) {
            return;
        }

        const predefinedConfig = advisorConfigurations.find((config) => config.name === event.name);

        if (predefinedConfig === undefined) {
            advisory.advisors.push({
                sid: event.meta.sid,
                id: event.name,
                name: event.name,
                voice: event.voice,
                voiceSystem: 'aws-polly',
                purpose: event.purpose,
            });
        } else {
            advisory.advisors.push({
                sid: event.meta.sid,
                id: event.name,
                ...predefinedConfig,
            });
        }

        advisoryRepository.save(advisory);
    });

    eventSystem.on<TranscriptionComplete>(GwaggliEventType.TranscriptionComplete, async (event) => {
        try {
            const advisory = advisoryRepository.findBySid(event.meta.sid);

            if (advisory === undefined) {
                return;
            }

            const advisor = advisory.advisors.find((advisor) => advisor.sid === event.meta.sid);

            if (advisor === undefined) {
                return;
            }

            advisory.conversation.push({
                from: 'human',
                to: advisor.id,
                text: event.text,
                language: event.language,
            });

            advisoryRepository.save(advisory);

            console.log(advisory.conversation);

            const prompt = [
                {
                    role: ChatCompletionRequestMessageRoleEnum.System,
                    content: advisor.purpose,
                },
                ...advisory.conversation
                    .filter((e) => e.to === advisor.id || e.from === advisor.id)
                    .map((conversationEntry) => {
                        return {
                            role:
                                conversationEntry.from === 'human'
                                    ? ChatCompletionRequestMessageRoleEnum.User
                                    : ChatCompletionRequestMessageRoleEnum.Assistant,
                            content: conversationEntry.text,
                        };
                    }),
            ];

            let answer;
            try {
                answer = await createChatCompletion(prompt);
            } catch (e: unknown) {
                eventSystem.dispatch(e as PipelineError);
                answer =
                    'Ich habe gerade ein technisches Problem und kann dir nicht weiterhelfen. Bitte versuche es nocheinmal.';
            }

            advisory.conversation.push({
                from: advisor.id,
                to: 'human',
                text: answer,
                language: event.language,
            });

            advisoryRepository.save(advisory);

            let audio: string;
            let audioType: 'audio/wav' | 'audio/mpeg';

            switch (advisor.voiceSystem) {
                case 'aws-polly':
                    audio = (await textToSpeechAwsPolly(answer, advisor.voice)).buffer.toString('base64');
                    audioType = 'audio/wav';
                    break;
                case 'eleven-labs':
                    audio = (await textToSpeechElevenLabs(answer, advisor.voice)).toString('base64');
                    audioType = 'audio/mpeg';
                    break;
                default:
                    throw new Error(`Unknown voice system ${advisor.voiceSystem}`);
            }

            eventSystem.dispatch({
                meta: withTrace(event),
                type: GwaggliEventType.AdvisorAnswer,
                advisorId: advisor.id,
                text: answer,
                audio: audio,
                audioType: audioType,
            });
        } catch (e) {
            console.error(`Failed to transcribe.`, e);
        }
    });
};

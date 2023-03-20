import {EventSystem, PipelineEventType} from "@gwaggli/events";
import {AddAdvisorEvent, DomainEventType, JoinAdvisoryEvent} from "@gwaggli/events/dist/events/domain-events";
import {advisoryRepository} from "../../repository/advisory-repository";
import {PipelineError, TranscriptionComplete} from "@gwaggli/events/dist/events/pipeline-events";
import {createChatCompletion} from "../../integration/openai/open-ai-client";
import {ChatCompletionRequestMessageRoleEnum} from "openai";
import {textToSpeech} from "../../integration/aws/aws-client";

export const registerAdvisoryProcessing = (eventSystem: EventSystem) => {

    eventSystem.on<JoinAdvisoryEvent>(DomainEventType.JoinAdvisory, (event) => {
        let advisory = advisoryRepository.findById(event.advisoryId);
        if (advisory === undefined) {
            advisory = {
                id: event.advisoryId,
                sids: [],
                advisors: [],
                conversation: [],
            }
        }

        advisory.sids.push(event.sid);

        advisoryRepository.save(advisory);
    });

    eventSystem.on<AddAdvisorEvent>(DomainEventType.AddAdvisor, (event) => {
        const advisory = advisoryRepository.findBySid(event.sid)
        if (advisory === undefined) {
            return;
        }

        advisory.advisors.push({
            sid: event.sid,
            id: event.advisorId,
            name: event.name,
            voice: event.voice,
            purpose: event.purpose,
        });

        advisoryRepository.save(advisory)

        console.log(JSON.stringify(advisoryRepository.findAll()))
    });

    eventSystem.on<TranscriptionComplete>(PipelineEventType.TranscriptionComplete, async (event) => {
        const advisory = advisoryRepository.findBySid(event.sid);


        if (advisory === undefined) {
            return;
        }

        const advisor = advisory.advisors.find((advisor) => advisor.sid === event.sid);

        console.log(advisor)

        if (advisor === undefined) {
            return;
        }

        advisory.conversation.push({
            from: 'human',
            to: advisor.id,
            text: event.text,
            language: event.language,
        })

        advisoryRepository.save(advisory)


        let answer;
        try {
            answer = await createChatCompletion(event.sid,
                [
                    {
                        role: "system",
                        content: advisor.purpose
                    },
                    ...advisory.conversation
                        .filter(e => e.to === advisor.id || e.from === advisory.id)
                        .map((conversationEntry) => {
                            return {
                                role: conversationEntry.from === 'human' ?
                                    ChatCompletionRequestMessageRoleEnum.User :
                                    ChatCompletionRequestMessageRoleEnum.Assistant,
                                content: conversationEntry.text,
                            }
                        })
                ])

        } catch (e: unknown) {
            eventSystem.dispatch(e as PipelineError)
            answer = "Ich habe gerade ein technisches Problem und kann dir nicht weiterhelfen. Bitte versuche es nocheinmal."
        }

        advisory.conversation.push({
            from: advisor.id,
            to: 'human',
            text: answer,
            language: event.language,
        })

        advisoryRepository.save(advisory)

        const audio = await textToSpeech(answer, advisor.voice);

        eventSystem.dispatch({
            type: DomainEventType.AdvisorAnswer,
            subsystem: "domain",
            sid: event.sid,
            timestamp: Date.now(),
            advisorId: advisor.id,
            text: answer,
            audio: audio.buffer.toString('base64'),
        });
    });
}
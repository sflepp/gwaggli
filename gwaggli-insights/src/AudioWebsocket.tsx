import useWebSocket from "react-use-websocket";
import ConnectionStatus from "./ui-components/connection-status";
import Microphone from "./ui-components/microphone";
import {dispatch} from "./event-system/event-system";
import {AudioChunk, ClientEventType} from "./event-system/events/client-events";

const WS_URL = "ws://localhost:8001";

const encodeBase64 = (arrayBuffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

const AudioWebsocket = () => {
    const {sendMessage, readyState} = useWebSocket(WS_URL, {
        onOpen: () => console.log("opened"),
        onMessage: (event) => {
            dispatch(JSON.parse(event.data))
        },
    })

    const createMessageAndSend = (data: ArrayBuffer) => {
        const message: AudioChunk = {
            type: ClientEventType.AudioChunk,
            sid: '',
            subsystem: "client",
            timestamp: Date.now(),
            audio: encodeBase64(data)
        }

        sendMessage(JSON.stringify(message));
    }

    return (<>
            <ConnectionStatus readyState={readyState}></ConnectionStatus>
            <Microphone onAudioData={createMessageAndSend}></Microphone>
        </>
    )
}

export default AudioWebsocket;
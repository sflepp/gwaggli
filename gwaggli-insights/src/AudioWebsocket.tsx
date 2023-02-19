import useWebSocket from "react-use-websocket";
import ConnectionStatus from "./ui-components/connection-status";
import Microphone from "./ui-components/microphone";
import {AudioChunkMessage} from "./dto/messages";

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
        onMessage: (event) => console.log("message", JSON.parse(event.data)),
    })

    const createMessageAndSend = (data: ArrayBuffer) => {
        const message: AudioChunkMessage = {
            type: 'audio-chunk',
            data: encodeBase64(data)
        }

        sendMessage(JSON.stringify(message));
    }

    return (<div>
            <ConnectionStatus readyState={readyState}></ConnectionStatus>
            <Microphone onAudioData={createMessageAndSend}></Microphone>
        </div>
    )
}

export default AudioWebsocket;
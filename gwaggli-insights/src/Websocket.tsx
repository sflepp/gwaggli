import useWebSocket from "react-use-websocket";
import ConnectionStatus from "./ui-components/connection-status";
import Microphone from "./ui-components/microphone";

const WS_URL = "ws://localhost:8001";

const WebSocket = () => {
    const {sendMessage, readyState} = useWebSocket(WS_URL, {
        onOpen: () => console.log("opened"),
        onMessage: (event) => console.log("message", JSON.parse(event.data)),
    })

    return (<div>
            <ConnectionStatus readyState={readyState}></ConnectionStatus>
            <Microphone onAudioData={sendMessage}></Microphone>
        </div>
    )
}

export default WebSocket;
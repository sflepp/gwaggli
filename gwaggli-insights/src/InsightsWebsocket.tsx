import useWebSocket from "react-use-websocket";
import ConnectionStatus from "./ui-components/connection-status";

const WS_URL = "ws://localhost:8002";
const InsightsWebsocket = () => {
    const {readyState} = useWebSocket(WS_URL, {
        onOpen: () => console.log("opened"),
        onMessage: (event) => console.log("message", JSON.parse(event.data)),
    })

    return (<div>
            <ConnectionStatus readyState={readyState}></ConnectionStatus>
        </div>
    )
}

export default InsightsWebsocket;
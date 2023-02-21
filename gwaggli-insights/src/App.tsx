import React from 'react';
import './App.css';
import Home from "./pages/home/Home";
import useWebSocket from "react-use-websocket";

function App() {

  useWebSocket("ws://localhost:8002", {
    onOpen: () => console.log("opened"),
    onMessage: (event) => {
      console.log(JSON.parse(event.data))
    }
  })

  return (
      <Home></Home>
  );
}

export default App;

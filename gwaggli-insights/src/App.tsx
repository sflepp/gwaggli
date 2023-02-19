import React from 'react';
import './App.css';
import AudioWebsocket from "./AudioWebsocket";
import InsightsWebsocket from "./InsightsWebsocket";

function App() {
  return (
    <div className="App">
      <AudioWebsocket></AudioWebsocket>
      <InsightsWebsocket></InsightsWebsocket>
    </div>
  );
}

export default App;

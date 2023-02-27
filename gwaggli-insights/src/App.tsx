import React from 'react';
import './App.css';
import Home from "./pages/home/Home";
import useWebSocket from "react-use-websocket";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Chat from "./pages/chat/Chat";
import AppLayout from "./pages/AppLayout";

export default function App() {

  useWebSocket("ws://localhost:8888", {
    onOpen: () => console.log("opened"),
    onMessage: (event) => {
      console.log(JSON.parse(event.data))
    }
  })

  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="chat" element={<Chat />} />
          </Route>
        </Routes>
      </BrowserRouter>
  );
}

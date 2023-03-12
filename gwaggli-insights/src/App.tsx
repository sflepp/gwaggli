import React from 'react';
import './App.css';
import Home from "./pages/home/Home";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Chat from "./pages/chat/Chat";
import AppLayout from "./pages/AppLayout";
import Copilot from "./pages/copilot/Copilot";
import Debugger from "./pages/debugger/Debugger";

export default function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="chat" element={<Chat />} />
            <Route path="copilot" element={<Copilot />} />
            <Route path="debugger" element={<Debugger />} />
          </Route>
        </Routes>
      </BrowserRouter>
  );
}

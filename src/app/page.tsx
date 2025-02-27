"use client";

import DocsChat from "@/components/chat/chat-interface";
import React, { useState } from "react";
import { Spotlight } from "../components/ui/spotlight";
import Navbar from "@/components/ui/navbar";

export default function Home() {
  const [showChat, setShowChat] = useState(false);

  const handleChatClick = () => {
    setShowChat(true);
  };

  if (showChat) {
    return (
      <>
        <Navbar onChatClick={handleChatClick} />{" "}
        {/* Pass the onChatClick prop */}
        <DocsChat />
      </>
    );
  }

  return (
    <>
      <Navbar onChatClick={handleChatClick} /> {/* Pass the onChatClick prop */}
      <div className="min-h-screen w-full rounded-md flex md:items-center md:justify-center bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="white"
        />
        <div className="p-4 max-w-7xl mx-auto relative z-10 w-full pt-20 md:pt-0">
          <h1 className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
            Ask your <br /> Documentation.
          </h1>
          <p className="mt-4 font-normal text-base text-neutral-300 max-w-lg text-center mx-auto">
            Get instant answers from your documentation using AI. Our
            RAG-powered architecture processes the context from your uploaded
            documentation to deliver the most relevant answers possible.
          </p>
          <div className="flex justify-center mt-6">
            <button
              className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
              onClick={() => setShowChat(true)}
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                Start Chatting
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-0 w-full py-4 text-center text-neutral-400 text-sm">
          <div className="flex flex-col gap-2">
            <div className="flex justify-center space-x-4">
              <a
                href="https://github.com/deep-poharkar"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/deep-poharkar"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="mailto:deeppoharkar21@gmail.com"
                className="hover:text-white transition-colors"
              >
                Email
              </a>
            </div>
            <div>
              © {new Date().getFullYear()} Clarify. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

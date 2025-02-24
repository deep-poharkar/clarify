"use client";

import Image from "next/image";
import DocsChat from "@/components/chat/chat-interface";
import React, { useState } from "react";
import { Spotlight } from "../components/ui/spotlight";
import Navbar from "@/components/ui/navbar";

export default function Home() {
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return (
      <>
        <Navbar />
        <DocsChat />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen w-full rounded-md flex md:items-center md:justify-center bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="white"
        />
        <div className="p-4 max-w-7xl mx-auto relative z-10 w-full pt-20 md:pt-0">
          <h1 className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
            Ask your <br /> documentation.
          </h1>
          <p className="mt-4 font-normal text-base text-neutral-300 max-w-lg text-center mx-auto">
            Ask your documentation. Get instant answers from your documentation
            using AI.
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
      </div>
    </>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Upload, Plus } from "lucide-react";

const DocsChat = () => {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: "Welcome! Start by adding some documentation below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [docInput, setDocInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDocInput, setShowDocInput] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle doc submission
  const handleDocSubmit = async () => {
    if (!docInput.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: docInput }),
      });

      if (response.ok) {
        setDocInput("");
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: "Documentation added successfully!",
          },
        ]);
      }
    } catch (error) {
      console.error("Error ingesting doc:", error);
    }
    setIsLoading(false);
  };

  // Handle chat message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body.getReader();
      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantMessage += new TextDecoder().decode(value);
        setMessages((prev) => [
          ...prev.slice(0, -1),
          userMessage,
          { role: "assistant", content: assistantMessage },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    }
    setIsLoading(false);
  };

  // Landing page section when no messages
  if (messages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-4xl font-bold mb-6">
            Documentation Chat Assistant
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Get instant answers from your documentation using AI
          </p>
          <Button
            size="lg"
            onClick={() =>
              setMessages([
                {
                  role: "system",
                  content: "Welcome! Start by adding some documentation below.",
                },
              ])
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            Start Chatting
            <MessageSquare className="ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Remove the initial landing page condition since we're handling it in page.tsx
  // Remove the initial empty messages check since we're initializing with a welcome message
  return (
    <div className="min-h-screen bg-black/[0.96] p-4 pt-24">
      <div className="max-w-4xl mx-auto p-4 grid gap-4">
        {/* Collapsible Documentation Input */}
        {showDocInput && (
          <Card className="bg-slate-950 text-white border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Documentation</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDocInput(false)}
                className="text-gray-400 hover:text-white text-2xl w-8 h-8"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Textarea
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  placeholder="Paste documentation content here..."
                  className="min-h-[100px] bg-slate-900 border-gray-800"
                />
                <Button
                  onClick={handleDocSubmit}
                  disabled={isLoading || !docInput.trim()}
                  className="self-end bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="mr-2" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Messages */}
        <Card className="bg-slate-950 text-white border-gray-800">
          <CardContent className="p-4">
            <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-900 ml-12"
                      : msg.role === "system"
                      ? "bg-slate-800 text-center"
                      : "bg-slate-800 mr-12"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input with Add Doc Button */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Button
                type="button"
                onClick={() => setShowDocInput(true)}
                className="bg-slate-800 hover:bg-slate-700 rounded-full w-10 h-10 p-0 flex items-center justify-center"
              >
                <Plus size={20} />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoading}
                className="bg-slate-900 border-gray-800"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="mr-2" />
                Send
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocsChat;

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Send,
  Upload,
  Plus,
  X,
  Link as LinkIcon,
  File,
  Text,
  UploadCloud,
} from "lucide-react";

const DocsChat = () => {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: "Welcome! Start by adding some documentation below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [docInput, setDocInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [batchUrls, setBatchUrls] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDocInput, setShowDocInput] = useState(false);
  const [activeTab, setActiveTab] = useState("text");
  const [uploadStatus, setUploadStatus] = useState({ success: 0, failed: 0 });
  const [showStatus, setShowStatus] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset upload status
  const resetUploadStatus = () => {
    setUploadStatus({ success: 0, failed: 0 });
    setShowStatus(false);
  };

  // Display status message
  const displayStatusMessage = (success, total) => {
    setUploadStatus({ success, failed: total - success });
    setShowStatus(true);
    setTimeout(() => setShowStatus(false), 5000);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  // Remove file from selection
  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle text document submission (original functionality)
  const handleDocSubmit = async () => {
    if (!docInput.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: docInput,
          metadata: { source: "manual-input" },
        }),
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
        displayStatusMessage(1, 1);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: "Failed to add documentation.",
          },
        ]);
        displayStatusMessage(0, 1);
      }
    } catch (error) {
      console.error("Error ingesting doc:", error);
      displayStatusMessage(0, 1);
    }
    setIsLoading(false);
  };

  // Handle URL submission
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/ingest-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });

      if (response.ok) {
        setUrlInput("");
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `Content from URL added successfully!`,
          },
        ]);
        displayStatusMessage(1, 1);
      } else {
        const errorData = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `Failed to add URL: ${errorData.error || "Unknown error"}`,
          },
        ]);
        displayStatusMessage(0, 1);
      }
    } catch (error) {
      console.error("Error ingesting URL:", error);
      displayStatusMessage(0, 1);
    }
    setIsLoading(false);
  };

  // Handle file uploads
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsLoading(true);
    let successCount = 0;

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/ingest-file", {
          method: "POST",
          body: formData,
        });

        if (response.ok) successCount++;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Processed ${successCount} of ${selectedFiles.length} files.`,
        },
      ]);

      displayStatusMessage(successCount, selectedFiles.length);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error uploading files:", error);
      displayStatusMessage(successCount, selectedFiles.length);
    }
    setIsLoading(false);
  };

  // Handle batch URL submission
  const handleBatchUrlSubmit = async () => {
    if (!batchUrls.trim()) return;

    const urls = batchUrls.split("\n").filter((url) => url.trim());
    if (urls.length === 0) return;

    setIsLoading(true);
    let successCount = 0;

    try {
      for (const url of urls) {
        const response = await fetch("/api/ingest-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        if (response.ok) successCount++;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Processed ${successCount} of ${urls.length} URLs.`,
        },
      ]);

      displayStatusMessage(successCount, urls.length);
      setBatchUrls("");
    } catch (error) {
      console.error("Error processing batch URLs:", error);
      displayStatusMessage(successCount, urls.length);
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
      // Only send recent context to avoid token limits
      const recentMessages = messages.slice(-5); // Keep last 5 messages for context
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...recentMessages, userMessage],
          query: input // Send the actual query separately
        }),
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
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent>
              {showStatus && (
                <div
                  className={`mb-4 p-3 rounded-md ${
                    uploadStatus.failed > 0
                      ? "bg-red-950/50 text-red-300"
                      : "bg-green-950/50 text-green-300"
                  }`}
                >
                  {uploadStatus.success > 0 && (
                    <p>
                      ✓ {uploadStatus.success} document(s) successfully
                      processed
                    </p>
                  )}
                  {uploadStatus.failed > 0 && (
                    <p>✗ {uploadStatus.failed} document(s) failed to process</p>
                  )}
                </div>
              )}

              <Tabs
                defaultValue="text"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 mb-4 bg-slate-900">
                  <TabsTrigger
                    value="text"
                    className="data-[state=active]:bg-slate-800"
                  >
                    <Text className="mr-2 h-4 w-4" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger
                    value="url"
                    className="data-[state=active]:bg-slate-800"
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger
                    value="file"
                    className="data-[state=active]:bg-slate-800"
                  >
                    <File className="mr-2 h-4 w-4" />
                    Files
                  </TabsTrigger>
                  <TabsTrigger
                    value="batch"
                    className="data-[state=active]:bg-slate-800"
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Batch
                  </TabsTrigger>
                </TabsList>

                {/* Text Input */}
                <TabsContent value="text">
                  <div className="flex flex-col gap-2">
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
                      Add Text
                    </Button>
                  </div>
                </TabsContent>

                {/* URL Input */}
                <TabsContent value="url">
                  <div className="flex flex-col gap-2">
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="Enter URL to documentation (e.g., https://docs.example.com/api)"
                      className="bg-slate-900 border-gray-800"
                    />
                    <Button
                      onClick={handleUrlSubmit}
                      disabled={isLoading || !urlInput.trim()}
                      className="self-end bg-blue-600 hover:bg-blue-700"
                    >
                      <LinkIcon className="mr-2" />
                      Fetch URL
                    </Button>
                  </div>
                </TabsContent>

                {/* File Upload */}
                <TabsContent value="file">
                  <div className="flex flex-col gap-4">
                    <div className="border-2 border-dashed border-gray-800 rounded-lg p-6 text-center bg-slate-900/50">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current.click()}
                        className="bg-transparent border-gray-600 hover:bg-slate-800"
                      >
                        <File className="mr-2" />
                        Choose Files
                      </Button>
                      <p className="text-gray-500 mt-2">
                        Supports TXT, MD, JSON files
                      </p>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium">
                          Selected Files ({selectedFiles.length})
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-slate-900 p-2 rounded"
                            >
                              <span className="truncate">{file.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFile(index)}
                                className="text-gray-400 hover:text-white"
                              >
                                <X size={16} />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={handleFileUpload}
                          disabled={isLoading}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Upload className="mr-2" />
                          Upload {selectedFiles.length} File
                          {selectedFiles.length > 1 ? "s" : ""}
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Batch URL Upload */}
                <TabsContent value="batch">
                  <div className="flex flex-col gap-2">
                    <Textarea
                      value={batchUrls}
                      onChange={(e) => setBatchUrls(e.target.value)}
                      placeholder="Enter multiple URLs, one per line"
                      className="min-h-[100px] bg-slate-900 border-gray-800"
                    />
                    <p className="text-xs text-gray-500">
                      Enter one URL per line to process multiple documentation
                      pages at once.
                    </p>
                    <Button
                      onClick={handleBatchUrlSubmit}
                      disabled={isLoading || !batchUrls.trim()}
                      className="self-end bg-blue-600 hover:bg-blue-700"
                    >
                      <UploadCloud className="mr-2" />
                      Process URLs
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
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

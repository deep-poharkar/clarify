import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Send } from "lucide-react";

interface MessageInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setShowDocInput: React.Dispatch<React.SetStateAction<boolean>>;
}

const MessageInput: React.FC<MessageInputProps> = ({
  input,
  setInput,
  isLoading,
  handleSubmit,
  setShowDocInput,
}) => {
  return (
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
  );
};

export default MessageInput;

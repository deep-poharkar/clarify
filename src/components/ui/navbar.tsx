import React from "react";
import Link from "next/link";
import { Github } from "lucide-react";

interface NavbarProps {
  onChatClick: () => void;
}

const Navbar = ({ onChatClick }: NavbarProps) => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-950/50 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-white">
              Clarify
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            <button
              onClick={onChatClick}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Chat
            </button>
            <a
              href="https://github.com/yourusername/documate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <Github size={20} />
              Star on GitHub
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

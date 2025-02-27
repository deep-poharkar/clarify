# Clarify - Your Personal Documentation Assistant

Clarify is your junior engineer powered by RAG (Retrieval Augmented Generation) that helps you chat with your documentation. It understands context, remembers previous conversations, and provides accurate answers based on your documents. Think of it as having a knowledgeable team member who's read all your documentation and is ready to help 24/7.

## Features

- **Smart Document Processing**

  - Upload documents (TXT, MD, JSON)
  - Process URLs and web content
  - Automatic document chunking for optimal processing

- **Intelligent Search & Retrieval**

  - Vector-based semantic search
  - Context-aware responses
  - Source attribution and relevance scoring

- **Modern Interface**
  - Real-time chat interface
  - Multi-format document upload
  - Upload status tracking
  - Dark mode UI

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **AI**: Google's Gemini Pro API
- **Vector Database**: AstraDB
- **Data Processing**: RAG (Retrieval Augmented Generation)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/deep-poharkar/clarify.git
```

```bash
npm install
```

```bash
GEMINI_API_KEY=your_gemini_api_key
ASTRA_DB_TOKEN=your_astra_token
ASTRA_DB_ENDPOINT=your_astra_endpoint
ASTRA_DB_KEYSPACE=your_keyspace
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Upload Documentation

   - Use the upload button to add documents
   - Paste URLs to process web content
   - Enter text directly in the input field

2. Ask Questions

   - Type your question in the chat
   - Get contextually relevant answers
   - View source references in responses

3. Manage Documents

   - View uploaded documents
   - Delete outdated content
   - Monitor upload status

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Next.js
- UI components from shadcn/ui
- Vector search powered by AstraDB
- AI capabilities by Google Gemini

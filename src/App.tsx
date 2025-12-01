import React, { useState, useEffect } from "react";
import axios from "axios";

const App: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<string>("Starting...");

  useEffect(() => {
    const startBackend = async () => {
      try {
        const { Command } = await import('@tauri-apps/plugin-shell');
        const command = Command.sidecar('backend_server');

        const child = await command.spawn();
        console.log('Backend started with PID:', child.pid);
        setBackendStatus(`Running (PID: ${child.pid})`);

        // Wait a bit for backend to be ready
        setTimeout(() => {
          testBackendConnection();
        }, 2000);
      } catch (err) {
        console.error('Failed to start backend sidecar:', err);
        setBackendStatus(`Error: ${err}`);
      }
    };
    startBackend();
  }, []);

  const testBackendConnection = async () => {
    try {
      await axios.post("http://127.0.0.1:5001/api/chat", {
        prompt: "Hello"
      });
      setBackendStatus("Connected ✓");
    } catch (err) {
      setBackendStatus("Backend not ready yet...");
    }
  };

  const fetchLLMDemo = async () => {
    if (!prompt) {
      setError("Please enter a prompt");
      return;
    }

    const demoData = {
      prompt: prompt
    };

    try {
      setLoading(true);
      setError(null);
      const res = await axios.post("http://127.0.0.1:5001/api/chat", demoData);
      setResponse(res.data);
    } catch (err: any) {
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            🧠 Glancer - LLM Chat
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Backend:</span>
            <span className={`text-xs px-3 py-1 rounded-full ${backendStatus.includes('Connected') ? 'bg-green-100 text-green-700' :
              backendStatus.includes('Error') ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
              {backendStatus}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Enter a prompt to test your local LLM backend and see the response.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchLLMDemo()}
          />
          <button
            onClick={fetchLLMDemo}
            disabled={loading}
            className={`px-6 py-3 rounded-lg transition font-medium ${loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
              }`}
          >
            {loading ? 'Loading...' : 'Send'}
          </button>
        </div>

        <div className="mt-6">
          {loading && (
            <div className="flex items-center gap-2 text-indigo-600">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing your request...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 font-medium">❌ {error}</p>
            </div>
          )}

          {response && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Response:</h3>
              <pre className="bg-white p-4 rounded-lg text-sm text-gray-800 overflow-x-auto border border-gray-200">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}

          {!loading && !error && !response && (
            <div className="text-center text-gray-400 py-8">
              <p>Enter a prompt above to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

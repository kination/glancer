import React, { useState } from "react";
import axios from "axios";

const App: React.FC = () => {
  // const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // const fetchData = async () => {
  //   if (!url) return;
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     const res = await axios.get(url);
  //     setResponse(res.data);
  //   } catch (err: any) {
  //     setError(err.message || "Error fetching data");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchLLMDemo = async () => {
    const demoData = {
      prompt: prompt
    }
    try {
      const res = await axios.post("http://127.0.0.1:5001/api/chat", demoData)
      // console.log(res)
      setResponse(res.data);
    } catch (err: any) {
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
    
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          🧠 Prompt Tester with local LLM
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter prompt to fetch and display the JSON response.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="Prompt message"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            onClick={fetchLLMDemo}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            Fetch
          </button>
        </div>

        <div className="mt-6">
          {loading && <p className="text-gray-500">Loading...</p>}
          {error && <p className="text-red-500 font-medium">❌ {error}</p>}
          {response && (
            <pre className="mt-4 bg-gray-100 p-4 rounded-lg text-sm text-gray-800 overflow-x-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

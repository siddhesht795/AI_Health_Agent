import React, { useState } from "react";
import "./App.css";
import { Modal, CircularProgress, Alert } from "@mui/material";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [reportText, setReportText] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [testData, setTestData] = useState(null);
  const [insight, setInsight] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [error, setError] = useState(null);

  const handlePdfChange = (e) => {
    setPdfFile(e.target.files[0]);
    setError(null);
  };

  const handleExtractPdf = async () => {
    if (!pdfFile) {
      setError("Please select a PDF file first");
      return;
    }

    setExtracting(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      const res = await fetch("http://localhost:5000/api/extract_pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to extract PDF");
      }

      const data = await res.json();
      setReportText(data.text || "");
    } catch (err) {
      setError(err.message);
      setReportText("");
    } finally {
      setExtracting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!reportText) {
      setError("Please extract text from PDF first");
      return;
    }
    if (!name || !age) {
      setError("Please provide your name and age");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:5000/api/analyze_report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportText,
          userProfile: {
            name,
            age: Number(age),
            gender,
            medicalHistory: medicalHistory.split(",").map((h) => h.trim()).filter(h => h),
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to analyze report");
      }

      const data = await res.json();
      setTestData(data.testData || {});
      setInsight(data.insight || "");
    } catch (err) {
      setError(err.message);
      setTestData(null);
      setInsight("");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const newMessage = { role: "user", content: chatInput };
    setChatMessages([...chatMessages, newMessage]);
    setChatInput("");
    setError(null);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatInput,
          testData,
          userProfile: {
            name,
            age: Number(age),
            gender,
            medicalHistory: medicalHistory.split(",").map((h) => h.trim()).filter(h => h),
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await res.json();
      setChatMessages(msgs => [
        ...msgs,
        { role: "assistant", content: data.response }
      ]);
    } catch (err) {
      setError(err.message);
      setChatMessages(msgs => [
        ...msgs,
        { role: "assistant", content: "Sorry, I couldn't process your request." }
      ]);
    }
  };

  return (
    <div className="main-container">
      <h1 className="main-title">🩺 AI Health Report Decoder</h1>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="main-paper">
        {/* PDF Upload */}
        <div className="section">
          <h2 className="section-title">Upload your health report PDF</h2>
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfChange}
            style={{ marginBottom: "1rem" }}
          />
          <button
            className="extract-btn"
            onClick={handleExtractPdf}
            disabled={!pdfFile || extracting}
          >
            {extracting ? "Extracting..." : "Extract PDF"}
          </button>
        </div>

        {/* User Profile */}
        {reportText && (
          <div className="section">
            <h2 className="section-title">👤 Enter Your Profile</h2>
            <div className="profile-row">
              <input
                className="profile-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
              />
              <input
                className="profile-input"
                type="number"
                value={age}
                min={0}
                max={120}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
              />
              <select
                className="profile-input"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <input
              className="profile-input"
              type="text"
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="Medical History (comma-separated)"
              style={{ width: "100%", marginTop: "1rem" }}
            />
            <button
              className="analyze-btn"
              onClick={handleAnalyze}
              disabled={analyzing || !name || !age}
            >
              {analyzing ? "Analyzing..." : "🧠 Analyze Report"}
            </button>
          </div>
        )}

        {/* Results */}
        {testData && (
          <>
            <div className="section">
              <h2 className="result-title">📊 Extracted Test Values</h2>
              <div className="test-values-box">
                <pre style={{ margin: 0 }}>{JSON.stringify(testData, null, 2)}</pre>
              </div>
            </div>
            <div className="section">
              <h2 className="result-title">💡 Insight from Gemini</h2>
              <div className="insight-box">{insight}</div>
            </div>
          </>
        )}

        {/* Chat Interface */}
        <div className="section" style={{ marginTop: "2rem" }}>
          <h2 className="section-title">💬 Ask Anything About Your Report</h2>
          <div className="chat-box">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={msg.role === "user" ? "chat-msg user" : "chat-msg assistant"}
              >
                <span className={msg.role === "user" ? "chat-user" : "chat-assistant"}>
                  {msg.role === "user" ? "You: " : "Assistant: "}
                  {msg.content}
                </span>
              </div>
            ))}
          </div>
          <div className="chat-row">
            <input
              className="chat-input"
              type="text"
              placeholder="Ask a question"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleChatSend();
              }}
              disabled={!testData}
            />
            <button
              className="send-btn"
              onClick={handleChatSend}
              disabled={!chatInput.trim() || !testData}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Loading Modals */}
      <Modal open={extracting}>
        <div className="modal-box">
          <CircularProgress color="secondary" />
          <div className="modal-text">Extracting text from PDF...</div>
        </div>
      </Modal>
      <Modal open={analyzing}>
        <div className="modal-box">
          <CircularProgress color="secondary" />
          <div className="modal-text">Analyzing your report...</div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
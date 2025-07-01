import React, { useState } from "react";
import "./App.css";
import { Modal, CircularProgress, Alert } from "@mui/material";
import ReactMarkdown from "react-markdown";

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

  const [showProfile, setShowProfile] = useState(false);
  const [showResults, setShowResults] = useState(false);

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
      setShowProfile(false);
      setShowResults(false);

      // Try to auto-fill profile fields by analyzing the report text
      if (data.text) {
        setAnalyzing(true);
        const analyzeRes = await fetch("http://localhost:5000/api/analyze_report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportText: data.text,
            userProfile: {},
          }),
        });
        if (analyzeRes.ok) {
          const analyzeData = await analyzeRes.json();
          // Auto-fill profile fields if backend provides them
          if (analyzeData.userProfile) {
            setName(analyzeData.userProfile.name || "");
            setAge(analyzeData.userProfile.age || "");
            setGender(analyzeData.userProfile.gender || "Male");
            setMedicalHistory(
              Array.isArray(analyzeData.userProfile.medicalHistory)
                ? analyzeData.userProfile.medicalHistory.join(", ")
                : ""
            );
          } else {
            setName("");
            setAge("");
            setGender("Male");
            setMedicalHistory("");
          }
          setTestData(analyzeData.testData || {});
          setInsight(analyzeData.insight || "");
          setTimeout(() => setShowProfile(true), 200);
          setTimeout(() => setShowResults(true), 600);
        } else {
          setTestData(null);
          setInsight("");
        }
        setAnalyzing(false);
      }
    } catch (err) {
      setError(err.message);
      setReportText("");
      setTestData(null);
      setInsight("");
      setAnalyzing(false);
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
      setShowResults(false);
      setTimeout(() => setShowResults(true), 200);
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
      <h1 className="main-title animate-fadein">🩺 AI Health Report Decoder</h1>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} className="animate-fadein">
          {error}
        </Alert>
      )}

      <div className="main-paper animate-fadein">
        {/* PDF Upload */}
        <div className="section animate-slidein">
          <h2 className="section-title">Upload your health report PDF</h2>
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfChange}
            style={{ marginBottom: "1rem" }}
          />
          <button
            className="extract-btn animate-btn"
            onClick={handleExtractPdf}
            disabled={!pdfFile || extracting}
          >
            {extracting ? "Extracting..." : "Extract PDF"}
          </button>
        </div>

        {/* User Profile */}
        {reportText && (
          <div className={`section animate-fadein ${showProfile ? "visible" : "hidden"}`}>
            <h2 className="section-title">👤 Enter Your Profile</h2>
            <div className="profile-row">
              <input
                className="profile-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                style={{ background: "#fff5f7" }}
              />
              <input
                className="profile-input"
                type="number"
                value={age}
                min={0}
                max={120}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
                style={{ background: "#fff5f7" }}
              />
              <select
                className="profile-input"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{ background: "#fff5f7" }}
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
              style={{ width: "100%", marginTop: "1rem", background: "#fff5f7" }}
            />
            <button
              className="analyze-btn animate-btn"
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
            <div className={`section animate-fadein ${showResults ? "visible" : "hidden"}`}>
              <h2 className="result-title">📊 Extracted Test Values</h2>
              <div className="test-values-box">
                <table className="test-table">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(testData).map(([key, value]) => (
                      <tr key={key}>
                        <td>{key}</td>
                        <td>{typeof value === "object" && value !== null
                          ? `${value.value} ${value.unit || ""}`.trim()
                          : value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ✅ Gemini Insight with Markdown */}
            <div className={`section animate-fadein ${showResults ? "visible" : "hidden"}`}>
              <h2 className="result-title">💡 Insight from Gemini</h2>
              <div className="insight-box">
                <ReactMarkdown>{insight}</ReactMarkdown> {/* Markdown rendering here */}
              </div>
            </div>
          </>
        )}

        {/* ✅ Chat Box with Markdown in assistant messages */}
        <div className="section animate-fadein" style={{ marginTop: "2rem" }}>
          <h2 className="section-title">💬 Ask Anything About Your Report</h2>
          <div className="chat-box">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={msg.role === "user" ? "chat-msg user" : "chat-msg assistant"}
              >
                <div className={msg.role === "user" ? "chat-user" : "chat-assistant"}>
                  <strong>{msg.role === "user" ? "You: " : "Assistant: "}</strong>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
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
              style={{ background: "#fff5f7" }}
            />
            <button
              className="send-btn animate-btn"
              onClick={handleChatSend}
              disabled={!chatInput.trim() || !testData}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Loading Indicators */}
      <Modal open={extracting}>
        <div className="modal-box">
          <CircularProgress style={{ color: "#e63946" }} />
          <div className="modal-text">Extracting text from PDF...</div>
        </div>
      </Modal>
      <Modal open={analyzing}>
        <div className="modal-box">
          <CircularProgress style={{ color: "#e63946" }} />
          <div className="modal-text">Analyzing your report...</div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
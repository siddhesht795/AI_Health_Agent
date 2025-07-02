import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import { Modal, CircularProgress, Alert, Snackbar, IconButton } from "@mui/material";
import ReactMarkdown from "react-markdown";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SendIcon from "@mui/icons-material/Send";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { v4 as uuidv4 } from "uuid";

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
  const [loadingChat, setLoadingChat] = useState(false);

  const [showProfile, setShowProfile] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const chatEndRef = useRef(null);
  const [sessionId] = useState(() => uuidv4());

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handlePdfChange = (e) => {
    setPdfFile(e.target.files[0]);
    setError(null);
    showSnackbar("PDF selected. Ready to extract!");
  };

  const showSnackbar = (message) => {
    setSnackbar({ open: true, message });
  };

  const handleExtractPdf = async () => {
    if (!pdfFile) {
      setError("Please select a PDF file first");
      return;
    }

    setExtracting(true);
    setError(null);
    setInsight("");
    setShowResults(false);
    setChatMessages([]);

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
      showSnackbar("PDF extracted! Please review your details.");

      if (data.text) {
        const extractRes = await fetch("http://localhost:5000/api/analyze_report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportText: data.text,
            userProfile: {},
          }),
        });

        if (extractRes.ok) {
          const extractData = await extractRes.json();

          // Auto-fill profile if available in report
          if (extractData.userProfile) {
            setName(extractData.userProfile.name || "");
            setAge(extractData.userProfile.age || "");
            setGender(extractData.userProfile.gender || "Male");
            setMedicalHistory(
              Array.isArray(extractData.userProfile.medicalHistory)
                ? extractData.userProfile.medicalHistory.join(", ")
                : ""
            );
          }

          setTestData(extractData.testData || {});
          setShowProfile(true);
        }
      }
    } catch (err) {
      setError(err.message);
      setReportText("");
      setTestData(null);
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
      setInsight(data.insight || "");
      setShowResults(true);
      showSnackbar("Analysis complete! You can now chat about your report.");
    } catch (err) {
      setError(err.message);
      setInsight("");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || loadingChat) return;

    const userMessage = chatInput.trim();
    const newMessage = { role: "user", content: userMessage };
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput("");
    setError(null);
    setLoadingChat(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          testData,
          userProfile: {
            name,
            age: Number(age),
            gender,
            medicalHistory: medicalHistory.split(",").map(h => h.trim()).filter(h => h),
          },
          sessionId
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await res.json();
      setChatMessages(prev => [
        ...prev,
        { role: "assistant", content: data.response }
      ]);
    } catch (err) {
      setError(err.message);
      setChatMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process your request. Please try again." }
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setExtracting(false);
    setAnalyzing(false);
    setReportText("");
    setName("");
    setAge("");
    setGender("Male");
    setMedicalHistory("");
    setTestData(null);
    setInsight("");
    setChatMessages([]);
    setChatInput("");
    setError(null);
    setShowProfile(false);
    setShowResults(false);
    showSnackbar("Session reset. Ready for a new report!");
  };

  return (
    <div className="main-container">
      <h1 className="main-title animate-fadein">
        🩺 AI Health Report Decoder
        <IconButton
          aria-label="reset"
          onClick={handleReset}
          style={{ float: "right", color: "#e63946" }}
          title="Reset Session"
        >
          <RestartAltIcon />
        </IconButton>
      </h1>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} className="animate-fadein">
          {error}
        </Alert>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />

      <div className="main-paper animate-fadein">
        {/* PDF Upload Section */}
        <div className="section animate-slidein">
          <h2 className="section-title">
            <UploadFileIcon style={{ verticalAlign: "middle", marginRight: 8, color: "#e63946" }} />
            Upload your health report PDF
          </h2>
          <label className="custom-file-upload">
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              style={{ display: "none" }}
            />
            <span>
              {pdfFile ? pdfFile.name : "Choose PDF"}
            </span>
          </label>
          <button
            className="extract-btn animate-btn"
            onClick={handleExtractPdf}
            disabled={!pdfFile || extracting}
          >
            {extracting ? (
              <>
                <CircularProgress size={18} style={{ color: "#fff", marginRight: 8 }} />
                Extracting...
              </>
            ) : (
              <>
                <UploadFileIcon style={{ fontSize: 18, marginRight: 8 }} />
                Extract PDF
              </>
            )}
          </button>
        </div>

        {/* Profile and Extracted Values Section */}
        {reportText && showProfile && (
          <div className="section animate-fadein">
            <h2 className="section-title">👤 Profile Information</h2>
            <div className="profile-row">
              <input
                className="profile-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                autoFocus
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

            {/* Extracted Test Values */}
            {testData && (
              <div className="test-values-box" style={{ marginTop: "1.5rem" }}>
                <h3 style={{ color: "#e63946", marginBottom: "0.5rem" }}>Extracted Test Values</h3>
                <div className="test-values-scroll">
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
            )}

            {/* Analyze Button */}
            <button
              className="analyze-btn animate-btn"
              onClick={handleAnalyze}
              disabled={analyzing || !name || !age}
              style={{ marginTop: "2rem" }}
            >
              {analyzing ? (
                <>
                  <CircularProgress size={18} style={{ color: "#fff", marginRight: 8 }} />
                  Analyzing...
                </>
              ) : (
                <>
                  <SendIcon style={{ fontSize: 18, marginRight: 8 }} />
                  Analyze Report
                </>
              )}
            </button>
          </div>
        )}

        {/* Analysis Results Section */}
        {insight && showResults && (
          <div className="section animate-fadein">
            <h2 className="result-title">💡 Analysis Results</h2>
            <div className="insight-box">
              <ReactMarkdown>{insight}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {insight && (
          <div className="section animate-fadein" style={{ marginTop: "2rem" }}>
            <h2 className="section-title">💬 Ask About Your Report</h2>
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
              {loadingChat && (
                <div className="chat-msg assistant">
                  <div className="chat-assistant">
                    <CircularProgress size={16} style={{ color: "#e63946", marginRight: 8 }} />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-row">
              <input
                className="chat-input"
                type="text"
                placeholder="Ask a question about your report..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                disabled={loadingChat}
              />
              <button
                className="send-btn animate-btn"
                onClick={handleChatSend}
                disabled={!chatInput.trim() || loadingChat}
              >
                <SendIcon />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading Modals */}
      <Modal open={extracting}>
        <div className="modal-box">
          <CircularProgress style={{ color: "#e63946" }} />
          <div className="modal-text">Extracting report data...</div>
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
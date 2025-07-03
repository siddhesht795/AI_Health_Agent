import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import ProfileSection from "./components/ProfileSection.jsx";
import PdfUpload from "./components/PDFUpload.jsx";
import { Modal, CircularProgress, Alert, Snackbar, IconButton } from "@mui/material";
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
      showSnackbar("PDF is being extracted! Please review your details after extracted.");

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
        <PdfUpload
          pdfFile={pdfFile}
          extracting={extracting}
          onPdfChange={handlePdfChange}
          onExtractPdf={handleExtractPdf}
        />

        {reportText && showProfile && (
          <ProfileSection
            name={name}
            setName={setName}
            age={age}
            setAge={setAge}
            gender={gender}
            setGender={setGender}
            medicalHistory={medicalHistory}
            setMedicalHistory={setMedicalHistory}
            analyzing={analyzing}
            onAnalyze={handleAnalyze}
          />
        )}

        <AnalysisResults insight={insight && showResults ? insight : ""} />

        <ChatInterface
          insight={insight}
          chatMessages={chatMessages}
          loadingChat={loadingChat}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleChatSend={handleChatSend}
          chatEndRef={chatEndRef}
        />
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
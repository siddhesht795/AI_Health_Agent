import ReactMarkdown from "react-markdown";
import { CircularProgress } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

const ChatInterface = ({
    insight, chatMessages, loadingChat, chatInput, setChatInput, handleChatSend, chatEndRef
}) => {
    if (!insight) return null;
    return (
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
    );
}

export default ChatInterface;
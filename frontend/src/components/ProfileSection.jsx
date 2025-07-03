import { CircularProgress } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

const ProfileSection = ({
    name, setName, age, setAge, gender, setGender, medicalHistory, setMedicalHistory,
    analyzing, onAnalyze
}) => {
    return (
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
            <button
                className="analyze-btn animate-btn"
                onClick={onAnalyze}
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
    );
}

export default ProfileSection;
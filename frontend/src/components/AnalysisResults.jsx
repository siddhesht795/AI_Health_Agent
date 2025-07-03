import ReactMarkdown from "react-markdown";

const AnalysisResults = ({ insight }) => {
    if (!insight) return null;
    return (
        <div className="section animate-fadein">
            <h2 className="result-title">💡 Analysis Results</h2>
            <div className="insight-box">
                <ReactMarkdown>{insight}</ReactMarkdown>
            </div>
        </div>
    );
}

export default AnalysisResults;
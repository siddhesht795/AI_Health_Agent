import UploadFileIcon from "@mui/icons-material/UploadFile";
import { CircularProgress } from "@mui/material";

const PdfUpload = ({ pdfFile, extracting, onPdfChange, onExtractPdf }) => {
    return (
        <div className="section animate-slidein">
            <h2 className="section-title">
                <UploadFileIcon style={{ verticalAlign: "middle", marginRight: 8, color: "#e63946" }} />
                Upload your health report PDF
            </h2>
            <label className="custom-file-upload">
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={onPdfChange}
                    style={{ display: "none" }}
                />
                <span>
                    {pdfFile ? pdfFile.name : "Choose PDF"}
                </span>
            </label>
            <button
                className="extract-btn animate-btn"
                onClick={onExtractPdf}
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
                        Analyze PDF
                    </>
                )}
            </button>
        </div>
    );
}

export default PdfUpload;
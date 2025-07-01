from extract_pdf import extract_text_from_pdf
from extract_values_chain import get_extract_values_chain
from explain_tests_chain import get_explanation_chain
import json
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/api/extract_pdf", methods=["POST"])
def extract_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    temp_path = "temp.pdf"
    try:
        file.save(temp_path)
        text = extract_text_from_pdf(temp_path)
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route("/api/analyze_report", methods=["POST"])
def analyze_report():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        report_text = data.get("reportText", "")
        user_profile = data.get("userProfile", {})
        
        if not report_text:
            return jsonify({"error": "No report text provided"}), 400
            
        extract_chain = get_extract_values_chain()
        test_data = extract_chain.invoke({"report_text": report_text})
        
        explain_chain = get_explanation_chain()
        explanation = explain_chain.invoke({
            "test_data": test_data,
            "user_profile": user_profile
        })
        
        return jsonify({
            "testData": test_data,
            "insight": explanation.content if hasattr(explanation, "content") else str(explanation)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        user_message = data.get("message", "")
        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2,google_api_key=os.getenv("GOOGLE_GEMINI_API_KEY"))
        try:
            response = llm.invoke(user_message)
        except Exception as llm_exc:
            # Print LLM error for debugging
            print("LLM error:", llm_exc)
            return jsonify({"response": "LLM error Sorry, I couldn't process your request."})

        content = getattr(response, "content", None)
        if not content or not isinstance(content, str) or not content.strip():
            return jsonify({"response": "Sorry, I couldn't process your request."})

        return jsonify({"response": content})
    except Exception as e:
        # Print error for debugging
        print("Chat endpoint error:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
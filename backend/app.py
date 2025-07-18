from extract_values_chain import get_extract_values_chain
from explain_tests_chain import get_explanation_chain
from extract_pdf import extract_text_from_pdf
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime
load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory

app = Flask(__name__)
CORS(app)

user_memories = {}

def get_chat_title(user_profile):
    name = user_profile.get("name", "User")
    age = user_profile.get("age", "?")
    date_str = datetime.now().strftime("%Y-%m-%d")
    return f"{name} - {age} - {date_str}"

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

        chat_title = get_chat_title(user_profile)

        return jsonify({
            "testData": test_data,
            "insight": explanation.content if hasattr(explanation, "content") else str(explanation),
            "chatTitle": chat_title
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        print("Received data:", data)

        user_message = data.get("message", "")
        test_data = data.get("testData", {})
        user_profile = data.get("userProfile", {})
        session_id = data.get("sessionId", "default")
        report_text = data.get("reportText", "")

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # Initialize memory if not exists
        if session_id not in user_memories:
            user_memories[session_id] = ConversationBufferMemory()
        memory = user_memories[session_id]

        context_parts = []
        if user_profile:
            context_parts.append(f"Patient: {user_profile.get('name', '')}")
            context_parts.append(f"Age: {user_profile.get('age', '')}")
            context_parts.append(f"Gender: {user_profile.get('gender', '')}")
            if user_profile.get("medicalHistory"):
                context_parts.append(f"Medical History: {', '.join(user_profile['medicalHistory'])}")

        if test_data:
            test_lines = []
            for test, value in test_data.items():
                if isinstance(value, dict):
                    val = f"{value.get('value', '')} {value.get('unit', '')}".strip()
                else:
                    val = str(value)
                test_lines.append(f"{test}: {val}")
            context_parts.append("Test Results:\n" + "\n".join(test_lines))

        context_str = "\n".join(context_parts)

        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.3,
            google_api_key=os.getenv("GOOGLE_GEMINI_API_KEY")
        )

        conversation = ConversationChain(
            llm=llm,
            memory=memory,
            verbose=True
        )

        full_prompt = f"""
        You are an experienced doctor from the best medical school in the world, help a patient understand their test results.
        keep your response to the point without providing any unnecessary information.
        Dont add any statement which says that you are a doctor, act like you are just an ai health assistant.
        Keep the resonse to the point and dont provide unnecessary information.
        always provide a positive and well wishing response to the user so that the user does not get their morale down.
        You dont need to greet me by saying hellow for example.
        Here's the patient context:
        {context_str}

        Current conversation:
        {memory.buffer if hasattr(memory, 'buffer') else ''}

        Patient question: {user_message}
        Assistant response:"""

        response = conversation.predict(input=full_prompt)

        cleaned_response = response.strip()
        if cleaned_response.startswith('"') and cleaned_response.endswith('"'):
            cleaned_response = cleaned_response[1:-1]

        # Compose chat title: name - age - date
        chat_title = get_chat_title(user_profile)

        return jsonify({
            "response": cleaned_response,
            "sessionId": session_id,
            "chatTitle": chat_title
        })

    except Exception as e:
        print("Chat endpoint error:", str(e))
        return jsonify({
            "error": "Sorry, I couldn't process your request",
            "details": str(e)
        }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
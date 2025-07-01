from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import Runnable
from dotenv import load_dotenv
import os

load_dotenv()

def get_explanation_chain():
    prompt = PromptTemplate.from_template("""
You are a highly knowledgeable yet friendly medical assistant. Based on the following **blood test results** and the **user's profile**, analyze the report and explain the findings clearly.

### What you must include:
1. For each test with abnormal values, explain what it typically measures.
2. Mention if the value is **too high**, **too low**, or **normal**, and what that might mean.
3. Suggest possible medical conditions or causes if the value is abnormal.
4. Recommend practical advice or follow-up (like retesting, diet changes, consulting a doctor, etc.).
5. Keep the language simple, empathetic, and suitable for a non-medical person.

### Do NOT:
- Do not return markdown, hashes, stars, or formatting.
- Do not include code blocks or JSON.
- Do not return generic messages like "I'm an AI language model..."

### User Profile:
{user_profile}

### Test Results:
{test_data}

Now give the explanation in clear human language:
""")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.4,
        google_api_key=os.getenv("GOOGLE_GEMINI_API_KEY")
    )

    return prompt | llm

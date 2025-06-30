from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import Runnable
from dotenv import load_dotenv
import os

load_dotenv()

def get_explanation_chain():
    prompt = PromptTemplate.from_template("""
You are a medical assistant.

Given the following blood test results and a user's profile, explain what they might mean in plain English. 
If anything is abnormal, suggest possible causes or what actions to take.

User Profile:
{user_profile}

Test Results:
{test_data}
""")

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash",
                                 temperature=0.4,
                                 google_api_key=os.getenv("GOOGLE_GEMINI_API_KEY")
                                 )
    return prompt | llm
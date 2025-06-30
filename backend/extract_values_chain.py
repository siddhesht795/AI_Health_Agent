from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import Runnable
from dotenv import load_dotenv
import os

load_dotenv()

def get_extract_values_chain():
    prompt = PromptTemplate.from_template("""
You are a medical assistant. Extract test values from the following report and return a structured JSON.

Example format:
{{
  "WBC": {{ "value": ..., "unit": "..." }},
  "HGB": {{ "value": ..., "unit": "..." }},
  ...
}}

Report:
--------------------
{report_text}
--------------------
Only include values mentioned. Don't guess or add extra.
"""
    )

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash",
                                 temperature=0.2,
                                 google_api_key=os.getenv("GOOGLE_GEMINI_API_KEY"))
    parser = JsonOutputParser()

    chain = prompt | llm | parser
    return chain
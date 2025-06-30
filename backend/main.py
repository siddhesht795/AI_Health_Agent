from extract_pdf import extract_text_from_pdf
from extract_values_chain import get_extract_values_chain
from explain_tests_chain import get_explanation_chain
import json

# Step 1: Extract raw text from PDF
pdf_path = "data/RAMCHANDRA.pdf"
report_text = extract_text_from_pdf(pdf_path)
print("✅ Extracted raw text from PDF")

# Step 2: Extract test values (JSON)
extraction_chain = get_extract_values_chain()
test_data = extraction_chain.invoke({ "report_text": report_text })

print("\n🧾 Parsed Report JSON:")
print(json.dumps(test_data, indent=2))

# Step 3: Prepare user profile (you can later take this as user input)
user_profile = {
    "name": "Ramchandra",
    "age": 77,
    "gender": "Male",
    "medical_history": ["diabetes", "Blood Pressure"]
}

# Step 4: Get explanation using Gemini
explanation_chain = get_explanation_chain()
explanation = explanation_chain.invoke({
    "test_data": test_data,
    "user_profile": user_profile
})

# Step 5: Show insight to user
print("\n🧠 Insight from Gemini:")
print(explanation.content)

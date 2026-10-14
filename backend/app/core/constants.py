"""
Centralized domain constants and default patient metadata for SmritiSetu.
Eliminates duplicated mock dictionaries across backend endpoints.
"""

DEFAULT_PATIENT_METADATA = {
    "id": 1,
    "abha_id": "NER-ASM-9821-4412",
    "name": "Bhaben Baruah",
    "age": 74,
    "dialect": "Assamese",
    "caregiver_name": "Ananya Baruah",
    "caregiver_phone": "+91 94350 12345",
    "baseline_latency": 800.0,
}

DEFAULT_ASHA_WORKER_ID = "ASHA-NAGAON-01"
DEFAULT_ASHA_VILLAGE = "Raha, Nagaon"

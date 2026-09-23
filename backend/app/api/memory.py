import math
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/memory", tags=["Reminiscence Vault"])

class MemoryPhoto(BaseModel):
    id: str
    title: str
    relation: str
    description: str
    assamese_description: str
    image_url: str
    tags: List[str]
    audio_cue: str

# Default seeded family memories for demonstration
DEFAULT_MEMORIES = [
    {
        "id": "mem_1",
        "title": "Ananya Baruah",
        "relation": "Granddaughter",
        "description": "Granddaughter Ananya from Guwahati, studying computer engineering.",
        "assamese_description": "গুৱাহাটীৰ পৰা নাতিনী অনন্যা, ইঞ্জিনীয়াৰিং পঢ়ি আছে।",
        "image_url": "/assets/images/mem_ananya.svg",
        "tags": ["granddaughter", "family", "guwahati", "ananya", "natini"],
        "audio_cue": "এয়া আপোনাৰ মৰমৰ নাতিনী অনন্যা, গুৱাহাটীৰ পৰা।"
    },
    {
        "id": "mem_2",
        "title": "Bikram Baruah",
        "relation": "Eldest Son",
        "description": "Eldest son Bikram, working as a tea estate manager in Jorhat.",
        "assamese_description": "ডাঙৰ ল'ৰা বিক্ৰম, যোৰহাটৰ চাহ বাগিচাত পৰিচালক।",
        "image_url": "/assets/images/mem_bikram.svg",
        "tags": ["son", "bikram", "jorhat", "tea garden", "lora"],
        "audio_cue": "এয়া আপোনাৰ বৰপুত্ৰ বিক্ৰম, যোৰহাটৰ চাহ বাগিচাৰ।"
    },
    {
        "id": "mem_3",
        "title": "Nirupama Baruah",
        "relation": "Wife",
        "description": "Late wife Nirupama, together celebrating Rongali Bihu 1978.",
        "assamese_description": "ধৰ্মপত্নী নিৰুপমা, ১৯৭৮ চনৰ ৰঙালী বিহু উদযাপনৰ স্মৃতি।",
        "image_url": "/assets/images/mem_wife.svg",
        "tags": ["wife", "nirupama", "bihu", "1978", "family"],
        "audio_cue": "এয়া নিৰুপমা, ১৯৭৮ চনৰ বিহুৰ দিনৰ সোঁৱৰণি।"
    },
    {
        "id": "mem_4",
        "title": "Ancestral Homestead",
        "relation": "Ancestral Home",
        "description": "Ancestral courtyard home in Raha, Nagaon, with betel nut trees.",
        "assamese_description": "ৰহা, নগাঁওৰ তামোল বাৰীৰে আৱৰা পুৰণি পূৰ্বপুৰুষৰ ঘৰ।",
        "image_url": "/assets/images/mem_home.svg",
        "tags": ["home", "raha", "nagaon", "tamol", "bari", "ancestral"],
        "audio_cue": "এয়া আপোনাৰ ৰহাৰ নিজা ভেটি, তামোল বাৰীৰ ঘৰ।"
    }
]

# Simple semantic vector bag-of-words / tag scoring fallback
def compute_similarity(query: str, tags: List[str], desc: str) -> float:
    q_words = set(query.lower().split())
    target_words = set([t.lower() for t in tags] + desc.lower().split())
    if not q_words or not target_words:
        return 0.0
    intersection = q_words.intersection(target_words)
    return len(intersection) / math.sqrt(len(q_words) * len(target_words))

@router.get("/photos", response_model=List[MemoryPhoto])
def get_memory_photos():
    """Retrieve all family reminiscence photos with cultural metadata"""
    return DEFAULT_MEMORIES

@router.get("/search")
def search_memories(query: str):
    """Semantic vector search through reminiscence tags and descriptions"""
    results = []
    for mem in DEFAULT_MEMORIES:
        score = compute_similarity(query, mem["tags"], mem["description"])
        if score > 0 or query.lower() in mem["relation"].lower() or query.lower() in mem["title"].lower():
            results.append({**mem, "relevance_score": round(score, 2)})
            
    results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    return results or DEFAULT_MEMORIES

"""
Rule-based skincare recommendation engine (Section 15).
Deliberately general, low-risk, educational-only guidance — never a
prescription treatment, dosage, or drug recommendation.
"""

from typing import List


CONDITION_INFO = {
    "Acne": {
        "about": "Acne happens when hair follicles become clogged with oil and dead skin "
                 "cells, often leading to whiteheads, blackheads, or inflamed pimples.",
        "common_characteristics": [
            "Whiteheads or blackheads",
            "Red, inflamed bumps",
            "Occasional oiliness"
        ],
        "general_causes": [
            "Excess oil production",
            "Clogged pores",
            "Hormonal changes",
            "Certain cosmetics"
        ],
        "general_prevention": [
            "Keep skin clean",
            "Avoid heavy comedogenic products",
            "Avoid picking at lesions"
        ],
    },

    "Eczema": {
        "about": "Eczema (atopic dermatitis) is a condition that makes skin dry, itchy, and inflamed.",
        "common_characteristics": [
            "Dry, scaly patches",
            "Itchiness",
            "Redness, especially in skin folds"
        ],
        "general_causes": [
            "Skin barrier dysfunction",
            "Allergens or irritants",
            "Dry weather"
        ],
        "general_prevention": [
            "Moisturize regularly",
            "Use fragrance-free products",
            "Avoid known irritants"
        ],
    },

    "Psoriasis": {
        "about": "Psoriasis is a chronic condition where skin cells build up quickly, forming "
                 "scaly, sometimes itchy patches.",
        "common_characteristics": [
            "Thick, silvery scales",
            "Red patches",
            "Dry, cracked skin"
        ],
        "general_causes": [
            "Immune system overactivity",
            "Genetics",
            "Stress or skin injury triggers"
        ],
        "general_prevention": [
            "Moisturize consistently",
            "Manage stress",
            "Avoid known personal triggers"
        ],
    },

    "Melanoma": {
        "about": "Melanoma is a serious form of skin cancer that develops in pigment-producing cells. "
                 "Any suspected melanoma requires prompt professional evaluation.",
        "common_characteristics": [
            "Asymmetric mole",
            "Irregular border",
            "Multiple colors",
            "Evolving size or shape"
        ],
        "general_causes": [
            "UV exposure",
            "Genetic predisposition",
            "History of severe sunburns"
        ],
        "general_prevention": [
            "Daily broad-spectrum sunscreen",
            "Avoid peak-sun tanning",
            "Regular skin checks"
        ],
    },

    "Benign Keratosis": {
        "about": "Benign keratosis refers to common, non-cancerous skin growths that develop with age or sun exposure.",
        "common_characteristics": [
            "Waxy or rough texture",
            "Tan to dark brown color",
            "Slightly raised"
        ],
        "general_causes": [
            "Aging",
            "Sun exposure",
            "Genetics"
        ],
        "general_prevention": [
            "Sun protection",
            "Routine skin monitoring"
        ],
    },

    "Rosacea": {
        "about": "Rosacea is a chronic condition causing facial redness and sometimes visible blood vessels or bumps.",
        "common_characteristics": [
            "Facial flushing",
            "Visible blood vessels",
            "Sensitive skin"
        ],
        "general_causes": [
            "Blood vessel abnormalities",
            "Triggers like heat, spicy food, alcohol, or sun"
        ],
        "general_prevention": [
            "Identify and avoid personal triggers",
            "Gentle skincare",
            "Daily sunscreen"
        ],
    },

    # ---------------------------------------------------------
    # SHINGLES - ADDED
    # ---------------------------------------------------------
    "Shingles": {
        "about": "Shingles (herpes zoster) is a viral condition caused by reactivation of "
                 "the varicella-zoster virus, the same virus that causes chickenpox. "
                 "It commonly causes a painful skin rash, usually affecting one side "
                 "of the body or face.",

        "common_characteristics": [
            "Pain, burning, tingling, or itching",
            "Painful rash usually on one side of the body",
            "Groups of fluid-filled blisters",
            "Blisters that later dry and form crusts",
            "Sometimes fever, headache, or tiredness"
        ],

        "general_causes": [
            "Reactivation of the varicella-zoster virus",
            "Previous chickenpox infection",
            "Weakened immune system can increase the risk",
            "Risk generally increases with age"
        ],

        "general_prevention": [
            "Shingles vaccination can help prevent shingles",
            "Avoid direct contact with the rash when possible",
            "Keep the rash covered",
            "Maintain good general health and follow professional medical advice"
        ],
    },
}


DEFAULT_INFO = {
    "about": "General information about this condition is not yet available in our educational database.",
    "common_characteristics": [],
    "general_causes": [],
    "general_prevention": [],
}


SKINCARE_PLANS = {
    "Acne": {
        "morning": [
            "Gentle cleanser",
            "Non-comedogenic moisturizer",
            "Broad-spectrum sunscreen"
        ],
        "evening": [
            "Gentle cleanser",
            "Lightweight moisturizer"
        ],
        "general_tips": [
            "Avoid picking or squeezing lesions",
            "Use non-comedogenic products",
            "Change pillowcases regularly"
        ],
    },

    "Eczema": {
        "morning": [
            "Fragrance-free gentle cleanser",
            "Rich moisturizer",
            "Sunscreen for sensitive skin"
        ],
        "evening": [
            "Lukewarm rinse",
            "Thick emollient moisturizer"
        ],
        "general_tips": [
            "Avoid hot showers",
            "Use fragrance-free laundry detergent",
            "Moisturize within minutes of bathing"
        ],
    },

    "Psoriasis": {
        "morning": [
            "Gentle cleanser",
            "Thick moisturizer",
            "Sunscreen"
        ],
        "evening": [
            "Gentle cleanser",
            "Heavy moisturizer or ointment"
        ],
        "general_tips": [
            "Avoid skin injury or scratching",
            "Manage stress",
            "Keep skin well-hydrated"
        ],
    },

    "Melanoma": {
        "morning": [
            "Broad-spectrum sunscreen"
        ],
        "evening": [
            "Gentle cleanser",
            "Moisturizer"
        ],
        "general_tips": [
            "Seek prompt professional evaluation",
            "Avoid direct sun exposure",
            "Do not self-treat"
        ],
    },

    "Benign Keratosis": {
        "morning": [
            "Gentle cleanser",
            "Moisturizer",
            "Sunscreen"
        ],
        "evening": [
            "Gentle cleanser",
            "Moisturizer"
        ],
        "general_tips": [
            "Monitor for changes in size or color",
            "Sun protection"
        ],
    },

    "Rosacea": {
        "morning": [
            "Ultra-gentle cleanser",
            "Soothing moisturizer",
            "Mineral sunscreen"
        ],
        "evening": [
            "Ultra-gentle cleanser",
            "Soothing moisturizer"
        ],
        "general_tips": [
            "Avoid known triggers such as heat and spicy food",
            "Avoid harsh scrubs or exfoliants"
        ],
    },

    # ---------------------------------------------------------
    # SHINGLES - GENERAL CARE ONLY
    # ---------------------------------------------------------
    "Shingles": {
        "morning": [
            "Keep the affected skin clean and dry",
            "Wear comfortable clothing that does not irritate the rash",
            "Protect unaffected skin from excessive sun exposure"
        ],
        "evening": [
            "Keep the affected area clean and dry",
            "Avoid scratching or picking the rash"
        ],
        "general_tips": [
            "Avoid scratching or picking the blisters",
            "Keep the rash covered when appropriate",
            "Avoid direct contact with people who have not had chickenpox or vaccination",
            "Seek professional medical evaluation, especially if symptoms are severe or the rash is near the eye"
        ],
    },
}


DEFAULT_PLAN = {
    "morning": [
        "Gentle cleanser",
        "Moisturizer",
        "Broad-spectrum sunscreen"
    ],
    "evening": [
        "Gentle cleanser",
        "Moisturizer"
    ],
    "general_tips": [
        "Avoid harsh products",
        "Protect skin from excessive sun exposure"
    ],
}


def get_condition_info(condition: str) -> dict:
    info = CONDITION_INFO.get(condition, DEFAULT_INFO)
    plan = SKINCARE_PLANS.get(condition, DEFAULT_PLAN)

    return {
        "condition": condition,
        "about": info["about"],
        "common_characteristics": info["common_characteristics"],
        "general_causes": info["general_causes"],
        "general_prevention": info["general_prevention"],
        "morning": plan["morning"],
        "evening": plan["evening"],
        "general_tips": plan["general_tips"],
    }


def build_routine(
    skin_type: str = "Unknown",
    sun_exposure: str = "Medium",
    routine_preferences: List[str] = None
) -> dict:

    routine_preferences = routine_preferences or []

    morning = [
        "Cleanse with a gentle, skin-type-appropriate cleanser",
        "Moisturize"
    ]

    if skin_type == "Oily":
        morning[0] = "Cleanse with a gentle gel or foaming cleanser"

    elif skin_type in ("Dry", "Sensitive"):
        morning[0] = "Cleanse with a gentle, fragrance-free cream cleanser"

    morning.append("Apply broad-spectrum sunscreen")

    afternoon = ["Stay hydrated"]

    if sun_exposure == "High":
        afternoon.append(
            "Reapply sunscreen every 2 hours if outdoors"
        )

    elif sun_exposure == "Medium":
        afternoon.append(
            "Reapply sunscreen if spending extended time outdoors"
        )

    afternoon.append(
        "Avoid unnecessary touching of the face"
    )

    evening = [
        "Cleanse to remove the day's buildup",
        "Moisturize"
    ]

    evening.append(
        "Continue any clinician-directed treatment you already have"
    )

    if "None" in routine_preferences or not routine_preferences:
        note = (
            "Starting from the basics (cleanse, moisturize, protect) "
            "is a great foundation."
        )
    else:
        note = (
            f"Routine adjusted around your current products: "
            f"{', '.join(routine_preferences)}."
        )

    return {
        "morning": morning,
        "afternoon": afternoon,
        "evening": evening,
        "personalized_note": note
    }
"""
Shape Configuration and Definitions for "Match the Shapes" (Backend)
20 shapes, similarity groups, difficulty tiers, and seeded round generation algorithm.
"""

import math
from typing import Dict, List, Any

SIMILARITY_GROUPS = {
    "TRIANGLES": "triangles",
    "QUAD_ORTHOGONAL": "quad_orthogonal",
    "QUAD_SLANTED": "quad_slanted",
    "POLYGONS": "polygons",
    "CURVED_CLOSED": "curved_closed",
    "CURVED_ARCS": "curved_arcs",
    "SPECIAL_SYMBOLS": "special_symbols",
}

SHAPES_CONFIG = [
    {
        "id": "triangle",
        "display_name": "Triangle",
        "difficulty_tier": 1,
        "similarity_group": SIMILARITY_GROUPS["TRIANGLES"],
        "fill_color": "#f97316",
        "stroke_color": "#ea580c",
    },
    {
        "id": "right_triangle",
        "display_name": "Right Triangle",
        "difficulty_tier": 2,
        "similarity_group": SIMILARITY_GROUPS["TRIANGLES"],
        "fill_color": "#14b8a6",
        "stroke_color": "#0d9488",
    },
    {
        "id": "square",
        "display_name": "Square",
        "difficulty_tier": 1,
        "similarity_group": SIMILARITY_GROUPS["QUAD_ORTHOGONAL"],
        "fill_color": "#6366f1",
        "stroke_color": "#4f46e5",
    },
    {
        "id": "rectangle",
        "display_name": "Rectangle",
        "difficulty_tier": 2,
        "similarity_group": SIMILARITY_GROUPS["QUAD_ORTHOGONAL"],
        "fill_color": "#8b5cf6",
        "stroke_color": "#7c3aed",
    },
    {
        "id": "rhombus",
        "display_name": "Rhombus",
        "difficulty_tier": 2,
        "similarity_group": SIMILARITY_GROUPS["QUAD_ORTHOGONAL"],
        "fill_color": "#06b6d4",
        "stroke_color": "#0891b2",
    },
    {
        "id": "parallelogram",
        "display_name": "Parallelogram",
        "difficulty_tier": 3,
        "similarity_group": SIMILARITY_GROUPS["QUAD_SLANTED"],
        "fill_color": "#84cc16",
        "stroke_color": "#65a30d",
    },
    {
        "id": "trapezium",
        "display_name": "Trapezium",
        "difficulty_tier": 3,
        "similarity_group": SIMILARITY_GROUPS["QUAD_SLANTED"],
        "fill_color": "#0ea5e9",
        "stroke_color": "#0284c7",
    },
    {
        "id": "kite",
        "display_name": "Kite",
        "difficulty_tier": 3,
        "similarity_group": SIMILARITY_GROUPS["QUAD_SLANTED"],
        "fill_color": "#d946ef",
        "stroke_color": "#c026d3",
    },
    {
        "id": "pentagon",
        "display_name": "Pentagon",
        "difficulty_tier": 3,
        "similarity_group": SIMILARITY_GROUPS["POLYGONS"],
        "fill_color": "#d97706",
        "stroke_color": "#b45309",
    },
    {
        "id": "hexagon",
        "display_name": "Hexagon",
        "difficulty_tier": 3,
        "similarity_group": SIMILARITY_GROUPS["POLYGONS"],
        "fill_color": "#059669",
        "stroke_color": "#047857",
    },
    {
        "id": "heptagon",
        "display_name": "Heptagon",
        "difficulty_tier": 3,
        "similarity_group": SIMILARITY_GROUPS["POLYGONS"],
        "fill_color": "#7c3aed",
        "stroke_color": "#6d28d9",
    },
    {
        "id": "octagon",
        "display_name": "Octagon",
        "difficulty_tier": 3,
        "similarity_group": SIMILARITY_GROUPS["POLYGONS"],
        "fill_color": "#e11d48",
        "stroke_color": "#be123c",
    },
    {
        "id": "circle",
        "display_name": "Circle",
        "difficulty_tier": 1,
        "similarity_group": SIMILARITY_GROUPS["CURVED_CLOSED"],
        "fill_color": "#10b981",
        "stroke_color": "#059669",
    },
    {
        "id": "ring",
        "display_name": "Ring",
        "difficulty_tier": 2,
        "similarity_group": SIMILARITY_GROUPS["CURVED_CLOSED"],
        "fill_color": "#2563eb",
        "stroke_color": "#1d4ed8",
    },
    {
        "id": "ellipse",
        "display_name": "Ellipse",
        "difficulty_tier": 2,
        "similarity_group": SIMILARITY_GROUPS["CURVED_CLOSED"],
        "fill_color": "#f59e0b",
        "stroke_color": "#d97706",
    },
    {
        "id": "semicircle",
        "display_name": "Semicircle",
        "difficulty_tier": 2,
        "similarity_group": SIMILARITY_GROUPS["CURVED_ARCS"],
        "fill_color": "#0d9488",
        "stroke_color": "#0f766e",
    },
    {
        "id": "crescent",
        "display_name": "Crescent",
        "difficulty_tier": 3,
        "similarity_group": SIMILARITY_GROUPS["CURVED_ARCS"],
        "fill_color": "#4338ca",
        "stroke_color": "#3730a3",
    },
    {
        "id": "star",
        "display_name": "Star",
        "difficulty_tier": 1,
        "similarity_group": SIMILARITY_GROUPS["SPECIAL_SYMBOLS"],
        "fill_color": "#eab308",
        "stroke_color": "#ca8a04",
    },
    {
        "id": "cross",
        "display_name": "Cross",
        "difficulty_tier": 2,
        "similarity_group": SIMILARITY_GROUPS["SPECIAL_SYMBOLS"],
        "fill_color": "#ef4444",
        "stroke_color": "#dc2626",
    },
    {
        "id": "heart",
        "display_name": "Heart",
        "difficulty_tier": 1,
        "similarity_group": SIMILARITY_GROUPS["SPECIAL_SYMBOLS"],
        "fill_color": "#f43f5e",
        "stroke_color": "#e11d48",
    },
]

SHAPES_BY_ID = {s["id"]: s for s in SHAPES_CONFIG}


class Mulberry32:
    def __init__(self, seed: Any = 123456789):
        if isinstance(seed, str):
            h = 0
            for char in seed:
                h = ((h << 5) - h) + ord(char)
                h &= 0xFFFFFFFF
            self.s = abs(h) or 123456789
        elif isinstance(seed, (int, float)):
            self.s = int(seed) & 0xFFFFFFFF
        else:
            self.s = 123456789

    def next(self) -> float:
        self.s = (self.s + 0x6D2B79F5) & 0xFFFFFFFF
        t = self.s
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0


def seeded_shuffle(lst: List[Any], rng: Mulberry32) -> List[Any]:
    res = list(lst)
    for i in range(len(res) - 1, 0, -1):
        j = int(rng.next() * (i + 1))
        res[i], res[j] = res[j], res[i]
    return res


def generate_shape_game_rounds(seed: Any = 12345) -> List[Dict[str, Any]]:
    """
    Distributes 20 unique shapes into 5 rounds of 4 shapes each.
    Strictly satisfies:
    1. Each round has exactly 4 shapes.
    2. Exactly 20 unique shapes across all 5 rounds.
    3. NO two shapes in the same round come from the same similarity group.
    """
    rng = Mulberry32(seed)

    group_map: Dict[str, List[Dict[str, Any]]] = {}
    for shape in SHAPES_CONFIG:
        grp = shape["similarity_group"]
        group_map.setdefault(grp, []).append(shape)

    for grp in group_map:
        group_map[grp] = seeded_shuffle(group_map[grp], rng)

    sorted_groups = sorted(group_map.keys(), key=lambda g: len(group_map[g]), reverse=True)

    rounds: List[Dict[str, Any]] = [{"shapes": [], "groups": set()} for _ in range(5)]

    for grp in sorted_groups:
        shapes = group_map[grp]
        for shape in shapes:
            candidate_indices = [
                i for i in range(5)
                if len(rounds[i]["shapes"]) < 4 and grp not in rounds[i]["groups"]
            ]
            if not candidate_indices:
                candidate_indices = [i for i in range(5) if len(rounds[i]["shapes"]) < 4]

            candidate_indices.sort(key=lambda idx: len(rounds[idx]["shapes"]))
            min_len = len(rounds[candidate_indices[0]]["shapes"])
            tied = [idx for idx in candidate_indices if len(rounds[idx]["shapes"]) == min_len]
            chosen = tied[int(rng.next() * len(tied))]

            rounds[chosen]["shapes"].append(shape)
            rounds[chosen]["groups"].add(grp)

    result = []
    for r_idx, r in enumerate(rounds):
        base_shapes = r["shapes"]
        target_slots = seeded_shuffle(base_shapes, rng)
        draggable_pieces = seeded_shuffle(base_shapes, rng)

        result.append({
            "round_index": r_idx,
            "shapes": base_shapes,
            "target_slots": [
                {"slot_id": f"slot-{r_idx}-{s['id']}", "shape_id": s["id"], "shape": s}
                for s in target_slots
            ],
            "draggable_pieces": [
                {"piece_id": f"piece-{r_idx}-{s['id']}", "shape_id": s["id"], "shape": s}
                for s in draggable_pieces
            ],
        })

    return result

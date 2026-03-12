"""
Identify the Sampling Method (AP Stats Unit 3, Topic 3.3f)

Given a description, classify the sampling method used.

Run with: manim -qm --format=mp4 identify_sampling_method.py IdentifySamplingMethod
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class IdentifySamplingMethod(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Identify the Sampling Method", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== KEY CLUES ==========
        methods = [
            ("SRS", "Every possible sample of size n has equal chance",
             "\"randomly selected 50 students from a list\"", BLUE_3B1B),
            ("Stratified", "Divide into groups, sample from EACH",
             "\"sampled 10 from each grade level\"", GREEN_3B1B),
            ("Cluster", "Randomly pick entire groups",
             "\"randomly chose 3 classrooms, surveyed all\"", ORANGE_3B1B),
            ("Systematic", "Every k-th individual",
             "\"surveyed every 5th person in line\"", TEAL_3B1B),
            ("Convenience", "Easiest individuals to reach",
             "\"asked people near the entrance\"", RED_3B1B),
        ]

        prev = title
        for name, clue, example, color in methods:
            name_t = Text(name, font_size=20, color=ManimColor(color), weight=BOLD)
            name_t.next_to(prev, DOWN, buff=0.25).align_to(LEFT * 5.5, LEFT)
            clue_t = Text(clue, font_size=16, color=GREY_B)
            clue_t.next_to(name_t, RIGHT, buff=0.3)
            example_t = Text(example, font_size=14, color=ManimColor(color))
            example_t.next_to(name_t, DOWN, buff=0.04, aligned_edge=LEFT)
            self.play(Write(name_t), Write(clue_t), run_time=0.35)
            self.play(Write(example_t), run_time=0.2)
            prev = example_t

        self.wait(0.5)

        closing = Text(
            "Look for keywords: \"every group\" = stratified, \"entire group\" = cluster.",
            font_size=18, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)

"""
Visualize identifying the correct significance test procedure for comparing two proportions.

Run with: manim -qm --format=mp4 animations/apstat_610_identify_procedure.py Procedure610
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class Procedure610(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("6.10 — Identify the Procedure", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        # Decision flow
        question = Text("What are you comparing?", font_size=26, color=YELLOW_3B1B, weight=BOLD)
        question.next_to(title, DOWN, buff=0.55)

        # Two branches
        left_label = Text("One proportion", font_size=24, color=GRAY_B)
        right_label = Text("Two proportions", font_size=24, color=GREEN_3B1B, weight=BOLD)
        left_label.shift(LEFT * 3.5 + UP * 0.5)
        right_label.shift(RIGHT * 3.5 + UP * 0.5)

        arrow_left = Arrow(question.get_bottom(), left_label.get_top(), buff=0.15, color=GRAY_B, stroke_width=3)
        arrow_right = Arrow(question.get_bottom(), right_label.get_top(), buff=0.15, color=GREEN_3B1B, stroke_width=3)

        # Left box (dimmed)
        left_box = RoundedRectangle(
            corner_radius=0.15, width=4.8, height=1.6,
            stroke_color=GRAY_B, stroke_width=3,
        )
        left_box.set_fill(GRAY_B, opacity=0.05)
        left_box.next_to(left_label, DOWN, buff=0.35)
        left_text = Text("One-sample z test\nfor p", font_size=22, color=GRAY_B)
        left_text.move_to(left_box.get_center())

        # Right box (highlighted)
        right_box = RoundedRectangle(
            corner_radius=0.15, width=4.8, height=1.6,
            stroke_color=GREEN_3B1B, stroke_width=4,
        )
        right_box.set_fill(GREEN_3B1B, opacity=0.12)
        right_box.next_to(right_label, DOWN, buff=0.35)
        right_text = Text("Two-sample z test\nfor p1 - p2", font_size=22, color=GREEN_3B1B, weight=BOLD)
        right_text.move_to(right_box.get_center())

        # Key identifiers
        clues_title = Text("Clues you need this test:", font_size=26, color=TEAL_3B1B, weight=BOLD)
        clues_title.shift(DOWN * 1.55)

        clues = VGroup(
            Text("\u2022  Two independent groups / samples", font_size=22),
            Text("\u2022  Comparing proportions (not means)", font_size=22),
            Text("\u2022  Testing a claim about p1 - p2", font_size=22),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.16)
        clues.next_to(clues_title, DOWN, buff=0.3)

        # Animate
        self.play(Write(title), run_time=0.8)
        self.play(Write(question), run_time=0.6)
        self.play(
            Create(arrow_left), Create(arrow_right),
            Write(left_label), Write(right_label),
            run_time=0.8,
        )
        self.play(
            Create(left_box), Write(left_text),
            Create(right_box), Write(right_text),
            run_time=0.9,
        )
        self.wait(0.6)
        self.play(Write(clues_title), run_time=0.5)
        self.play(
            LaggedStart(
                *[FadeIn(c, shift=RIGHT * 0.15) for c in clues],
                lag_ratio=0.2,
            ),
            run_time=0.9,
        )
        self.wait(2.5)

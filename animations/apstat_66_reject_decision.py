"""
Make the Decision (AP Stats Unit 6, Topic 6.6)

Illustrates the two possible decisions in a significance test:
reject H0 (convincing evidence for Ha) vs fail to reject H0
(not convincing evidence for Ha). Emphasizes correct language.

Run with: manim -qm --format=mp4 apstat_66_reject_decision.py RejectDecision
"""
from manim import *
import numpy as np

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class RejectDecision(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Making the Decision", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Two possible outcomes in every test",
            font_size=24, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(subtitle))
        self.wait(0.5)

        # ========== TWO PATHS ==========
        self.play(FadeOut(subtitle), run_time=0.3)

        # Left column: Reject
        left_header = Text(
            "p-value \u2264 \u03b1", font_size=28, color=GREEN_3B1B, weight=BOLD,
        )
        left_header.move_to(LEFT * 3.2 + UP * 1.5)
        left_box = RoundedRectangle(
            width=4.5, height=3.2, corner_radius=0.2,
            color=GREEN_3B1B, stroke_width=2,
        )
        left_box.next_to(left_header, DOWN, buff=0.2)

        left_line1 = Text("Reject H\u2080", font_size=24, color=GREEN_3B1B, weight=BOLD)
        left_line1.move_to(left_box.get_center() + UP * 0.8)

        left_line2 = Text(
            "\"There IS convincing\nstatistical evidence\nthat [Ha in context].\"",
            font_size=18, color=WHITE,
        )
        left_line2.move_to(left_box.get_center() + DOWN * 0.3)

        # Right column: Fail to reject
        right_header = Text(
            "p-value > \u03b1", font_size=28, color=RED_3B1B, weight=BOLD,
        )
        right_header.move_to(RIGHT * 3.2 + UP * 1.5)
        right_box = RoundedRectangle(
            width=4.5, height=3.2, corner_radius=0.2,
            color=RED_3B1B, stroke_width=2,
        )
        right_box.next_to(right_header, DOWN, buff=0.2)

        right_line1 = Text(
            "Fail to reject H\u2080", font_size=24, color=RED_3B1B, weight=BOLD,
        )
        right_line1.move_to(right_box.get_center() + UP * 0.8)

        right_line2 = Text(
            "\"There is NOT convincing\nstatistical evidence\nthat [Ha in context].\"",
            font_size=18, color=WHITE,
        )
        right_line2.move_to(right_box.get_center() + DOWN * 0.3)

        self.play(
            Write(left_header), Create(left_box),
            Write(right_header), Create(right_box),
            run_time=0.6,
        )
        self.play(Write(left_line1), Write(right_line1), run_time=0.5)
        self.play(Write(left_line2), Write(right_line2), run_time=0.5)
        self.wait(1.0)

        # ========== WARNING ==========
        warning = Text(
            "NEVER say \"accept H\u2080\" or \"proven\"",
            font_size=26, color=ORANGE_3B1B, weight=BOLD,
        )
        warning.to_edge(DOWN, buff=0.5)
        warn_box = SurroundingRectangle(
            warning, color=ORANGE_3B1B, buff=0.15, corner_radius=0.1,
        )
        self.play(Write(warning), Create(warn_box), run_time=0.5)
        self.wait(2.0)

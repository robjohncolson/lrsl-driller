"""
Write the Conclusion (AP Stats Unit 6, Topic 6.6)

Demonstrates how to write a complete conclusion for a significance
test. Highlights the four required elements: explicit comparison,
decision, evidence statement, and context.

Run with: manim -qm --format=mp4 apstat_66_write_conclusion.py WriteConclusion
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


class WriteConclusion(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Writing the Conclusion", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Four required elements",
            font_size=24, color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(subtitle))
        self.wait(0.5)

        # ========== TEMPLATE BUILD-UP ==========
        self.play(FadeOut(subtitle), run_time=0.3)

        # Element 1: Explicit comparison
        elem1_label = Text("1. Explicit Comparison", font_size=20, color=TEAL_3B1B)
        elem1_label.next_to(title, DOWN, buff=0.4).align_to(LEFT * 5.5, LEFT)
        elem1_text = Text(
            "\"Because the p-value of 0.024 is less than \u03b1 = 0.10...\"",
            font_size=20, color=GREEN_3B1B,
        )
        elem1_text.next_to(elem1_label, DOWN, buff=0.08, aligned_edge=LEFT)

        self.play(Write(elem1_label), run_time=0.3)
        self.play(Write(elem1_text), run_time=0.4)
        self.wait(0.3)

        # Element 2: Decision
        elem2_label = Text("2. Decision", font_size=20, color=TEAL_3B1B)
        elem2_label.next_to(elem1_text, DOWN, buff=0.25, aligned_edge=LEFT)
        elem2_text = Text(
            "\"...we reject H\u2080.\"",
            font_size=20, color=YELLOW_3B1B,
        )
        elem2_text.next_to(elem2_label, DOWN, buff=0.08, aligned_edge=LEFT)

        self.play(Write(elem2_label), run_time=0.3)
        self.play(Write(elem2_text), run_time=0.4)
        self.wait(0.3)

        # Element 3: Evidence statement
        elem3_label = Text("3. Evidence Statement", font_size=20, color=TEAL_3B1B)
        elem3_label.next_to(elem2_text, DOWN, buff=0.25, aligned_edge=LEFT)
        elem3_text = Text(
            "\"There is convincing statistical evidence that...\"",
            font_size=20, color=BLUE_3B1B,
        )
        elem3_text.next_to(elem3_label, DOWN, buff=0.08, aligned_edge=LEFT)

        self.play(Write(elem3_label), run_time=0.3)
        self.play(Write(elem3_text), run_time=0.4)
        self.wait(0.3)

        # Element 4: Context
        elem4_label = Text("4. Context (Ha)", font_size=20, color=TEAL_3B1B)
        elem4_label.next_to(elem3_text, DOWN, buff=0.25, aligned_edge=LEFT)
        elem4_text = Text(
            "\"...the proportion of adults who say football\nis their favorite sport differs from 0.40.\"",
            font_size=20, color=PINK_3B1B,
        )
        elem4_text.next_to(elem4_label, DOWN, buff=0.08, aligned_edge=LEFT)

        self.play(Write(elem4_label), run_time=0.3)
        self.play(Write(elem4_text), run_time=0.4)
        self.wait(0.5)

        # ========== HIGHLIGHT BOX ==========
        all_elements = VGroup(
            elem1_label, elem1_text,
            elem2_label, elem2_text,
            elem3_label, elem3_text,
            elem4_label, elem4_text,
        )
        highlight = SurroundingRectangle(
            all_elements, color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(highlight), run_time=0.5)
        self.wait(2.0)

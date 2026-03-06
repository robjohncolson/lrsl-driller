"""
Capstone 6.6 (AP Stats Unit 6, Topic 6.6)

Synthesizes the entire significance test workflow from hypotheses
through conclusion, with a worked example showing all steps and
the final conclusion with proper language.

Run with: manim -qm --format=mp4 apstat_66_capstone.py Capstone66
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


class Capstone66(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("6.6 Capstone: Full Test", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Worked example: start to finish",
            font_size=24, color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(subtitle))
        self.wait(0.5)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== SCENARIO ==========
        scenario = Text(
            "40% national football preference.\nMayor tests if her town differs.\nn = 100, p\u0302 = 0.29, \u03b1 = 0.10",
            font_size=20, color=TEAL_3B1B,
        )
        scenario.next_to(title, DOWN, buff=0.35).align_to(LEFT * 5.5, LEFT)
        self.play(Write(scenario), run_time=0.5)
        self.wait(0.3)

        # ========== STEP 1: Hypotheses ==========
        h_label = Text("Hypotheses:", font_size=18, color=ORANGE_3B1B, weight=BOLD)
        h_label.next_to(scenario, DOWN, buff=0.25, aligned_edge=LEFT)
        h_text = Text(
            "H\u2080: p = 0.40   H\u2090: p \u2260 0.40",
            font_size=20, color=WHITE,
        )
        h_text.next_to(h_label, RIGHT, buff=0.15)
        self.play(Write(h_label), Write(h_text), run_time=0.4)

        # ========== STEP 2: Calculations ==========
        calc_label = Text("Calculations:", font_size=18, color=ORANGE_3B1B, weight=BOLD)
        calc_label.next_to(h_label, DOWN, buff=0.2, aligned_edge=LEFT)
        calc_text = Text(
            "z = (0.29 \u2212 0.40) / \u221a(0.40\u00d70.60/100) = \u22122.24",
            font_size=18, color=YELLOW_3B1B,
        )
        calc_text.next_to(calc_label, DOWN, buff=0.08, aligned_edge=LEFT)
        self.play(Write(calc_label), run_time=0.3)
        self.play(Write(calc_text), run_time=0.4)

        pval_text = Text(
            "p-value = 2 \u00d7 P(Z \u2264 \u22122.24) = 2(0.0125) = 0.0250",
            font_size=18, color=YELLOW_3B1B,
        )
        pval_text.next_to(calc_text, DOWN, buff=0.08, aligned_edge=LEFT)
        self.play(Write(pval_text), run_time=0.4)
        self.wait(0.3)

        # ========== STEP 3: Conclusion ==========
        conc_label = Text("Conclusion:", font_size=18, color=ORANGE_3B1B, weight=BOLD)
        conc_label.next_to(pval_text, DOWN, buff=0.25, aligned_edge=LEFT)
        self.play(Write(conc_label), run_time=0.3)

        conc1 = Text(
            "Because the p-value of 0.0250 \u2264 \u03b1 = 0.10,",
            font_size=18, color=GREEN_3B1B,
        )
        conc1.next_to(conc_label, DOWN, buff=0.1, aligned_edge=LEFT)

        conc2 = Text(
            "we reject H\u2080.",
            font_size=18, color=GREEN_3B1B, weight=BOLD,
        )
        conc2.next_to(conc1, DOWN, buff=0.05, aligned_edge=LEFT)

        conc3 = Text(
            "There is convincing statistical evidence",
            font_size=18, color=BLUE_3B1B,
        )
        conc3.next_to(conc2, DOWN, buff=0.05, aligned_edge=LEFT)

        conc4 = Text(
            "that the proportion of adults in this town",
            font_size=18, color=BLUE_3B1B,
        )
        conc4.next_to(conc3, DOWN, buff=0.05, aligned_edge=LEFT)

        conc5 = Text(
            "who would say football is their favorite",
            font_size=18, color=BLUE_3B1B,
        )
        conc5.next_to(conc4, DOWN, buff=0.05, aligned_edge=LEFT)

        conc6 = Text(
            "sport differs from 0.40.",
            font_size=18, color=BLUE_3B1B,
        )
        conc6.next_to(conc5, DOWN, buff=0.05, aligned_edge=LEFT)

        for c in [conc1, conc2, conc3, conc4, conc5, conc6]:
            self.play(Write(c), run_time=0.35)

        conc_group = VGroup(conc1, conc2, conc3, conc4, conc5, conc6)
        conc_box = SurroundingRectangle(
            conc_group, color=GREEN_3B1B, buff=0.12, corner_radius=0.1,
        )
        self.play(Create(conc_box), run_time=0.4)
        self.wait(2.0)

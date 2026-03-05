"""
Calculate the Test Statistic (AP Stats Unit 6, Topic 6.5)

Shows the z-score formula for a one-sample z-test for a proportion:
z = (p-hat - p0) / sqrt(p0(1-p0)/n). Walks through each component,
emphasizes using p0 (not p-hat) in the denominator, and shows a
worked example on a number line.

Run with: manim -qm --format=mp4 apstat_65_test_statistic.py TestStatisticZScore
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


class TestStatisticZScore(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("The Test Statistic", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "How far is our sample from the null?",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== GENERAL FORMULA ==========
        self.play(FadeOut(subtitle), run_time=0.3)

        general_label = Text("General form:", font_size=24, color=GREY_B)
        general_label.next_to(title, DOWN, buff=0.3).align_to(LEFT * 5, LEFT)
        self.play(Write(general_label), run_time=0.3)

        # Build formula pieces
        z_text = Text("z", font_size=40, color=BLUE_3B1B, weight=BOLD)
        eq_text = Text(" = ", font_size=40, color=WHITE)
        num_text = Text("statistic \u2212 null value", font_size=28, color=YELLOW_3B1B)
        bar = Line(LEFT * 2.2, RIGHT * 2.2, stroke_width=2, color=WHITE)
        den_text = Text("standard deviation of statistic", font_size=22, color=TEAL_3B1B)

        frac = VGroup(num_text, bar, den_text).arrange(DOWN, buff=0.08)
        formula_general = VGroup(z_text, eq_text, frac).arrange(RIGHT, buff=0.15)
        formula_general.next_to(general_label, DOWN, buff=0.25)

        self.play(Write(z_text), Write(eq_text), run_time=0.4)
        self.play(Write(num_text), Create(bar), run_time=0.5)
        self.play(Write(den_text), run_time=0.4)
        self.wait(0.5)

        # ========== SPECIFIC FORMULA ==========
        self.play(
            FadeOut(VGroup(general_label, formula_general)),
            run_time=0.4,
        )

        specific_label = Text("For a population proportion:", font_size=24, color=GREY_B)
        specific_label.next_to(title, DOWN, buff=0.3).align_to(LEFT * 5, LEFT)
        self.play(Write(specific_label), run_time=0.3)

        z2 = Text("z", font_size=42, color=BLUE_3B1B, weight=BOLD)
        eq2 = Text(" = ", font_size=42, color=WHITE)
        num2 = Text("p\u0302 \u2212 p\u2080", font_size=34, color=YELLOW_3B1B, weight=BOLD)
        bar2 = Line(LEFT * 2, RIGHT * 2, stroke_width=2, color=WHITE)
        den2 = Text("\u221a(p\u2080(1\u2212p\u2080)/n)", font_size=28, color=TEAL_3B1B, weight=BOLD)

        frac2 = VGroup(num2, bar2, den2).arrange(DOWN, buff=0.08)
        formula_specific = VGroup(z2, eq2, frac2).arrange(RIGHT, buff=0.15)
        formula_specific.next_to(specific_label, DOWN, buff=0.25)

        self.play(Write(z2), Write(eq2), run_time=0.4)
        self.play(Write(num2), Create(bar2), run_time=0.5)
        self.play(Write(den2), run_time=0.4)
        self.wait(0.3)

        # Annotations
        phat_note = Text("p\u0302 = sample proportion", font_size=18, color=YELLOW_3B1B)
        phat_note.next_to(formula_specific, DOWN, buff=0.3, aligned_edge=LEFT)
        p0_note = Text("p\u2080 = null hypothesis value", font_size=18, color=YELLOW_3B1B)
        p0_note.next_to(phat_note, DOWN, buff=0.08, aligned_edge=LEFT)
        n_note = Text("n = sample size", font_size=18, color=YELLOW_3B1B)
        n_note.next_to(p0_note, DOWN, buff=0.08, aligned_edge=LEFT)

        self.play(Write(phat_note), run_time=0.3)
        self.play(Write(p0_note), run_time=0.3)
        self.play(Write(n_note), run_time=0.3)
        self.wait(0.5)

        # ========== KEY RULE: USE p0 ==========
        rule_box_text = Text(
            "Use p\u2080 in the denominator\n(assume H\u2080 is true!)",
            font_size=22, color=GREEN_3B1B,
        )
        rule_box_text.next_to(n_note, DOWN, buff=0.3)
        rule_box = SurroundingRectangle(
            rule_box_text, color=GREEN_3B1B, buff=0.15, corner_radius=0.1,
        )

        self.play(Write(rule_box_text), Create(rule_box), run_time=0.5)
        self.wait(0.5)

        # ========== WORKED EXAMPLE ==========
        self.play(
            FadeOut(VGroup(
                specific_label, formula_specific,
                phat_note, p0_note, n_note,
                rule_box_text, rule_box,
            )),
            run_time=0.4,
        )

        ex_label = Text("Example:", font_size=26, color=ORANGE_3B1B, weight=BOLD)
        ex_label.next_to(title, DOWN, buff=0.3).align_to(LEFT * 5.5, LEFT)
        self.play(Write(ex_label), run_time=0.3)

        ex_data = Text(
            "p\u0302 = 0.60,  p\u2080 = 0.50,  n = 30",
            font_size=26, color=WHITE,
        )
        ex_data.next_to(ex_label, DOWN, buff=0.2)
        self.play(Write(ex_data), run_time=0.4)

        # Calculation steps
        step1 = Text(
            "z = (0.60 \u2212 0.50) / \u221a(0.50 \u00d7 0.50 / 30)",
            font_size=22, color=YELLOW_3B1B,
        )
        step1.next_to(ex_data, DOWN, buff=0.3)
        self.play(Write(step1), run_time=0.5)

        step2 = Text(
            "z = 0.10 / \u221a(0.00833)",
            font_size=22, color=YELLOW_3B1B,
        )
        step2.next_to(step1, DOWN, buff=0.15)
        self.play(Write(step2), run_time=0.4)

        step3 = Text(
            "z = 0.10 / 0.0913 = 1.10",
            font_size=22, color=YELLOW_3B1B,
        )
        step3.next_to(step2, DOWN, buff=0.15)
        self.play(Write(step3), run_time=0.4)
        self.wait(0.3)

        # Result highlight
        result = Text("z = 1.10", font_size=36, color=BLUE_3B1B, weight=BOLD)
        result.next_to(step3, DOWN, buff=0.3)
        result_box = SurroundingRectangle(
            result, color=BLUE_3B1B, buff=0.15, corner_radius=0.1,
        )
        self.play(Write(result), Create(result_box), run_time=0.5)

        meaning = Text(
            "p\u0302 is about 1.1 standard deviations\nabove the null value",
            font_size=20, color=TEAL_3B1B,
        )
        meaning.next_to(result_box, DOWN, buff=0.2)
        self.play(Write(meaning), run_time=0.5)
        self.wait(1.5)

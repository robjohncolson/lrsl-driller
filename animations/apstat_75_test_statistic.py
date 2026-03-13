"""
Calculate the Test Statistic for a Population Mean (AP Stats Unit 7, Topic 7.5)

Shows the t-statistic formula: t = (x-bar - mu0) / (s / sqrt(n)).
Walks through each component, emphasizes using s (not sigma) in the denominator,
and shows a worked example with the Got Hops data.

Run with: manim -qm --format=mp4 apstat_75_test_statistic.py MeanTestStatistic
"""
from manim import *
import numpy as np
import math

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class MeanTestStatistic(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("The t-Test Statistic", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "How far is our sample mean from the null?",
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

        num_text = Text("statistic \u2212 parameter", font_size=28, color=YELLOW_3B1B)
        bar = Line(LEFT * 2.5, RIGHT * 2.5, stroke_width=2, color=WHITE)
        den_text = Text("standard error of the statistic", font_size=22, color=TEAL_3B1B)

        frac = VGroup(num_text, bar, den_text).arrange(DOWN, buff=0.08)
        formula_general = VGroup(frac)
        formula_general.next_to(general_label, DOWN, buff=0.25)

        self.play(Write(num_text), Create(bar), run_time=0.5)
        self.play(Write(den_text), run_time=0.4)
        self.wait(0.5)

        # ========== SPECIFIC FORMULA ==========
        self.play(
            FadeOut(VGroup(general_label, formula_general)),
            run_time=0.4,
        )

        specific_label = Text("For a population mean:", font_size=24, color=GREY_B)
        specific_label.next_to(title, DOWN, buff=0.3).align_to(LEFT * 5, LEFT)
        self.play(Write(specific_label), run_time=0.3)

        t_sym = Text("t", font_size=42, color=BLUE_3B1B, weight=BOLD)
        eq_sym = Text(" = ", font_size=42, color=WHITE)
        num2 = Text("\u0078\u0304 \u2212 \u03bc\u2080", font_size=34, color=YELLOW_3B1B, weight=BOLD)
        bar2 = Line(LEFT * 1.5, RIGHT * 1.5, stroke_width=2, color=WHITE)
        den2 = Text("s / \u221an", font_size=28, color=TEAL_3B1B, weight=BOLD)

        frac2 = VGroup(num2, bar2, den2).arrange(DOWN, buff=0.08)
        formula_specific = VGroup(t_sym, eq_sym, frac2).arrange(RIGHT, buff=0.15)
        formula_specific.next_to(specific_label, DOWN, buff=0.25)

        self.play(Write(t_sym), Write(eq_sym), run_time=0.4)
        self.play(Write(num2), Create(bar2), run_time=0.5)
        self.play(Write(den2), run_time=0.4)
        self.wait(0.3)

        # Annotations
        xbar_note = Text("\u0078\u0304 = sample mean", font_size=18, color=YELLOW_3B1B)
        xbar_note.next_to(formula_specific, DOWN, buff=0.3, aligned_edge=LEFT)
        mu0_note = Text("\u03bc\u2080 = null hypothesis value", font_size=18, color=YELLOW_3B1B)
        mu0_note.next_to(xbar_note, DOWN, buff=0.08, aligned_edge=LEFT)
        s_note = Text("s = sample standard deviation", font_size=18, color=YELLOW_3B1B)
        s_note.next_to(mu0_note, DOWN, buff=0.08, aligned_edge=LEFT)
        n_note = Text("n = sample size", font_size=18, color=YELLOW_3B1B)
        n_note.next_to(s_note, DOWN, buff=0.08, aligned_edge=LEFT)

        self.play(Write(xbar_note), run_time=0.3)
        self.play(Write(mu0_note), run_time=0.3)
        self.play(Write(s_note), run_time=0.3)
        self.play(Write(n_note), run_time=0.3)
        self.wait(0.3)

        # df note
        df_note = Text("df = n \u2212 1", font_size=22, color=GREEN_3B1B, weight=BOLD)
        df_note.next_to(n_note, DOWN, buff=0.25)
        df_box = SurroundingRectangle(df_note, color=GREEN_3B1B, buff=0.12, corner_radius=0.1)
        self.play(Write(df_note), Create(df_box), run_time=0.5)
        self.wait(0.5)

        # ========== WORKED EXAMPLE ==========
        self.play(
            FadeOut(VGroup(
                specific_label, formula_specific,
                xbar_note, mu0_note, s_note, n_note,
                df_note, df_box,
            )),
            run_time=0.4,
        )

        ex_label = Text("Example: Got Hops?", font_size=26, color=ORANGE_3B1B, weight=BOLD)
        ex_label.next_to(title, DOWN, buff=0.3).align_to(LEFT * 5.5, LEFT)
        self.play(Write(ex_label), run_time=0.3)

        ex_data = Text(
            "\u0078\u0304 = 15.8,  \u03bc\u2080 = 15,  s = 2.33,  n = 20",
            font_size=24, color=WHITE,
        )
        ex_data.next_to(ex_label, DOWN, buff=0.2)
        self.play(Write(ex_data), run_time=0.4)

        step1 = Text(
            "t = (15.8 \u2212 15) / (2.33 / \u221a20)",
            font_size=22, color=YELLOW_3B1B,
        )
        step1.next_to(ex_data, DOWN, buff=0.3)
        self.play(Write(step1), run_time=0.5)

        step2 = Text(
            "t = 0.80 / 0.521",
            font_size=22, color=YELLOW_3B1B,
        )
        step2.next_to(step1, DOWN, buff=0.15)
        self.play(Write(step2), run_time=0.4)

        step3 = Text(
            "t = 1.535",
            font_size=22, color=YELLOW_3B1B,
        )
        step3.next_to(step2, DOWN, buff=0.15)
        self.play(Write(step3), run_time=0.4)
        self.wait(0.3)

        result = Text("t = 1.535,  df = 19", font_size=36, color=BLUE_3B1B, weight=BOLD)
        result.next_to(step3, DOWN, buff=0.3)
        result_box = SurroundingRectangle(
            result, color=BLUE_3B1B, buff=0.15, corner_radius=0.1,
        )
        self.play(Write(result), Create(result_box), run_time=0.5)

        meaning = Text(
            "The sample mean is about 1.5 standard errors\nabove the null value",
            font_size=20, color=TEAL_3B1B,
        )
        meaning.next_to(result_box, DOWN, buff=0.2)
        self.play(Write(meaning), run_time=0.5)
        self.wait(1.5)

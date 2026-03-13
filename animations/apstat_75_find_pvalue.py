"""
Find the p-Value for a Population Mean (AP Stats Unit 7, Topic 7.5)

Shows how to compute the p-value from the t-distribution using technology
or Table B. Uses the Got Hops two-sided example (t=1.535, df=19) and the
Tread40 one-sided example (t=6.491, df=34).

Run with: manim -qm --format=mp4 apstat_75_find_pvalue.py MeanTestPValue
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


def t_pdf(x, df):
    coef = math.gamma((df + 1) / 2) / (math.sqrt(df * math.pi) * math.gamma(df / 2))
    return coef * (1 + x**2 / df) ** (-(df + 1) / 2)


class MeanTestPValue(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Finding the p-Value", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Use the t-distribution with df = n \u2212 1",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== EXAMPLE 1: GOT HOPS (two-sided) ==========
        ex1_label = Text(
            "Got Hops:  t = 1.535,  df = 19,  Ha: \u03bc \u2260 15",
            font_size=22, color=ORANGE_3B1B, weight=BOLD,
        )
        ex1_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(ex1_label), run_time=0.4)

        df1 = 19
        axes1 = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 0.42, 0.1],
            x_length=7, y_length=2.3,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.6)

        curve1 = axes1.plot(
            lambda x: t_pdf(x, df1),
            x_range=[-4, 4],
            color=ManimColor(BLUE_3B1B),
        )

        t_val1 = 1.535
        t_line1a = axes1.get_vertical_line(
            axes1.i2gp(-t_val1, curve1),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )
        t_line1b = axes1.get_vertical_line(
            axes1.i2gp(t_val1, curve1),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )

        left_area1 = axes1.get_area(
            curve1, x_range=[-4, -t_val1],
            color=GREEN_3B1B, opacity=0.5,
        )
        right_area1 = axes1.get_area(
            curve1, x_range=[t_val1, 4],
            color=GREEN_3B1B, opacity=0.5,
        )

        self.play(Create(axes1), Create(curve1), run_time=0.5)
        self.play(Create(t_line1a), Create(t_line1b), run_time=0.4)
        self.play(FadeIn(left_area1), FadeIn(right_area1), run_time=0.5)

        # Technology result
        tech_line = Text(
            "Technology: one-tail = 0.0706",
            font_size=20, color=TEAL_3B1B,
        )
        tech_line.next_to(axes1, DOWN, buff=0.25)
        self.play(Write(tech_line), run_time=0.4)

        pval_line = Text(
            "p-value = 2 \u00d7 0.0706 = 0.1412",
            font_size=22, color=GREEN_3B1B, weight=BOLD,
        )
        pval_line.next_to(tech_line, DOWN, buff=0.12)
        self.play(Write(pval_line), run_time=0.5)

        # Table B result
        table_line = Text(
            "Table B: p-value is between 0.10 and 0.20",
            font_size=18, color=GREY_B,
        )
        table_line.next_to(pval_line, DOWN, buff=0.12)
        self.play(Write(table_line), run_time=0.4)
        self.wait(1.0)

        self.play(
            FadeOut(VGroup(
                ex1_label, axes1, curve1, t_line1a, t_line1b,
                left_area1, right_area1,
                tech_line, pval_line, table_line,
            )),
            run_time=0.4,
        )

        # ========== EXAMPLE 2: TREAD40 (one-sided) ==========
        ex2_label = Text(
            "Tread40:  t = 6.491,  df = 34,  Ha: \u03bc > 40000",
            font_size=22, color=ORANGE_3B1B, weight=BOLD,
        )
        ex2_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(ex2_label), run_time=0.4)

        df2 = 34
        axes2 = Axes(
            x_range=[-4, 7, 1],
            y_range=[0, 0.42, 0.1],
            x_length=7, y_length=2.3,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.6)

        curve2 = axes2.plot(
            lambda x: t_pdf(x, df2),
            x_range=[-4, 7],
            color=ManimColor(BLUE_3B1B),
        )

        t_val2 = 6.491
        t_line2 = axes2.get_vertical_line(
            axes2.i2gp(t_val2, curve2),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )
        t_label2 = Text("t = 6.491", font_size=16, color=YELLOW_3B1B, weight=BOLD)
        t_label2.next_to(t_line2, UP, buff=0.1)

        right_area2 = axes2.get_area(
            curve2, x_range=[t_val2, 7],
            color=ORANGE_3B1B, opacity=0.5,
        )

        self.play(Create(axes2), Create(curve2), run_time=0.5)
        self.play(Create(t_line2), Write(t_label2), run_time=0.4)
        self.play(FadeIn(right_area2), run_time=0.5)

        pval2 = Text(
            "p-value \u2248 0.0000001  (essentially zero)",
            font_size=22, color=ORANGE_3B1B, weight=BOLD,
        )
        pval2.next_to(axes2, DOWN, buff=0.25)
        self.play(Write(pval2), run_time=0.5)

        table2 = Text(
            "Table B: p-value < 0.0005",
            font_size=18, color=GREY_B,
        )
        table2.next_to(pval2, DOWN, buff=0.12)
        self.play(Write(table2), run_time=0.4)

        takeaway = Text(
            "Extremely strong evidence against H\u2080",
            font_size=20, color=GREEN_3B1B,
        )
        takeaway.next_to(table2, DOWN, buff=0.15)
        self.play(Write(takeaway), run_time=0.4)
        self.wait(1.5)

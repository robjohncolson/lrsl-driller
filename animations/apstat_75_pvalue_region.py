"""
Identify the p-Value Region (AP Stats Unit 7, Topic 7.5)

Shows how the direction of Ha determines which tail(s) of the
t-distribution contribute to the p-value. Demonstrates all three
cases: right tail, left tail, and both tails.

Run with: manim -qm --format=mp4 apstat_75_pvalue_region.py MeanTestPValueRegion
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


class MeanTestPValueRegion(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Which Tail(s)?", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Match the alternative to the correct region",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== RULE BOX ==========
        self.play(FadeOut(subtitle), run_time=0.3)

        rule = Text(
            "The direction of Ha tells you where to shade",
            font_size=22, color=WHITE,
        )
        rule.next_to(title, DOWN, buff=0.3)
        self.play(Write(rule), run_time=0.5)
        self.wait(0.3)
        self.play(FadeOut(rule), run_time=0.3)

        df = 19  # matching Got Hops example

        # ========== CASE 1: RIGHT TAIL ==========
        case1_label = Text(
            "Ha: \u03bc > \u03bc\u2080  \u2192  right tail",
            font_size=24, color=ORANGE_3B1B, weight=BOLD,
        )
        case1_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(case1_label), run_time=0.4)

        axes1 = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 0.42, 0.1],
            x_length=7, y_length=2.5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.8)

        curve1 = axes1.plot(
            lambda x: t_pdf(x, df),
            x_range=[-4, 4],
            color=ManimColor(BLUE_3B1B),
        )

        t_val = 1.535
        t_line1 = axes1.get_vertical_line(
            axes1.i2gp(t_val, curve1),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )
        t_label1 = Text("t = 1.535", font_size=18, color=YELLOW_3B1B, weight=BOLD)
        t_label1.next_to(t_line1, DOWN, buff=0.1)

        right_area = axes1.get_area(
            curve1, x_range=[t_val, 4],
            color=ORANGE_3B1B, opacity=0.5,
        )

        shade_note1 = Text(
            "P(t \u2265 1.535)",
            font_size=20, color=ORANGE_3B1B, weight=BOLD,
        )
        shade_note1.next_to(axes1, DOWN, buff=0.3)

        self.play(Create(axes1), Create(curve1), run_time=0.5)
        self.play(Create(t_line1), Write(t_label1), run_time=0.4)
        self.play(FadeIn(right_area), run_time=0.5)
        self.play(Write(shade_note1), run_time=0.4)
        self.wait(0.8)

        self.play(
            FadeOut(VGroup(
                case1_label, axes1, curve1, t_line1, t_label1,
                right_area, shade_note1,
            )),
            run_time=0.4,
        )

        # ========== CASE 2: LEFT TAIL ==========
        case2_label = Text(
            "Ha: \u03bc < \u03bc\u2080  \u2192  left tail",
            font_size=24, color=PINK_3B1B, weight=BOLD,
        )
        case2_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(case2_label), run_time=0.4)

        axes2 = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 0.42, 0.1],
            x_length=7, y_length=2.5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.8)

        curve2 = axes2.plot(
            lambda x: t_pdf(x, df),
            x_range=[-4, 4],
            color=ManimColor(BLUE_3B1B),
        )

        t_line2 = axes2.get_vertical_line(
            axes2.i2gp(-t_val, curve2),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )
        t_label2 = Text("t = \u22121.535", font_size=18, color=YELLOW_3B1B, weight=BOLD)
        t_label2.next_to(t_line2, DOWN, buff=0.1)

        left_area = axes2.get_area(
            curve2, x_range=[-4, -t_val],
            color=PINK_3B1B, opacity=0.5,
        )

        shade_note2 = Text(
            "P(t \u2264 \u22121.535)",
            font_size=20, color=PINK_3B1B, weight=BOLD,
        )
        shade_note2.next_to(axes2, DOWN, buff=0.3)

        self.play(Create(axes2), Create(curve2), run_time=0.5)
        self.play(Create(t_line2), Write(t_label2), run_time=0.4)
        self.play(FadeIn(left_area), run_time=0.5)
        self.play(Write(shade_note2), run_time=0.4)
        self.wait(0.8)

        self.play(
            FadeOut(VGroup(
                case2_label, axes2, curve2, t_line2, t_label2,
                left_area, shade_note2,
            )),
            run_time=0.4,
        )

        # ========== CASE 3: BOTH TAILS ==========
        case3_label = Text(
            "Ha: \u03bc \u2260 \u03bc\u2080  \u2192  both tails",
            font_size=24, color=GREEN_3B1B, weight=BOLD,
        )
        case3_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(case3_label), run_time=0.4)

        axes3 = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 0.42, 0.1],
            x_length=7, y_length=2.5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.8)

        curve3 = axes3.plot(
            lambda x: t_pdf(x, df),
            x_range=[-4, 4],
            color=ManimColor(BLUE_3B1B),
        )

        t_line3a = axes3.get_vertical_line(
            axes3.i2gp(-t_val, curve3),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )
        t_line3b = axes3.get_vertical_line(
            axes3.i2gp(t_val, curve3),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )
        t_label3a = Text("\u22121.535", font_size=16, color=YELLOW_3B1B, weight=BOLD)
        t_label3a.next_to(t_line3a, DOWN, buff=0.1)
        t_label3b = Text("1.535", font_size=16, color=YELLOW_3B1B, weight=BOLD)
        t_label3b.next_to(t_line3b, DOWN, buff=0.1)

        left_area3 = axes3.get_area(
            curve3, x_range=[-4, -t_val],
            color=GREEN_3B1B, opacity=0.5,
        )
        right_area3 = axes3.get_area(
            curve3, x_range=[t_val, 4],
            color=GREEN_3B1B, opacity=0.5,
        )

        shade_note3 = Text(
            "P(t \u2264 \u22121.535) + P(t \u2265 1.535)",
            font_size=20, color=GREEN_3B1B, weight=BOLD,
        )
        shade_note3.next_to(axes3, DOWN, buff=0.3)

        double_note = Text(
            "Or: 2 \u00d7 P(t \u2265 1.535)",
            font_size=18, color=GREY_B,
        )
        double_note.next_to(shade_note3, DOWN, buff=0.1)

        self.play(Create(axes3), Create(curve3), run_time=0.5)
        self.play(
            Create(t_line3a), Write(t_label3a),
            Create(t_line3b), Write(t_label3b),
            run_time=0.4,
        )
        self.play(FadeIn(left_area3), FadeIn(right_area3), run_time=0.5)
        self.play(Write(shade_note3), run_time=0.4)
        self.play(Write(double_note), run_time=0.3)
        self.wait(1.5)

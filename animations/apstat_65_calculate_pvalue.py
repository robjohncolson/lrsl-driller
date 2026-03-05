"""
Calculate the p-Value (AP Stats Unit 6, Topic 6.5)

Shows how to convert a z-score into a p-value using the standard normal
distribution. Demonstrates one-sided (right tail, left tail) and two-sided
(both tails) cases with shaded areas under the curve.

Run with: manim -qm --format=mp4 apstat_65_calculate_pvalue.py CalculatePValue
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


class CalculatePValue(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Finding the p-Value", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "How likely is our result by chance alone?",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== DEFINITION ==========
        self.play(FadeOut(subtitle), run_time=0.3)

        defn = Text(
            "The p-value is the probability of getting\n"
            "evidence as strong or stronger than observed,\n"
            "by chance alone, when H\u2080 is true.",
            font_size=22, color=WHITE, line_spacing=1.3,
        )
        defn.next_to(title, DOWN, buff=0.3)
        self.play(Write(defn), run_time=0.8)
        self.wait(0.5)
        self.play(FadeOut(defn), run_time=0.3)

        # ========== CASE 1: RIGHT TAIL (Ha: p > p0) ==========
        case1_label = Text(
            "Case 1: H\u2090: p > p\u2080  (right tail)",
            font_size=24, color=ORANGE_3B1B, weight=BOLD,
        )
        case1_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(case1_label), run_time=0.4)

        axes1 = Axes(
            x_range=[-3.5, 3.5, 1],
            y_range=[0, 0.45, 0.1],
            x_length=7, y_length=2.5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.8)

        curve1 = axes1.plot(
            lambda x: (1 / np.sqrt(2 * np.pi)) * np.exp(-0.5 * x**2),
            x_range=[-3.5, 3.5],
            color=ManimColor(BLUE_3B1B),
        )

        z_val = 1.10
        z_line1 = axes1.get_vertical_line(
            axes1.i2gp(z_val, curve1),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )
        z_label1 = Text(f"z = {z_val}", font_size=20, color=YELLOW_3B1B, weight=BOLD)
        z_label1.next_to(z_line1, DOWN, buff=0.1)

        # Shade right tail
        right_area = axes1.get_area(
            curve1,
            x_range=[z_val, 3.5],
            color=ORANGE_3B1B,
            opacity=0.5,
        )

        pval_text1 = Text(
            "p-value = P(Z \u2265 1.10) = 0.1357",
            font_size=22, color=ORANGE_3B1B, weight=BOLD,
        )
        pval_text1.next_to(axes1, DOWN, buff=0.3)

        self.play(Create(axes1), Create(curve1), run_time=0.5)
        self.play(Create(z_line1), Write(z_label1), run_time=0.4)
        self.play(FadeIn(right_area), run_time=0.5)
        self.play(Write(pval_text1), run_time=0.5)
        self.wait(0.8)

        # ========== TRANSITION TO CASE 2 ==========
        self.play(
            FadeOut(VGroup(
                case1_label, axes1, curve1, z_line1, z_label1,
                right_area, pval_text1,
            )),
            run_time=0.4,
        )

        # ========== CASE 2: LEFT TAIL (Ha: p < p0) ==========
        case2_label = Text(
            "Case 2: H\u2090: p < p\u2080  (left tail)",
            font_size=24, color=PINK_3B1B, weight=BOLD,
        )
        case2_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(case2_label), run_time=0.4)

        axes2 = Axes(
            x_range=[-3.5, 3.5, 1],
            y_range=[0, 0.45, 0.1],
            x_length=7, y_length=2.5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.8)

        curve2 = axes2.plot(
            lambda x: (1 / np.sqrt(2 * np.pi)) * np.exp(-0.5 * x**2),
            x_range=[-3.5, 3.5],
            color=ManimColor(BLUE_3B1B),
        )

        z_val2 = -2.25
        z_line2 = axes2.get_vertical_line(
            axes2.i2gp(z_val2, curve2),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )
        z_label2 = Text(f"z = {z_val2}", font_size=20, color=YELLOW_3B1B, weight=BOLD)
        z_label2.next_to(z_line2, DOWN, buff=0.1)

        left_area = axes2.get_area(
            curve2,
            x_range=[-3.5, z_val2],
            color=PINK_3B1B,
            opacity=0.5,
        )

        pval_text2 = Text(
            "p-value = P(Z \u2264 \u22122.25) = 0.0122",
            font_size=22, color=PINK_3B1B, weight=BOLD,
        )
        pval_text2.next_to(axes2, DOWN, buff=0.3)

        self.play(Create(axes2), Create(curve2), run_time=0.5)
        self.play(Create(z_line2), Write(z_label2), run_time=0.4)
        self.play(FadeIn(left_area), run_time=0.5)
        self.play(Write(pval_text2), run_time=0.5)
        self.wait(0.8)

        # ========== TRANSITION TO CASE 3 ==========
        self.play(
            FadeOut(VGroup(
                case2_label, axes2, curve2, z_line2, z_label2,
                left_area, pval_text2,
            )),
            run_time=0.4,
        )

        # ========== CASE 3: BOTH TAILS (Ha: p != p0) ==========
        case3_label = Text(
            "Case 3: H\u2090: p \u2260 p\u2080  (both tails)",
            font_size=24, color=GREEN_3B1B, weight=BOLD,
        )
        case3_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(case3_label), run_time=0.4)

        axes3 = Axes(
            x_range=[-3.5, 3.5, 1],
            y_range=[0, 0.45, 0.1],
            x_length=7, y_length=2.5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.8)

        curve3 = axes3.plot(
            lambda x: (1 / np.sqrt(2 * np.pi)) * np.exp(-0.5 * x**2),
            x_range=[-3.5, 3.5],
            color=ManimColor(BLUE_3B1B),
        )

        z_val3 = -2.25
        z_line3a = axes3.get_vertical_line(
            axes3.i2gp(z_val3, curve3),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )
        z_line3b = axes3.get_vertical_line(
            axes3.i2gp(-z_val3, curve3),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )

        z_label3a = Text(f"z = {z_val3}", font_size=18, color=YELLOW_3B1B, weight=BOLD)
        z_label3a.next_to(z_line3a, DOWN, buff=0.1)
        z_label3b = Text(f"z = {-z_val3}", font_size=18, color=YELLOW_3B1B, weight=BOLD)
        z_label3b.next_to(z_line3b, DOWN, buff=0.1)

        left_area3 = axes3.get_area(
            curve3,
            x_range=[-3.5, z_val3],
            color=GREEN_3B1B,
            opacity=0.5,
        )
        right_area3 = axes3.get_area(
            curve3,
            x_range=[-z_val3, 3.5],
            color=GREEN_3B1B,
            opacity=0.5,
        )

        pval_text3 = Text(
            "p-value = 2 \u00d7 0.0122 = 0.0244",
            font_size=22, color=GREEN_3B1B, weight=BOLD,
        )
        pval_text3.next_to(axes3, DOWN, buff=0.3)

        double_note = Text(
            "Double the one-tail area!",
            font_size=18, color=GREY_B,
        )
        double_note.next_to(pval_text3, DOWN, buff=0.1)

        self.play(Create(axes3), Create(curve3), run_time=0.5)
        self.play(
            Create(z_line3a), Write(z_label3a),
            Create(z_line3b), Write(z_label3b),
            run_time=0.4,
        )
        self.play(FadeIn(left_area3), FadeIn(right_area3), run_time=0.5)
        self.play(Write(pval_text3), run_time=0.5)
        self.play(Write(double_note), run_time=0.3)
        self.wait(1.5)

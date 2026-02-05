"""
Linear Combination Full Problem Animation (Unit 5, Topic 5.2g)

Walks through a complete linear combination probability problem step by step:
"Two machine parts, X~N(50,3) and Y~N(48,4). Find P(X-Y < 0)."
Shows all three distributions (X, Y, D=X-Y), the z-score calculation,
and the shaded area for the final probability.

To render:
    manim -qm --format=mp4 linear_combo_full_problem.py LinearComboProbability
"""

from manim import *
import numpy as np
from scipy.stats import norm

# 3Blue1Brown-style colors
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class LinearComboProbability(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ── Title ──
        title = Text("Linear Combination: Full Problem",
                      font_size=44, color=WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ── Problem statement ──
        problem = VGroup(
            Text("Machine Part X ~ N(50, 3)", font_size=26, color=BLUE_3B1B),
            Text("Machine Part Y ~ N(48, 4)", font_size=26, color=YELLOW_3B1B),
            Text("Find P(X - Y < 0)", font_size=28, color=WHITE, weight=BOLD),
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        problem.next_to(title, DOWN, buff=0.3)

        for line in problem:
            self.play(Write(line), run_time=0.4)
        self.wait(0.5)

        # Helper: build a small filled normal curve
        def make_normal_curve(ax, mu, sigma, color, n_pts=200):
            lo = mu - 4 * sigma
            hi = mu + 4 * sigma
            xs = np.linspace(lo, hi, n_pts)
            ys = norm.pdf(xs, mu, sigma)
            top_pts = [ax.c2p(x, y) for x, y in zip(xs, ys)]
            base_r = ax.c2p(hi, 0)
            base_l = ax.c2p(lo, 0)
            poly = Polygon(
                *top_pts, base_r, base_l,
                stroke_color=color, stroke_width=2,
                fill_color=color, fill_opacity=0.3,
            )
            return poly

        # ── Show X and Y distributions ──
        ax_x = Axes(
            x_range=[38, 62, 4],
            y_range=[0, 0.15, 0.05],
            x_length=3.0,
            y_length=1.5,
            axis_config={"include_tip": False, "include_numbers": False,
                         "stroke_width": 1.2},
        )
        ax_x.shift(LEFT * 4.5 + DOWN * 1.2)
        curve_x = make_normal_curve(ax_x, 50, 3, BLUE_3B1B)
        lbl_x = Text("X ~ N(50, 3)", font_size=22, color=BLUE_3B1B)
        lbl_x.next_to(ax_x, DOWN, buff=0.08)

        ax_y = Axes(
            x_range=[36, 60, 4],
            y_range=[0, 0.12, 0.04],
            x_length=3.0,
            y_length=1.5,
            axis_config={"include_tip": False, "include_numbers": False,
                         "stroke_width": 1.2},
        )
        ax_y.shift(LEFT * 0.5 + DOWN * 1.2)
        curve_y = make_normal_curve(ax_y, 48, 4, YELLOW_3B1B)
        lbl_y = Text("Y ~ N(48, 4)", font_size=22, color=YELLOW_3B1B)
        lbl_y.next_to(ax_y, DOWN, buff=0.08)

        self.play(
            Create(ax_x), FadeIn(curve_x), Write(lbl_x),
            Create(ax_y), FadeIn(curve_y), Write(lbl_y),
            run_time=0.8,
        )
        self.wait(0.5)

        # ── STEP 1: Mean of D = X - Y ──
        step1_header = Text("Step 1: Mean of D = X - Y",
                            font_size=26, color=TEAL_3B1B, weight=BOLD)
        step1_header.to_edge(RIGHT, buff=0.4).shift(UP * 1.3)

        step1_calc = VGroup(
            Text("μD", font_size=28, color=GREEN_3B1B),
            Text(" = ", font_size=28),
            Text("μX", font_size=28, color=BLUE_3B1B),
            Text(" - ", font_size=28),
            Text("μY", font_size=28, color=YELLOW_3B1B),
            Text(" = ", font_size=28),
            Text("50", font_size=28, color=BLUE_3B1B),
            Text(" - ", font_size=28),
            Text("48", font_size=28, color=YELLOW_3B1B),
            Text(" = ", font_size=28),
            Text("2", font_size=28, color=GREEN_3B1B),
        ).arrange(RIGHT, buff=0.05)
        step1_calc.next_to(step1_header, DOWN, buff=0.15)

        self.play(Write(step1_header), run_time=0.4)
        self.play(Write(step1_calc), run_time=0.6)
        self.wait(0.3)

        # ── STEP 2: SD of D ──
        step2_header = Text("Step 2: SD of D",
                            font_size=26, color=PINK_3B1B, weight=BOLD)
        step2_header.next_to(step1_calc, DOWN, buff=0.3)

        step2_line1 = Text("σD = √(σX² + σY²)", font_size=26)
        step2_line1.next_to(step2_header, DOWN, buff=0.12)

        step2_line2 = Text("= √(3² + 4²) = √(9 + 16) = √25 = 5",
            font_size=26, color=GREEN_3B1B)
        step2_line2.next_to(step2_line1, DOWN, buff=0.1)

        # Variance-add reminder
        reminder = Text("(Variances ADD, even for subtraction!)",
                        font_size=18, color=RED)
        reminder.next_to(step2_line2, DOWN, buff=0.08)

        self.play(Write(step2_header), run_time=0.3)
        self.play(Write(step2_line1), run_time=0.5)
        self.play(Write(step2_line2), run_time=0.6)
        self.play(Write(reminder), run_time=0.3)
        self.wait(0.5)

        # ── STEP 3: Draw D ~ N(2, 5) ──
        # Clear the two small curves and steps
        self.play(
            *[FadeOut(m) for m in [
                problem, ax_x, curve_x, lbl_x,
                ax_y, curve_y, lbl_y,
                step1_header, step1_calc,
                step2_header, step2_line1, step2_line2, reminder,
            ]]
        )

        step3_header = Text("Step 3: D ~ N(2, 5)",
                            font_size=30, color=GREEN_3B1B, weight=BOLD)
        step3_header.next_to(title, DOWN, buff=0.3)
        self.play(Write(step3_header))

        # Large axes for D
        ax_d = Axes(
            x_range=[-18, 22, 5],
            y_range=[0, 0.09, 0.02],
            x_length=10,
            y_length=3.2,
            axis_config={"include_tip": False, "include_numbers": True,
                         "stroke_width": 1.5, "font_size": 18},
            x_axis_config={"numbers_to_include": list(range(-15, 21, 5))},
        )
        ax_d.shift(DOWN * 0.8)

        curve_d = make_normal_curve(ax_d, 2, 5, GREEN_3B1B)

        # Mark the mean
        mean_line = DashedLine(
            ax_d.c2p(2, 0), ax_d.c2p(2, 0.085),
            color=GREEN_3B1B, stroke_width=2,
        )
        mean_lbl = Text("μD = 2", font_size=22, color=GREEN_3B1B)
        mean_lbl.next_to(mean_line, UP, buff=0.05)

        self.play(Create(ax_d), FadeIn(curve_d), run_time=0.7)
        self.play(Create(mean_line), Write(mean_lbl), run_time=0.4)
        self.wait(0.3)

        # ── STEP 4: Z-score ──
        step4_header = Text("Step 4: Z-score",
                            font_size=26, color=TEAL_3B1B, weight=BOLD)
        step4_header.to_corner(UR, buff=0.4).shift(DOWN * 0.8)

        z_calc = VGroup(
            Text("z", font_size=30, color=TEAL_3B1B),
            Text(" = ", font_size=30),
            Text("(0 - 2) / 5", font_size=30),
            Text(" = ", font_size=30),
            Text("-2/5", font_size=30),
            Text(" = ", font_size=30),
            Text("-0.4", font_size=30, color=TEAL_3B1B),
        ).arrange(RIGHT, buff=0.05)
        z_calc.next_to(step4_header, DOWN, buff=0.15)

        # Mark x = 0 on the curve
        zero_line = DashedLine(
            ax_d.c2p(0, 0), ax_d.c2p(0, 0.078),
            color=RED, stroke_width=2,
        )
        zero_lbl = Text("D = 0", font_size=20, color=RED)
        zero_lbl.next_to(zero_line, UP, buff=0.05)

        self.play(Create(zero_line), Write(zero_lbl), run_time=0.4)
        self.play(Write(step4_header), run_time=0.3)
        self.play(Write(z_calc), run_time=0.6)
        self.wait(0.5)

        # ── STEP 5: Shade area P(D < 0) ──
        step5_header = Text("Step 5: P(D < 0) = P(Z < -0.4)",
                            font_size=24, color=PINK_3B1B, weight=BOLD)
        step5_header.next_to(z_calc, DOWN, buff=0.3)
        self.play(Write(step5_header), run_time=0.4)

        # Build shaded region for D < 0
        shade_xs = np.linspace(-18, 0, 150)
        shade_ys = norm.pdf(shade_xs, 2, 5)
        shade_pts = [ax_d.c2p(x, y) for x, y in zip(shade_xs, shade_ys)]
        shade_base_r = ax_d.c2p(0, 0)
        shade_base_l = ax_d.c2p(-18, 0)
        shaded = Polygon(
            *shade_pts, shade_base_r, shade_base_l,
            stroke_color=RED, stroke_width=1,
            fill_color=RED, fill_opacity=0.45,
        )

        self.play(FadeIn(shaded), run_time=0.8)

        # Final probability
        prob_result = Text("P(Z < -0.4) ≈ 0.3446",
            font_size=32, color=YELLOW_3B1B)
        prob_result.next_to(step5_header, DOWN, buff=0.2)
        self.play(Write(prob_result), run_time=0.5)

        # Interpretation
        interp = Text(
            "About 34.5% chance that Y exceeds X",
            font_size=22, color=WHITE,
        )
        interp.next_to(prob_result, DOWN, buff=0.12)
        self.play(Write(interp), run_time=0.5)
        self.wait(0.8)

        # ── Clear and show Key Insight ──
        self.play(
            *[FadeOut(m) for m in [
                step3_header, ax_d, curve_d, mean_line, mean_lbl,
                zero_line, zero_lbl, shaded,
                step4_header, z_calc,
                step5_header, prob_result, interp,
            ]]
        )

        # Key insight
        insight = VGroup(
            Text("Key Insight", font_size=32, color=YELLOW_3B1B, weight=BOLD),
            Text("Combine distributions", font_size=24, color=WHITE),
            Text("↓", font_size=28, color=GRAY),
            Text("New Normal", font_size=24, color=GREEN_3B1B),
            Text("↓", font_size=28, color=GRAY),
            Text("Z-score", font_size=24, color=TEAL_3B1B),
            Text("↓", font_size=28, color=GRAY),
            Text("Probability", font_size=24, color=PINK_3B1B),
        ).arrange(DOWN, buff=0.12)
        insight.next_to(title, DOWN, buff=0.5)

        box = SurroundingRectangle(
            insight, color=YELLOW_3B1B, buff=0.25, corner_radius=0.15,
        )

        self.play(Write(insight), Create(box), run_time=1.2)
        self.wait(2)

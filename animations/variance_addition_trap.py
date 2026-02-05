"""
The Variance Addition Trap Animation (Unit 5, Topic 5.2f)

THE #1 student mistake: when combining distributions, variances always ADD
even when you SUBTRACT the random variables. Shows the wrong way, then
the right way with a geometric "areas of squares" metaphor.

To render:
    manim -qm --format=mp4 variance_addition_trap.py VarianceAdditionTrap
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


class VarianceAdditionTrap(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ── Title ──
        title = Text("THE VARIANCE TRAP", font_size=52, color=RED, weight=BOLD)
        subtitle = Text("The #1 Student Mistake", font_size=28, color=YELLOW_3B1B)
        title.to_edge(UP, buff=0.3)
        subtitle.next_to(title, DOWN, buff=0.1)

        self.play(Write(title), Write(subtitle))
        self.wait(0.5)

        # ── Two distributions side by side ──
        # X distribution
        ax_x = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 0.45, 0.1],
            x_length=3.2,
            y_length=1.8,
            axis_config={"include_tip": False, "include_numbers": False,
                         "stroke_width": 1.5},
        )
        ax_x.shift(LEFT * 3.5 + UP * 0.8)

        xs = np.linspace(-4, 4, 200)
        ys_x = norm.pdf(xs, 0, 1)
        curve_x_pts = [ax_x.c2p(x, y) for x, y in zip(xs, ys_x)]
        curve_x = VMobject(stroke_color=BLUE_3B1B, stroke_width=2.5,
                           fill_color=BLUE_3B1B, fill_opacity=0.25)
        # Build filled shape
        baseline_x = [ax_x.c2p(xs[-1], 0), ax_x.c2p(xs[0], 0)]
        curve_x_poly = Polygon(
            *curve_x_pts, *baseline_x,
            stroke_color=BLUE_3B1B, stroke_width=2.5,
            fill_color=BLUE_3B1B, fill_opacity=0.25,
        )

        x_label = Text("X", font_size=36, color=BLUE_3B1B)
        x_label.next_to(ax_x, UP, buff=0.05)
        x_params = Text("σX = 5", font_size=26, color=BLUE_3B1B)
        x_params.next_to(ax_x, DOWN, buff=0.05)

        # Y distribution
        ax_y = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 0.45, 0.1],
            x_length=3.2,
            y_length=1.8,
            axis_config={"include_tip": False, "include_numbers": False,
                         "stroke_width": 1.5},
        )
        ax_y.shift(RIGHT * 3.5 + UP * 0.8)

        ys_y = norm.pdf(xs, 0, 1)
        curve_y_poly = Polygon(
            *[ax_y.c2p(x, y) for x, y in zip(xs, ys_y)],
            ax_y.c2p(xs[-1], 0), ax_y.c2p(xs[0], 0),
            stroke_color=YELLOW_3B1B, stroke_width=2.5,
            fill_color=YELLOW_3B1B, fill_opacity=0.25,
        )

        y_label = Text("Y", font_size=36, color=YELLOW_3B1B)
        y_label.next_to(ax_y, UP, buff=0.05)
        y_params = Text("σY = 4", font_size=26, color=YELLOW_3B1B)
        y_params.next_to(ax_y, DOWN, buff=0.05)

        self.play(
            Create(ax_x), FadeIn(curve_x_poly), Write(x_label), Write(x_params),
            Create(ax_y), FadeIn(curve_y_poly), Write(y_label), Write(y_params),
            run_time=0.8,
        )
        self.wait(0.3)

        # ── Means: simple subtraction (intuitive) ──
        mean_header = Text("For MEANS: straightforward", font_size=26,
                           color=TEAL_3B1B)
        mean_header.shift(DOWN * 0.4)

        mean_formula = VGroup(
            Text("μ(X-Y)", font_size=36, color=GREEN_3B1B),
            Text(" = ", font_size=36),
            Text("μX", font_size=36, color=BLUE_3B1B),
            Text(" - ", font_size=36),
            Text("μY", font_size=36, color=YELLOW_3B1B),
        ).arrange(RIGHT, buff=0.08)
        mean_formula.next_to(mean_header, DOWN, buff=0.15)

        self.play(Write(mean_header), run_time=0.4)
        self.play(Write(mean_formula), run_time=0.5)

        mean_check = Text("✓", font_size=36, color=GREEN)
        mean_check.next_to(mean_formula, RIGHT, buff=0.3)
        self.play(Write(mean_check), run_time=0.3)
        self.wait(0.5)

        # ── The TRAP: standard deviations ──
        # Clear means section
        self.play(FadeOut(mean_header), FadeOut(mean_formula), FadeOut(mean_check))

        trap_header = Text("For STANDARD DEVIATIONS...", font_size=28,
                           color=RED, weight=BOLD)
        trap_header.shift(DOWN * 0.3)
        self.play(Write(trap_header))
        self.wait(0.3)

        # WRONG way
        wrong_label = Text("WRONG", font_size=28, color=RED, weight=BOLD)
        wrong_label.shift(LEFT * 3 + DOWN * 1.1)

        wrong_calc = VGroup(
            Text("σ(X-Y)", font_size=30),
            Text(" = ", font_size=30),
            Text("σX", font_size=30, color=BLUE_3B1B),
            Text(" - ", font_size=30),
            Text("σY", font_size=30, color=YELLOW_3B1B),
            Text(" = ", font_size=30),
            Text("5", font_size=30, color=BLUE_3B1B),
            Text(" - ", font_size=30),
            Text("4", font_size=30, color=YELLOW_3B1B),
            Text(" = ", font_size=30),
            Text("1", font_size=30, color=RED),
        ).arrange(RIGHT, buff=0.04)
        wrong_calc.next_to(wrong_label, DOWN, buff=0.15)

        self.play(Write(wrong_label), run_time=0.3)
        self.play(Write(wrong_calc), run_time=0.6)

        cross = Cross(wrong_calc, stroke_color=RED, stroke_width=8)
        self.play(Create(cross), run_time=0.4)
        self.wait(0.5)

        # ── RIGHT way ──
        self.play(
            FadeOut(wrong_label), FadeOut(wrong_calc), FadeOut(cross),
            FadeOut(trap_header),
        )

        right_header = Text("RIGHT WAY: Work with VARIANCES!",
                            font_size=28, color=GREEN, weight=BOLD)
        right_header.shift(DOWN * 0.2)
        self.play(Write(right_header))

        step1 = Text(
            "1. Square:  σX² = 5² = 25,   σY² = 4² = 16",
            font_size=26,
        )
        step1.next_to(right_header, DOWN, buff=0.25)

        step2 = Text(
            "2. ADD variances:  Var(X-Y) = 25 + 16 = 41",
            font_size=26,
        )
        step2.next_to(step1, DOWN, buff=0.15)

        step3 = Text(
            "3. Square root:  σ(X-Y) = √41 ≈ 6.40",
            font_size=26, color=GREEN,
        )
        step3.next_to(step2, DOWN, buff=0.15)

        for s in [step1, step2, step3]:
            self.play(Write(s), run_time=0.5)
            self.wait(0.2)

        self.wait(0.5)

        # Clear calculation steps
        self.play(
            FadeOut(right_header), FadeOut(step1), FadeOut(step2), FadeOut(step3),
            FadeOut(ax_x), FadeOut(curve_x_poly), FadeOut(x_label), FadeOut(x_params),
            FadeOut(ax_y), FadeOut(curve_y_poly), FadeOut(y_label), FadeOut(y_params),
        )

        # ── VISUAL METAPHOR: Variances are areas of squares ──
        meta_title = Text("WHY? Variances are AREAS",
                          font_size=32, color=TEAL_3B1B, weight=BOLD)
        meta_title.next_to(title, DOWN, buff=0.3)
        self.play(Write(meta_title))

        # Square for sigma_X = 5  (area = 25)
        sq_x_size = 2.0  # visual side length
        sq_x = Square(
            side_length=sq_x_size,
            fill_color=BLUE_3B1B,
            fill_opacity=0.4,
            stroke_color=BLUE_3B1B,
            stroke_width=3,
        )
        sq_x.shift(LEFT * 2.5 + DOWN * 0.6)

        sq_x_side = Text("σX = 5", font_size=22, color=BLUE_3B1B)
        sq_x_side.next_to(sq_x, LEFT, buff=0.1)
        sq_x_area = Text("σX² = 25", font_size=24, color=BLUE_3B1B)
        sq_x_area.move_to(sq_x)

        # Square for sigma_Y = 4  (area = 16)
        sq_y_size = 1.6
        sq_y = Square(
            side_length=sq_y_size,
            fill_color=YELLOW_3B1B,
            fill_opacity=0.4,
            stroke_color=YELLOW_3B1B,
            stroke_width=3,
        )
        sq_y.shift(RIGHT * 1.5 + DOWN * 0.8)

        sq_y_side = Text("σY = 4", font_size=22, color=YELLOW_3B1B)
        sq_y_side.next_to(sq_y, RIGHT, buff=0.1)
        sq_y_area = Text("σY² = 16", font_size=24, color=YELLOW_3B1B)
        sq_y_area.move_to(sq_y)

        self.play(
            FadeIn(sq_x), Write(sq_x_side), Write(sq_x_area),
            FadeIn(sq_y), Write(sq_y_side), Write(sq_y_area),
            run_time=0.8,
        )
        self.wait(0.5)

        # Plus sign between areas
        plus = Text("+", font_size=48, color=WHITE)
        plus.move_to((sq_x.get_right() + sq_y.get_left()) / 2)
        self.play(Write(plus), run_time=0.3)

        # Arrow pointing down to combined square
        combined_text = Text(
            "Total area = 25 + 16 = 41",
            font_size=26, color=GREEN_3B1B,
        )
        combined_text.shift(DOWN * 2.5)
        self.play(Write(combined_text), run_time=0.5)

        # New SD = side of combined square
        new_sd = Text(
            "σ(X-Y) = √41 ≈ 6.40",
            font_size=28, color=GREEN,
        )
        new_sd.next_to(combined_text, DOWN, buff=0.15)
        self.play(Write(new_sd), run_time=0.5)
        self.wait(0.5)

        # Clear metaphor
        self.play(
            *[FadeOut(m) for m in [
                meta_title, sq_x, sq_x_side, sq_x_area,
                sq_y, sq_y_side, sq_y_area,
                plus, combined_text, new_sd,
            ]]
        )

        # ── Big emphasis ──
        big_msg = Text(
            "VARIANCES ALWAYS ADD",
            font_size=48, color=RED, weight=BOLD,
        )
        big_msg.shift(UP * 0.2)
        even_msg = Text(
            "even for DIFFERENCES!",
            font_size=36, color=YELLOW_3B1B, weight=BOLD,
        )
        even_msg.next_to(big_msg, DOWN, buff=0.2)

        self.play(Write(big_msg), run_time=0.6)
        self.play(Write(even_msg), run_time=0.5)

        # Flash effect
        for _ in range(3):
            self.play(
                big_msg.animate.set_color(YELLOW),
                run_time=0.2,
            )
            self.play(
                big_msg.animate.set_color(RED),
                run_time=0.2,
            )

        self.wait(0.3)
        self.play(FadeOut(big_msg), FadeOut(even_msg))

        # ── Key Insight Box ──
        formula_box_content = VGroup(
            Text("Key Insight", font_size=28, color=YELLOW_3B1B, weight=BOLD),
            Text("σ(X±Y) = √(σX² + σY²)", font_size=40),
            Text("Square, ADD, Root  (never subtract variances!)",
                 font_size=22, color=WHITE),
        ).arrange(DOWN, buff=0.2)
        formula_box_content.next_to(title, DOWN, buff=0.8)

        box = SurroundingRectangle(
            formula_box_content, color=GREEN, buff=0.25, corner_radius=0.15,
        )

        self.play(Write(formula_box_content), Create(box))
        self.wait(2)

"""
THE VARIANCE TRAP (Sum) Animation

Demonstrates that σ(X+Y) = √(σX² + σY²) ≠ σX + σY
The most common mistake in combining random variables!

To render:
manim -qm --format=mp4 l45_variance_trap_sum.py VarianceTrapSum
"""

from manim import *
import numpy as np

# 3Blue1Brown-style colors
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"

class VarianceTrapSum(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # Title with warning
        title = Text("THE VARIANCE TRAP", font_size=52, color=RED, weight=BOLD)
        warning = Text("(Sum of SDs)", font_size=32, color=YELLOW_3B1B)
        title.to_edge(UP, buff=0.3)
        warning.next_to(title, DOWN, buff=0.1)

        self.play(Write(title), Write(warning))
        self.wait(0.3)

        # Given values
        given = VGroup(
            MathTex(r"\sigma_X = 3", font_size=36, color=BLUE_3B1B),
            MathTex(r"\sigma_Y = 4", font_size=36, color=YELLOW_3B1B)
        ).arrange(RIGHT, buff=1.5)
        given.shift(UP * 1.5)

        self.play(Write(given))
        self.wait(0.3)

        # Question
        question = MathTex(r"\text{Find } \sigma_{X+Y} = ?", font_size=40)
        question.shift(UP * 0.5)
        self.play(Write(question))
        self.wait(0.5)

        # WRONG WAY Section
        wrong_header = Text("WRONG WAY", font_size=36, color=RED, weight=BOLD)
        wrong_header.shift(LEFT * 3 + DOWN * 0.5)

        self.play(Write(wrong_header))

        # Wrong calculation
        wrong_calc = MathTex("3", "+", "4", "=", "7", font_size=44)
        wrong_calc[0].set_color(BLUE_3B1B)
        wrong_calc[2].set_color(YELLOW_3B1B)
        wrong_calc[4].set_color(RED)
        wrong_calc.next_to(wrong_header, DOWN, buff=0.3)

        self.play(Write(wrong_calc))

        # Big red X
        cross = Cross(wrong_calc, stroke_color=RED, stroke_width=8)
        self.play(Create(cross))

        wrong_msg = Text("Standard deviations DON'T add!", font_size=24, color=RED)
        wrong_msg.next_to(cross, DOWN, buff=0.2)
        self.play(Write(wrong_msg))
        self.wait(0.5)

        # RIGHT WAY Section
        right_header = Text("RIGHT WAY", font_size=36, color=GREEN, weight=BOLD)
        right_header.shift(RIGHT * 3 + DOWN * 0.5)

        self.play(Write(right_header))

        # Step 1: Square to get variances
        step1 = MathTex(r"\text{1. Square: } 3^2 = 9, \quad 4^2 = 16", font_size=28)
        step1.next_to(right_header, DOWN, buff=0.3)
        self.play(Write(step1))
        self.wait(0.3)

        # Step 2: Add variances
        step2 = MathTex(r"\text{2. Add: } 9 + 16 = 25", font_size=28)
        step2.next_to(step1, DOWN, buff=0.2)
        self.play(Write(step2))
        self.wait(0.3)

        # Step 3: Square root
        step3 = MathTex(r"\text{3. Root: } \sqrt{25} = 5", font_size=28, color=GREEN)
        step3.next_to(step2, DOWN, buff=0.2)
        self.play(Write(step3))
        self.wait(0.5)

        # Comparison
        comparison = VGroup(
            MathTex(r"\text{WRONG: } 7", font_size=36, color=RED),
            MathTex(r"\text{vs}", font_size=28),
            MathTex(r"\text{RIGHT: } 5", font_size=36, color=GREEN)
        ).arrange(RIGHT, buff=0.5)
        comparison.to_edge(DOWN, buff=1.5)

        self.play(Write(comparison))
        self.wait(0.5)

        # Final formula
        self.play(FadeOut(comparison))

        formula = MathTex(
            r"\sigma_{X+Y}", "=", r"\sqrt{\sigma_X^2 + \sigma_Y^2}",
            font_size=44
        )
        formula.to_edge(DOWN, buff=1)
        formula[0].set_color(GREEN_3B1B)

        box = SurroundingRectangle(formula, color=GREEN, buff=0.2, corner_radius=0.1)

        self.play(Write(formula), Create(box))
        self.wait(0.5)

        # Warning flash
        trap_warning = Text("THE VARIANCE TRAP", font_size=40, color=RED, weight=BOLD)
        trap_warning.to_edge(DOWN, buff=0.3)

        warning_box = SurroundingRectangle(trap_warning, color=RED, buff=0.15, corner_radius=0.1)

        self.play(
            FadeIn(trap_warning),
            Create(warning_box)
        )

        # Flash effect
        for _ in range(2):
            self.play(
                trap_warning.animate.set_color(YELLOW),
                warning_box.animate.set_color(YELLOW),
                run_time=0.3
            )
            self.play(
                trap_warning.animate.set_color(RED),
                warning_box.animate.set_color(RED),
                run_time=0.3
            )

        self.wait(1)

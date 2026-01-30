"""
Sum of Means Animation

Demonstrates that μ(X+Y) = μX + μY - means add normally.
Shows two number lines merging into one.

To render:
manim -qm --format=mp4 l43_sum_means.py SumOfMeans
"""

from manim import *

# 3Blue1Brown-style colors
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"

class SumOfMeans(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # Title
        title = Text("Sum of Means", font_size=48, color=WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.3)

        # Number line for X
        x_line = NumberLine(
            x_range=[0, 100, 25],
            length=8,
            include_numbers=True,
            font_size=24
        )
        x_line.shift(UP * 1.5 + LEFT * 0.5)

        x_label = MathTex("X", font_size=36, color=BLUE_3B1B)
        x_label.next_to(x_line, LEFT, buff=0.3)

        # Mean of X at 25
        mu_x = 25
        x_dot = Dot(x_line.n2p(mu_x), color=BLUE_3B1B, radius=0.15)
        x_dot_label = MathTex(r"\mu_X = 25", font_size=28, color=BLUE_3B1B)
        x_dot_label.next_to(x_dot, UP, buff=0.15)

        self.play(Create(x_line), Write(x_label))
        self.play(FadeIn(x_dot, scale=0.5), Write(x_dot_label))
        self.wait(0.3)

        # Number line for Y
        y_line = NumberLine(
            x_range=[0, 100, 25],
            length=8,
            include_numbers=True,
            font_size=24
        )
        y_line.shift(DOWN * 0.3 + LEFT * 0.5)

        y_label = MathTex("Y", font_size=36, color=YELLOW_3B1B)
        y_label.next_to(y_line, LEFT, buff=0.3)

        # Mean of Y at 40
        mu_y = 40
        y_dot = Dot(y_line.n2p(mu_y), color=YELLOW_3B1B, radius=0.15)
        y_dot_label = MathTex(r"\mu_Y = 40", font_size=28, color=YELLOW_3B1B)
        y_dot_label.next_to(y_dot, UP, buff=0.15)

        self.play(Create(y_line), Write(y_label))
        self.play(FadeIn(y_dot, scale=0.5), Write(y_dot_label))
        self.wait(0.3)

        # Show X + Y
        plus_sign = MathTex("X + Y", font_size=36)
        plus_sign[0][0].set_color(BLUE_3B1B)
        plus_sign[0][2].set_color(YELLOW_3B1B)
        plus_sign.to_edge(RIGHT, buff=1)

        self.play(Write(plus_sign))
        self.wait(0.5)

        # Merged number line (X + Y)
        xy_line = NumberLine(
            x_range=[0, 100, 25],
            length=8,
            include_numbers=True,
            font_size=24
        )
        xy_line.shift(DOWN * 2.3 + LEFT * 0.5)

        xy_label = MathTex("X+Y", font_size=36, color=GREEN_3B1B)
        xy_label[0][0].set_color(BLUE_3B1B)
        xy_label[0][2].set_color(YELLOW_3B1B)
        xy_label.next_to(xy_line, LEFT, buff=0.3)

        # Animate merge
        self.play(
            x_line.animate.shift(DOWN * 1.9),
            y_line.animate.shift(DOWN * 1),
            x_label.animate.shift(DOWN * 1.9),
            y_label.animate.shift(DOWN * 1),
            x_dot.animate.shift(DOWN * 1.9),
            y_dot.animate.shift(DOWN * 1),
            x_dot_label.animate.shift(DOWN * 1.9),
            y_dot_label.animate.shift(DOWN * 1),
            run_time=0.8
        )

        self.play(
            FadeOut(x_line),
            FadeOut(y_line),
            FadeOut(x_label),
            FadeOut(y_label),
            FadeOut(x_dot_label),
            FadeOut(y_dot_label),
            Create(xy_line),
            Write(xy_label),
            run_time=0.8
        )

        # Dots combine
        combined_value = mu_x + mu_y  # 65

        # Show calculation
        calc = MathTex("25", "+", "40", "=", "65", font_size=36)
        calc[0].set_color(BLUE_3B1B)
        calc[2].set_color(YELLOW_3B1B)
        calc[4].set_color(GREEN_3B1B)
        calc.shift(DOWN * 0.5)

        self.play(Write(calc))

        # Move dots and merge
        combined_dot = Dot(xy_line.n2p(combined_value), color=GREEN_3B1B, radius=0.18)

        self.play(
            x_dot.animate.move_to(xy_line.n2p(combined_value)),
            y_dot.animate.move_to(xy_line.n2p(combined_value)),
            run_time=1
        )

        self.play(
            FadeOut(x_dot),
            FadeOut(y_dot),
            FadeIn(combined_dot, scale=1.5)
        )

        # Label for combined mean
        combined_label = MathTex(r"\mu_{X+Y} = 65", font_size=32, color=GREEN_3B1B)
        combined_label.next_to(combined_dot, UP, buff=0.2)
        self.play(Write(combined_label))
        self.wait(0.5)

        # Formula with checkmark
        formula = MathTex(
            r"\mu_{X+Y}", "=", r"\mu_X", "+", r"\mu_Y",
            font_size=42
        )
        formula.to_edge(DOWN, buff=0.6)
        formula[0].set_color(GREEN_3B1B)
        formula[2].set_color(BLUE_3B1B)
        formula[4].set_color(YELLOW_3B1B)

        box = SurroundingRectangle(formula, color=GREEN, buff=0.15, corner_radius=0.1)

        checkmark = MathTex(r"\checkmark", font_size=48, color=GREEN)
        checkmark.next_to(box, RIGHT, buff=0.2)

        self.play(Write(formula), Create(box))
        self.play(Write(checkmark))

        # Key insight
        insight = Text("Means add normally", font_size=28, color=TEAL_3B1B)
        insight.next_to(box, DOWN, buff=0.3)
        self.play(Write(insight))

        self.wait(1.5)

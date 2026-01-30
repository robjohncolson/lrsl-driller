"""
Difference of Means Animation

Demonstrates that μ(X-Y) = μX - μY - means subtract normally too.
Shows subtraction on number lines.

To render:
manim -qm --format=mp4 l44_diff_means.py DiffOfMeans
"""

from manim import *

# 3Blue1Brown-style colors
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"

class DiffOfMeans(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # Title
        title = Text("Difference of Means", font_size=48, color=WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.3)

        # Number line for X
        x_line = NumberLine(
            x_range=[0, 100, 20],
            length=9,
            include_numbers=True,
            font_size=24
        )
        x_line.shift(UP * 1.5)

        x_label = MathTex("X", font_size=36, color=BLUE_3B1B)
        x_label.next_to(x_line, LEFT, buff=0.3)

        # Mean of X at 80
        mu_x = 80
        x_dot = Dot(x_line.n2p(mu_x), color=BLUE_3B1B, radius=0.15)
        x_dot_label = MathTex(r"\mu_X = 80", font_size=28, color=BLUE_3B1B)
        x_dot_label.next_to(x_dot, UP, buff=0.15)

        self.play(Create(x_line), Write(x_label))
        self.play(FadeIn(x_dot, scale=0.5), Write(x_dot_label))
        self.wait(0.3)

        # Number line for Y
        y_line = NumberLine(
            x_range=[0, 100, 20],
            length=9,
            include_numbers=True,
            font_size=24
        )
        y_line.shift(DOWN * 0.3)

        y_label = MathTex("Y", font_size=36, color=YELLOW_3B1B)
        y_label.next_to(y_line, LEFT, buff=0.3)

        # Mean of Y at 30
        mu_y = 30
        y_dot = Dot(y_line.n2p(mu_y), color=YELLOW_3B1B, radius=0.15)
        y_dot_label = MathTex(r"\mu_Y = 30", font_size=28, color=YELLOW_3B1B)
        y_dot_label.next_to(y_dot, UP, buff=0.15)

        self.play(Create(y_line), Write(y_label))
        self.play(FadeIn(y_dot, scale=0.5), Write(y_dot_label))
        self.wait(0.3)

        # Show X - Y
        minus_sign = MathTex("X - Y", font_size=40)
        minus_sign[0][0].set_color(BLUE_3B1B)
        minus_sign[0][2].set_color(YELLOW_3B1B)
        minus_sign.to_edge(RIGHT, buff=1.5)

        self.play(Write(minus_sign))
        self.wait(0.5)

        # Result number line
        result_line = NumberLine(
            x_range=[0, 100, 20],
            length=9,
            include_numbers=True,
            font_size=24
        )
        result_line.shift(DOWN * 2.3)

        result_label = MathTex("X-Y", font_size=36, color=GREEN_3B1B)
        result_label[0][0].set_color(BLUE_3B1B)
        result_label[0][2].set_color(YELLOW_3B1B)
        result_label.next_to(result_line, LEFT, buff=0.3)

        self.play(Create(result_line), Write(result_label))

        # Calculation
        diff_value = mu_x - mu_y  # 50

        calc = MathTex("80", "-", "30", "=", "50", font_size=40)
        calc[0].set_color(BLUE_3B1B)
        calc[2].set_color(YELLOW_3B1B)
        calc[4].set_color(GREEN_3B1B)
        calc.shift(DOWN * 0.5 + RIGHT * 2)

        self.play(Write(calc))
        self.wait(0.3)

        # Show result on number line
        result_dot = Dot(result_line.n2p(diff_value), color=GREEN_3B1B, radius=0.18)
        result_dot_label = MathTex(r"\mu_{X-Y} = 50", font_size=32, color=GREEN_3B1B)
        result_dot_label.next_to(result_dot, UP, buff=0.2)

        # Arrow showing subtraction visually
        arrow = Arrow(
            result_line.n2p(mu_x),
            result_line.n2p(diff_value),
            color=PINK_3B1B,
            buff=0,
            max_tip_length_to_length_ratio=0.15
        )
        arrow.shift(DOWN * 0.5)
        arrow_label = MathTex(r"-30", font_size=24, color=PINK_3B1B)
        arrow_label.next_to(arrow, DOWN, buff=0.1)

        self.play(GrowArrow(arrow), Write(arrow_label))
        self.play(FadeIn(result_dot, scale=0.5), Write(result_dot_label))
        self.wait(0.5)

        # Formula
        formula = MathTex(
            r"\mu_{X-Y}", "=", r"\mu_X", "-", r"\mu_Y",
            font_size=42
        )
        formula.to_edge(DOWN, buff=0.5)
        formula[0].set_color(GREEN_3B1B)
        formula[2].set_color(BLUE_3B1B)
        formula[4].set_color(YELLOW_3B1B)

        box = SurroundingRectangle(formula, color=GREEN, buff=0.15, corner_radius=0.1)

        self.play(Write(formula), Create(box))

        # Key insight
        insight = Text("Means still work normally for differences", font_size=26, color=TEAL_3B1B)
        insight.next_to(box, DOWN, buff=0.25)
        self.play(Write(insight))

        self.wait(1.5)

"""
Linear Transformation of Mean Animation

Demonstrates how linear transformations affect the mean: μY = a + b·μX
Shows the transformation visually on a number line.

To render:
manim -qm --format=mp4 l41_transform_mean.py LinearTransformMean
"""

from manim import *

# 3Blue1Brown-style colors
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
PINK_3B1B = "#EC4899"

class LinearTransformMean(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # Title
        title = Text("Linear Transformation: Mean", font_size=44, color=WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.3)

        # Number line for X
        x_line = NumberLine(
            x_range=[0, 200, 50],
            length=10,
            include_numbers=True,
            font_size=24
        )
        x_line.shift(UP * 1)

        x_label = MathTex("X", font_size=36, color=BLUE_3B1B)
        x_label.next_to(x_line, LEFT, buff=0.3)

        self.play(Create(x_line), Write(x_label))

        # Mean of X at 50
        mu_x = 50
        x_dot = Dot(x_line.n2p(mu_x), color=BLUE_3B1B, radius=0.15)
        x_dot_label = MathTex(r"\mu_X = 50", font_size=32, color=BLUE_3B1B)
        x_dot_label.next_to(x_dot, UP, buff=0.2)

        self.play(FadeIn(x_dot, scale=0.5), Write(x_dot_label))
        self.wait(0.5)

        # Transformation equation
        transform_eq = MathTex("Y", "=", "10", "+", "3", "X", font_size=40)
        transform_eq.shift(DOWN * 0.5)
        transform_eq[0].set_color(YELLOW_3B1B)
        transform_eq[2].set_color(TEAL_3B1B)  # a = 10
        transform_eq[4].set_color(PINK_3B1B)  # b = 3
        transform_eq[5].set_color(BLUE_3B1B)

        self.play(Write(transform_eq))
        self.wait(0.5)

        # Number line for Y
        y_line = NumberLine(
            x_range=[0, 200, 50],
            length=10,
            include_numbers=True,
            font_size=24
        )
        y_line.shift(DOWN * 2)

        y_label = MathTex("Y", font_size=36, color=YELLOW_3B1B)
        y_label.next_to(y_line, LEFT, buff=0.3)

        self.play(Create(y_line), Write(y_label))

        # Copy dot to Y line
        y_dot = Dot(y_line.n2p(mu_x), color=YELLOW_3B1B, radius=0.15)

        # Arrow for ×3 transformation
        arrow_mult = Arrow(
            x_line.n2p(mu_x) + DOWN * 0.3,
            y_line.n2p(150) + UP * 0.3,
            color=PINK_3B1B,
            buff=0.1
        )
        mult_label = MathTex(r"\times 3", font_size=28, color=PINK_3B1B)
        mult_label.next_to(arrow_mult, RIGHT, buff=0.1)

        self.play(
            FadeIn(y_dot, scale=0.5),
            GrowArrow(arrow_mult),
            Write(mult_label)
        )

        # Move dot to 150 (50 × 3)
        self.play(y_dot.animate.move_to(y_line.n2p(150)), run_time=0.8)

        mult_result = MathTex("= 150", font_size=28, color=PINK_3B1B)
        mult_result.next_to(mult_label, DOWN, buff=0.1)
        self.play(Write(mult_result))
        self.wait(0.3)

        # Arrow for +10 transformation
        arrow_add = Arrow(
            y_line.n2p(150) + DOWN * 0.5,
            y_line.n2p(160) + DOWN * 0.5,
            color=TEAL_3B1B,
            buff=0.1
        )
        add_label = MathTex(r"+10", font_size=28, color=TEAL_3B1B)
        add_label.next_to(arrow_add, DOWN, buff=0.1)

        self.play(GrowArrow(arrow_add), Write(add_label))

        # Move dot to 160
        self.play(y_dot.animate.move_to(y_line.n2p(160)), run_time=0.5)

        # Final label
        y_dot_label = MathTex(r"\mu_Y = 160", font_size=32, color=YELLOW_3B1B)
        y_dot_label.next_to(y_dot, UP, buff=0.2)
        self.play(Write(y_dot_label))
        self.wait(0.5)

        # Formula breakdown
        calc = MathTex(
            r"\mu_Y", "=", "10", "+", "3", r"(50)", "=", "160",
            font_size=36
        )
        calc.to_edge(DOWN, buff=0.8)
        calc[0].set_color(YELLOW_3B1B)
        calc[2].set_color(TEAL_3B1B)
        calc[4].set_color(PINK_3B1B)
        calc[5].set_color(BLUE_3B1B)
        calc[7].set_color(YELLOW_3B1B)

        self.play(Write(calc))
        self.wait(0.5)

        # Final formula box
        formula_box = MathTex(
            r"\mu_Y = a + b \cdot \mu_X",
            font_size=42
        )
        formula_box.to_edge(DOWN, buff=0.3)
        box = SurroundingRectangle(formula_box, color=GREEN, buff=0.15, corner_radius=0.1)

        self.play(
            ReplacementTransform(calc, formula_box),
            Create(box)
        )
        self.wait(1.5)

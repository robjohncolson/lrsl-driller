"""
Linear Transformation of Standard Deviation Animation

Demonstrates that σY = |b|·σX - the constant doesn't affect spread!
Shows a bell curve stretching vs. shifting.

To render:
manim -qm --format=mp4 l42_transform_sd.py LinearTransformSD
"""

from manim import *
import numpy as np

# 3Blue1Brown-style colors
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
PINK_3B1B = "#EC4899"

class LinearTransformSD(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # Title
        title = Text("Linear Transformation: SD", font_size=44, color=WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # Initial parameters
        mu_x = 0
        sigma_x = 4

        # Create axes
        axes = Axes(
            x_range=[-20, 50, 10],
            y_range=[0, 0.15, 0.05],
            x_length=10,
            y_length=3,
            axis_config={"include_tip": False, "include_numbers": True}
        )
        axes.shift(UP * 0.5)

        # Bell curve function
        def bell_curve(x, mu, sigma):
            return (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x - mu) / sigma) ** 2)

        # Initial curve (X distribution)
        x_curve = axes.plot(
            lambda x: bell_curve(x, mu_x, sigma_x),
            x_range=[-15, 15],
            color=BLUE_3B1B
        )

        x_label = MathTex(r"X: \mu_X = 0, \sigma_X = 4", font_size=28, color=BLUE_3B1B)
        x_label.next_to(axes, UP, buff=0.2)

        self.play(Create(axes))
        self.play(Create(x_curve), Write(x_label))
        self.wait(0.5)

        # Transformation equation
        transform_eq = MathTex("Y", "=", "10", "+", "3", "X", font_size=36)
        transform_eq.next_to(axes, DOWN, buff=0.5)
        transform_eq[0].set_color(YELLOW_3B1B)
        transform_eq[2].set_color(TEAL_3B1B)
        transform_eq[4].set_color(PINK_3B1B)
        transform_eq[5].set_color(BLUE_3B1B)

        self.play(Write(transform_eq))
        self.wait(0.5)

        # Step 1: Multiply by 3 - curve STRETCHES
        step1_text = Text("Step 1: Multiply by 3", font_size=28, color=PINK_3B1B)
        step1_text.to_edge(LEFT, buff=0.5).shift(DOWN * 2.5)

        self.play(Write(step1_text))

        # New curve with stretched sigma
        stretched_curve = axes.plot(
            lambda x: bell_curve(x, 0, sigma_x * 3),
            x_range=[-40, 40],
            color=PINK_3B1B
        )

        stretch_label = MathTex(r"\sigma \to 3 \times 4 = 12", font_size=28, color=PINK_3B1B)
        stretch_label.next_to(step1_text, DOWN, buff=0.2)

        self.play(
            Transform(x_curve, stretched_curve),
            Write(stretch_label),
            run_time=1.5
        )

        spread_text = Text("Spread grows 3×!", font_size=24, color=PINK_3B1B)
        spread_text.next_to(stretch_label, DOWN, buff=0.1)
        self.play(Write(spread_text))
        self.wait(0.5)

        # Step 2: Add 10 - curve SHIFTS (spread unchanged!)
        step2_text = Text("Step 2: Add 10", font_size=28, color=TEAL_3B1B)
        step2_text.to_edge(RIGHT, buff=0.5).shift(DOWN * 2.5)

        self.play(Write(step2_text))

        # New curve shifted right
        shifted_curve = axes.plot(
            lambda x: bell_curve(x, 10, sigma_x * 3),
            x_range=[-30, 50],
            color=YELLOW_3B1B
        )

        self.play(
            Transform(x_curve, shifted_curve),
            run_time=1
        )

        # Key insight: spread unchanged
        no_change_text = MathTex(r"\sigma \text{ unchanged!}", font_size=28, color=GREEN)
        no_change_text.next_to(step2_text, DOWN, buff=0.2)

        # Red X on "+10 affects spread"
        wrong_idea = MathTex(r"+10 \to \sigma?", font_size=24, color=RED)
        wrong_idea.next_to(no_change_text, DOWN, buff=0.1)
        cross = Cross(wrong_idea, stroke_color=RED, stroke_width=4)

        self.play(Write(no_change_text))
        self.play(Write(wrong_idea), Create(cross))
        self.wait(0.5)

        # Clear middle area for final message
        self.play(
            FadeOut(step1_text),
            FadeOut(stretch_label),
            FadeOut(spread_text),
            FadeOut(step2_text),
            FadeOut(no_change_text),
            FadeOut(wrong_idea),
            FadeOut(cross)
        )

        # Key message
        key_msg = Text(
            "Adding a constant shifts center, NOT spread",
            font_size=28,
            color=YELLOW_3B1B
        )
        key_msg.next_to(transform_eq, DOWN, buff=0.5)
        self.play(Write(key_msg))
        self.wait(0.5)

        # Final formula
        formula = MathTex(
            r"\sigma_Y", "=", r"|b|", r"\cdot", r"\sigma_X", "=", "3(4)", "=", "12",
            font_size=36
        )
        formula.to_edge(DOWN, buff=0.5)
        formula[0].set_color(YELLOW_3B1B)
        formula[2].set_color(PINK_3B1B)
        formula[4].set_color(BLUE_3B1B)
        formula[8].set_color(GREEN)

        box = SurroundingRectangle(formula, color=GREEN, buff=0.15, corner_radius=0.1)

        self.play(Write(formula), Create(box))
        self.wait(1.5)

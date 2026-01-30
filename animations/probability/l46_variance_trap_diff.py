"""
THE VARIANCE TRAP Part 2 (Difference) Animation

Demonstrates that σ(X-Y) = √(σX² + σY²) — variances STILL add even for subtraction!
Shows why with a wobble/uncertainty animation.

To render:
manim -qm --format=mp4 l46_variance_trap_diff.py VarianceTrapDiff
"""

from manim import *
import numpy as np

# 3Blue1Brown-style colors
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"

class VarianceTrapDiff(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # Title
        title = Text("VARIANCE TRAP: Part 2", font_size=48, color=RED, weight=BOLD)
        subtitle = Text("(Difference)", font_size=32, color=YELLOW_3B1B)
        title.to_edge(UP, buff=0.3)
        subtitle.next_to(title, DOWN, buff=0.1)

        self.play(Write(title), Write(subtitle))
        self.wait(0.3)

        # Question that seems intuitive
        intuition = Text("X - Y... surely we subtract variances?", font_size=32, color=WHITE)
        intuition.shift(UP * 1.5)
        self.play(Write(intuition))
        self.wait(0.5)

        # Given values
        given = VGroup(
            MathTex(r"\sigma_X = 5", font_size=36, color=BLUE_3B1B),
            MathTex(r"\sigma_Y = 12", font_size=36, color=YELLOW_3B1B)
        ).arrange(RIGHT, buff=1.5)
        given.shift(UP * 0.7)
        self.play(Write(given))
        self.wait(0.3)

        # WRONG WAY 1: subtract in wrong order
        wrong1 = MathTex("12 - 5 = 7", font_size=40, color=RED)
        wrong1.shift(LEFT * 3 + DOWN * 0.3)
        cross1 = Cross(wrong1, stroke_color=RED, stroke_width=6)
        label1 = Text("Wrong!", font_size=24, color=RED)
        label1.next_to(cross1, DOWN, buff=0.1)

        self.play(Write(wrong1))
        self.play(Create(cross1), Write(label1))
        self.wait(0.3)

        # WRONG WAY 2: subtract in other order (negative!)
        wrong2 = MathTex("5 - 12 = -7", font_size=40, color=RED)
        wrong2.shift(RIGHT * 3 + DOWN * 0.3)
        cross2 = Cross(wrong2, stroke_color=RED, stroke_width=6)
        label2 = Text("Double wrong!", font_size=24, color=RED)
        label2.next_to(cross2, DOWN, buff=0.1)

        self.play(Write(wrong2))
        self.play(Create(cross2), Write(label2))
        self.wait(0.5)

        # Clear wrong answers
        self.play(
            FadeOut(wrong1), FadeOut(cross1), FadeOut(label1),
            FadeOut(wrong2), FadeOut(cross2), FadeOut(label2)
        )

        # WHY? Animation showing uncertainty
        why_text = Text("WHY do variances add?", font_size=36, color=TEAL_3B1B)
        why_text.shift(DOWN * 0.3)
        self.play(Write(why_text))
        self.wait(0.3)

        # Create wobbling objects
        obj_x = Square(side_length=0.6, color=BLUE_3B1B, fill_opacity=0.7)
        obj_y = Square(side_length=0.6, color=YELLOW_3B1B, fill_opacity=0.7)
        obj_x.shift(LEFT * 2 + DOWN * 1.5)
        obj_y.shift(RIGHT * 0.5 + DOWN * 1.5)

        label_x = MathTex("X", font_size=28, color=WHITE)
        label_y = MathTex("Y", font_size=28, color=WHITE)
        label_x.move_to(obj_x)
        label_y.move_to(obj_y)

        self.play(
            FadeIn(obj_x), FadeIn(obj_y),
            FadeIn(label_x), FadeIn(label_y)
        )

        # Wobble animation
        def wobble(obj, label, amplitude=0.3, n_cycles=3):
            animations = []
            for _ in range(n_cycles):
                animations.append(
                    obj.animate.shift(UP * amplitude + RIGHT * amplitude * 0.5)
                )
                animations.append(
                    obj.animate.shift(DOWN * amplitude * 2 + LEFT * amplitude)
                )
                animations.append(
                    obj.animate.shift(UP * amplitude + RIGHT * amplitude * 0.5)
                )
            return animations

        # Show them wobbling
        for _ in range(2):
            self.play(
                obj_x.animate.shift(UP * 0.2 + RIGHT * 0.1),
                obj_y.animate.shift(DOWN * 0.2 + LEFT * 0.15),
                label_x.animate.shift(UP * 0.2 + RIGHT * 0.1),
                label_y.animate.shift(DOWN * 0.2 + LEFT * 0.15),
                run_time=0.2
            )
            self.play(
                obj_x.animate.shift(DOWN * 0.2 + LEFT * 0.1),
                obj_y.animate.shift(UP * 0.2 + RIGHT * 0.15),
                label_x.animate.shift(DOWN * 0.2 + LEFT * 0.1),
                label_y.animate.shift(UP * 0.2 + RIGHT * 0.15),
                run_time=0.2
            )

        # Key insight
        insight = Text(
            "Subtracting uncertain things INCREASES uncertainty",
            font_size=26,
            color=YELLOW_3B1B
        )
        insight.next_to(obj_x, DOWN, buff=0.5).shift(RIGHT * 1.5)
        self.play(Write(insight))
        self.wait(0.5)

        # Clear animation
        self.play(
            FadeOut(obj_x), FadeOut(obj_y),
            FadeOut(label_x), FadeOut(label_y),
            FadeOut(why_text), FadeOut(insight)
        )

        # RIGHT WAY
        right_header = Text("RIGHT WAY:", font_size=36, color=GREEN, weight=BOLD)
        right_header.shift(DOWN * 0.3)
        self.play(Write(right_header))

        # Calculation
        calc = VGroup(
            MathTex(r"5^2 + 12^2 = 25 + 144 = 169", font_size=32),
            MathTex(r"\sqrt{169} = 13", font_size=36, color=GREEN)
        ).arrange(DOWN, buff=0.3)
        calc.next_to(right_header, DOWN, buff=0.3)

        self.play(Write(calc[0]))
        self.wait(0.3)
        self.play(Write(calc[1]))
        self.wait(0.5)

        # Final formula
        formula = MathTex(
            r"\sigma_{X-Y}", "=", r"\sqrt{\sigma_X^2 + \sigma_Y^2}",
            font_size=44
        )
        formula.to_edge(DOWN, buff=0.8)
        formula[0].set_color(GREEN_3B1B)

        box = SurroundingRectangle(formula, color=GREEN, buff=0.15, corner_radius=0.1)

        self.play(Write(formula), Create(box))

        # Emphasis
        emphasis = Text("Variances ALWAYS add!", font_size=32, color=RED, weight=BOLD)
        emphasis.next_to(box, DOWN, buff=0.2)
        self.play(Write(emphasis))

        self.wait(1.5)

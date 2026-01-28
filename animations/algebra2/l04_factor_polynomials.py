"""
Level 4: Factor Polynomials (Including Complex Numbers)
Shows factoring with identities and extension to complex numbers.

Run with: python -m manim -qm --format=mp4 l04_factor_polynomials.py FactorPolynomials
"""
from manim import *


class FactorPolynomials(Scene):
    def construct(self):
        # Title
        title = Text("Factor with Identities", font_size=44)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Example 1: Sum of cubes
        example1 = MathTex(r"8x^3 + 27", font_size=44)
        example1.shift(UP * 1.5)
        self.play(Write(example1))
        self.wait(0.5)

        # Rewrite as cubes
        step1 = MathTex(r"= (2x)^3 + 3^3", font_size=40, color=YELLOW)
        step1.shift(UP * 0.5)
        self.play(Write(step1))
        self.wait(0.5)

        # Show identity
        identity = MathTex(r"a^3 + b^3 = (a+b)(a^2-ab+b^2)", font_size=28, color=BLUE)
        identity.to_corner(UR, buff=0.5)
        self.play(Write(identity))
        self.wait(0.3)

        # Apply
        step2 = MathTex(r"= (2x+3)((2x)^2-(2x)(3)+3^2)", font_size=36)
        step2.shift(DOWN * 0.3)
        self.play(Write(step2))
        self.wait(0.5)

        result1 = MathTex(r"= (2x+3)(4x^2-6x+9)", font_size=40, color=GREEN)
        result1.shift(DOWN * 1.1)
        self.play(Write(result1))

        box1 = SurroundingRectangle(result1, color=GREEN, buff=0.1)
        self.play(Create(box1))
        self.wait(1)

        # Clear
        self.play(
            FadeOut(example1), FadeOut(step1), FadeOut(step2),
            FadeOut(result1), FadeOut(box1), FadeOut(identity)
        )

        # Complex numbers extension
        subtitle = Text("Extension to Complex Numbers", font_size=32, color=PURPLE)
        subtitle.shift(UP * 2)
        self.play(Write(subtitle))

        example2 = MathTex(r"x^2 + 4", font_size=44)
        example2.shift(UP * 1)
        self.play(Write(example2))
        self.wait(0.5)

        # Key insight
        note = Text("Sum of squares cannot factor over reals...", font_size=24, color=GRAY)
        note.shift(UP * 0.2)
        self.play(Write(note))
        self.wait(0.5)

        # But with complex numbers!
        note2 = Text("But with complex numbers:", font_size=24, color=YELLOW)
        note2.shift(DOWN * 0.3)
        self.play(FadeOut(note), Write(note2))

        # Show complex factorization
        complex_step = VGroup(
            MathTex(r"x^2 + 4 = x^2 - (-4)", font_size=36),
            MathTex(r"= x^2 - (2i)^2", font_size=36, color=BLUE),
            MathTex(r"= (x+2i)(x-2i)", font_size=40, color=PURPLE),
        ).arrange(DOWN, buff=0.25)
        complex_step.shift(DOWN * 1)

        for line in complex_step:
            self.play(Write(line), run_time=0.7)
            self.wait(0.3)

        # Box final
        box2 = SurroundingRectangle(complex_step[-1], color=PURPLE, buff=0.1)
        self.play(Create(box2))
        self.wait(0.5)

        # Key note
        key = MathTex(r"i^2 = -1, \text{ so } (2i)^2 = 4i^2 = -4", font_size=26, color=YELLOW)
        key.to_edge(DOWN, buff=0.5)
        self.play(Write(key))
        self.wait(2)

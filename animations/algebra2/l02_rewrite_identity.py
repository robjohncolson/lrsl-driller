"""
Level 2: Rewrite Using an Identity
Shows how to transform expressions using polynomial identities.

Run with: python -m manim -qm --format=mp4 l02_rewrite_identity.py RewriteIdentity
"""
from manim import *


class RewriteIdentity(Scene):
    def construct(self):
        # Title
        title = Text("Rewrite Using an Identity", font_size=44)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Example 1: Expand (2x + 3)^2
        subtitle1 = Text("Example 1: Expand", font_size=28, color=GREEN)
        subtitle1.shift(UP * 2)
        self.play(Write(subtitle1))

        expr1 = MathTex(r"(2x + 3)^2", font_size=44)
        expr1.shift(UP * 1)
        self.play(Write(expr1))
        self.wait(0.5)

        # Show identity
        identity = MathTex(r"(a+b)^2 = a^2 + 2ab + b^2", font_size=32, color=YELLOW)
        identity.shift(UP * 0.3)
        self.play(Write(identity))
        self.wait(0.5)

        # Identify a and b
        ab_labels = MathTex(r"a = 2x, \quad b = 3", font_size=32, color=BLUE)
        ab_labels.shift(DOWN * 0.3)
        self.play(Write(ab_labels))
        self.wait(0.5)

        # Apply step by step
        steps = VGroup(
            MathTex(r"= (2x)^2 + 2(2x)(3) + (3)^2", font_size=36),
            MathTex(r"= 4x^2 + 12x + 9", font_size=36, color=GREEN),
        ).arrange(DOWN, buff=0.2)
        steps.shift(DOWN * 1.2)

        for step in steps:
            self.play(Write(step), run_time=0.8)
            self.wait(0.5)

        self.wait(0.5)

        # Clear for example 2
        self.play(
            FadeOut(subtitle1), FadeOut(expr1), FadeOut(identity),
            FadeOut(ab_labels), FadeOut(steps)
        )

        # Example 2: Factor x^3 - 8
        subtitle2 = Text("Example 2: Factor", font_size=28, color=ORANGE)
        subtitle2.shift(UP * 2)
        self.play(Write(subtitle2))

        expr2 = MathTex(r"x^3 - 8", font_size=44)
        expr2.shift(UP * 1)
        self.play(Write(expr2))
        self.wait(0.5)

        # Rewrite as cubes
        rewrite = MathTex(r"= x^3 - 2^3", font_size=44, color=YELLOW)
        rewrite.shift(UP * 0.3)
        self.play(Write(rewrite))
        self.wait(0.5)

        # Show identity
        identity2 = MathTex(r"a^3 - b^3 = (a-b)(a^2+ab+b^2)", font_size=32, color=YELLOW)
        identity2.shift(DOWN * 0.3)
        self.play(Write(identity2))
        self.wait(0.5)

        # Apply
        result = MathTex(r"= (x-2)(x^2+2x+4)", font_size=40, color=ORANGE)
        result.shift(DOWN * 1.2)
        self.play(Write(result))
        self.wait(0.5)

        # Box result
        box = SurroundingRectangle(result, color=ORANGE, buff=0.15)
        self.play(Create(box))
        self.wait(1)

        # Key insight
        insight = Text(
            "Step 1: Identify perfect squares/cubes | Step 2: Match to identity | Step 3: Apply",
            font_size=22
        )
        insight.to_edge(DOWN, buff=0.5)
        self.play(Write(insight))
        self.wait(2)

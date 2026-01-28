"""
Level 3: Numeric Shortcuts with Identities
Shows how to use identities for quick mental math.

Run with: python -m manim -qm --format=mp4 l03_numeric_shortcuts.py NumericShortcuts
"""
from manim import *


class NumericShortcuts(Scene):
    def construct(self):
        # Title
        title = Text("Numeric Shortcuts with Identities", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Example 1: 47 * 53
        example1_title = Text("Compute: 47 x 53", font_size=32, color=YELLOW)
        example1_title.shift(UP * 2)
        self.play(Write(example1_title))
        self.wait(0.5)

        # Show the trick
        trick1 = VGroup(
            MathTex(r"47 \times 53", font_size=40),
            MathTex(r"= (50-3)(50+3)", font_size=40, color=BLUE),
            MathTex(r"= 50^2 - 3^2", font_size=40, color=BLUE),
            MathTex(r"= 2500 - 9", font_size=40),
            MathTex(r"= 2491", font_size=44, color=GREEN),
        ).arrange(DOWN, buff=0.25)
        trick1.shift(DOWN * 0.3)

        identity1 = MathTex(r"(a-b)(a+b) = a^2 - b^2", font_size=28, color=YELLOW)
        identity1.to_corner(UR, buff=0.5)
        self.play(Write(identity1))

        for line in trick1:
            self.play(Write(line), run_time=0.6)
            self.wait(0.3)

        self.wait(1)

        # Clear
        self.play(FadeOut(example1_title), FadeOut(trick1))

        # Example 2: 98^2
        example2_title = Text("Compute: 98 squared", font_size=32, color=YELLOW)
        example2_title.shift(UP * 2)
        self.play(Write(example2_title))
        self.wait(0.5)

        trick2 = VGroup(
            MathTex(r"98^2", font_size=40),
            MathTex(r"= (100-2)^2", font_size=40, color=BLUE),
            MathTex(r"= 100^2 - 2(100)(2) + 2^2", font_size=40, color=BLUE),
            MathTex(r"= 10000 - 400 + 4", font_size=40),
            MathTex(r"= 9604", font_size=44, color=GREEN),
        ).arrange(DOWN, buff=0.25)
        trick2.shift(DOWN * 0.3)

        identity2 = MathTex(r"(a-b)^2 = a^2 - 2ab + b^2", font_size=28, color=YELLOW)
        identity2.next_to(identity1, DOWN, buff=0.3)
        self.play(Write(identity2))

        for line in trick2:
            self.play(Write(line), run_time=0.6)
            self.wait(0.3)

        self.wait(1)

        # Key insight
        self.play(FadeOut(example2_title), FadeOut(trick2))

        insight = VGroup(
            Text("Strategy:", font_size=28, color=YELLOW),
            Text("Find a 'nice' number nearby (like 50, 100)", font_size=24),
            Text("Write as sum/difference from that number", font_size=24),
            Text("Apply the identity to compute quickly", font_size=24),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        insight.shift(DOWN * 0.5)

        box = SurroundingRectangle(insight, color=YELLOW, buff=0.2)
        self.play(Write(insight), Create(box))
        self.wait(2)

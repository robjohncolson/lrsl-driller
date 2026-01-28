"""
Level 1: Identify the Identity
Shows how to recognize polynomial identity structures.

Run with: python -m manim -qm --format=mp4 l01_identity_match.py IdentityMatch
"""
from manim import *


class IdentityMatch(Scene):
    def construct(self):
        # Title
        title = Text("Identify the Identity", font_size=44)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Show the four main identities
        identities = VGroup(
            MathTex(r"a^2 - b^2 = (a+b)(a-b)", font_size=32, color=BLUE),
            MathTex(r"(a+b)^2 = a^2 + 2ab + b^2", font_size=32, color=GREEN),
            MathTex(r"a^3 - b^3 = (a-b)(a^2+ab+b^2)", font_size=32, color=ORANGE),
            MathTex(r"a^3 + b^3 = (a+b)(a^2-ab+b^2)", font_size=32, color=PURPLE),
        ).arrange(DOWN, buff=0.4)
        identities.shift(LEFT * 3)

        labels = VGroup(
            Text("Difference of Squares", font_size=20, color=BLUE),
            Text("Square of a Sum", font_size=20, color=GREEN),
            Text("Difference of Cubes", font_size=20, color=ORANGE),
            Text("Sum of Cubes", font_size=20, color=PURPLE),
        )

        for label, identity in zip(labels, identities):
            label.next_to(identity, RIGHT, buff=0.5)

        self.play(
            *[Write(id) for id in identities],
            *[Write(lb) for lb in labels],
            run_time=2
        )
        self.wait(1)

        # Example expression
        example_box = Rectangle(width=5, height=2.5, color=YELLOW, stroke_width=2)
        example_box.shift(RIGHT * 3)

        example_title = Text("Match this:", font_size=24, color=YELLOW)
        example_title.next_to(example_box, UP, buff=0.2)

        example = MathTex(r"x^2 - 49", font_size=40)
        example.move_to(example_box.get_center())

        self.play(Create(example_box), Write(example_title), Write(example))
        self.wait(0.5)

        # Highlight structure
        rewrite = MathTex(r"x^2 - 7^2", font_size=40, color=YELLOW)
        rewrite.move_to(example.get_center())

        self.play(Transform(example, rewrite))
        self.wait(0.5)

        # Highlight matching identity
        highlight = SurroundingRectangle(identities[0], color=YELLOW, buff=0.1)
        self.play(Create(highlight))
        self.wait(0.5)

        # Show answer
        answer = MathTex(r"= (x+7)(x-7)", font_size=36, color=BLUE)
        answer.next_to(example, DOWN, buff=0.3)
        self.play(Write(answer))
        self.wait(1)

        # Key insight
        insight = VGroup(
            Text("Key Patterns:", font_size=24, color=WHITE),
            Text("Squares: look for perfect squares", font_size=20),
            Text("Cubes: look for perfect cubes", font_size=20),
            Text("Signs: + or - determine the identity", font_size=20),
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        insight.to_edge(DOWN, buff=0.5)

        box = SurroundingRectangle(insight, color=WHITE, buff=0.15)
        self.play(Write(insight), Create(box))
        self.wait(2)

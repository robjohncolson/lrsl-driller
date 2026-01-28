"""
Level 5: Pascal's Triangle and Binomial Coefficients
Shows Pascal's Triangle patterns and connection to binomial coefficients.

Run with: python -m manim -qm --format=mp4 l05_pascal_patterns.py PascalPatterns
"""
from manim import *


class PascalPatterns(Scene):
    def construct(self):
        # Title
        title = Text("Pascal's Triangle", font_size=44)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Build Pascal's Triangle
        rows = [
            [1],
            [1, 1],
            [1, 2, 1],
            [1, 3, 3, 1],
            [1, 4, 6, 4, 1],
            [1, 5, 10, 10, 5, 1],
        ]

        triangle = VGroup()
        row_labels = VGroup()

        for i, row in enumerate(rows):
            row_group = VGroup()
            for j, num in enumerate(row):
                cell = MathTex(str(num), font_size=32)
                cell.move_to(RIGHT * (j - len(row)/2 + 0.5) * 0.8)
                row_group.add(cell)
            row_group.shift(DOWN * i * 0.7 + UP * 1.5)
            triangle.add(row_group)

            # Row label
            label = Text(f"n={i}", font_size=18, color=GRAY)
            label.next_to(row_group, LEFT, buff=0.5)
            row_labels.add(label)

        # Animate building the triangle
        for row, label in zip(triangle, row_labels):
            self.play(Write(row), Write(label), run_time=0.4)
        self.wait(1)

        # Highlight row sums
        subtitle1 = Text("Pattern 1: Row sums are powers of 2", font_size=24, color=YELLOW)
        subtitle1.to_edge(DOWN, buff=1.5)
        self.play(Write(subtitle1))

        sum_labels = VGroup()
        sums = [1, 2, 4, 8, 16, 32]
        for i, s in enumerate(sums):
            sum_label = MathTex(f"= {s} = 2^{i}", font_size=22, color=GREEN)
            sum_label.next_to(triangle[i], RIGHT, buff=0.5)
            sum_labels.add(sum_label)

        self.play(*[Write(sl) for sl in sum_labels], run_time=1.5)
        self.wait(1)

        # Clear sums, show adjacent sum pattern
        self.play(FadeOut(sum_labels), FadeOut(subtitle1))

        subtitle2 = Text("Pattern 2: Each number = sum of two above", font_size=24, color=YELLOW)
        subtitle2.to_edge(DOWN, buff=1.5)
        self.play(Write(subtitle2))

        # Highlight example: 6 = 3 + 3
        highlight1 = SurroundingRectangle(triangle[3][1], color=BLUE, buff=0.05)
        highlight2 = SurroundingRectangle(triangle[3][2], color=BLUE, buff=0.05)
        highlight3 = SurroundingRectangle(triangle[4][2], color=GREEN, buff=0.05)

        arrow1 = Arrow(triangle[3][1].get_bottom(), triangle[4][2].get_top(), buff=0.1, color=BLUE)
        arrow2 = Arrow(triangle[3][2].get_bottom(), triangle[4][2].get_top(), buff=0.1, color=BLUE)

        self.play(Create(highlight1), Create(highlight2), Create(highlight3))
        self.play(Create(arrow1), Create(arrow2))

        equation = MathTex("3 + 3 = 6", font_size=28, color=GREEN)
        equation.next_to(triangle[4], RIGHT, buff=1)
        self.play(Write(equation))
        self.wait(1)

        # Clear and show binomial connection
        self.play(
            FadeOut(highlight1), FadeOut(highlight2), FadeOut(highlight3),
            FadeOut(arrow1), FadeOut(arrow2), FadeOut(equation), FadeOut(subtitle2)
        )

        subtitle3 = Text("Connection to Binomial Coefficients", font_size=24, color=YELLOW)
        subtitle3.to_edge(DOWN, buff=1.5)
        self.play(Write(subtitle3))

        # Show C(n,k) notation
        binomial = MathTex(r"\binom{n}{k} = \text{Row } n, \text{ Position } k", font_size=28)
        binomial.shift(DOWN * 2.5)
        self.play(Write(binomial))

        example = MathTex(r"\binom{5}{2} = 10", font_size=32, color=GREEN)
        example.next_to(binomial, DOWN, buff=0.3)
        self.play(Write(example))

        # Highlight 10 in row 5
        highlight = SurroundingRectangle(triangle[5][2], color=GREEN, buff=0.05)
        self.play(Create(highlight))
        self.wait(2)

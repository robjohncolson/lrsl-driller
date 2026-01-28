"""
Manim animation: Calculating Probability from Distribution

Demonstrates how to find probabilities by adding P(X) values for all X in a range.

Render with:
    manim -qm --format=mp4 l36_prob_from_dist.py ProbFromDistribution

Duration: ~45 seconds
"""

from manim import *


class ProbFromDistribution(Scene):
    def construct(self):
        # Title
        title = Text("Probability from a Distribution", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Distribution table data
        x_values = ["0", "1", "2", "3", "4"]
        p_values = ["0.1", "0.2", "0.3", "0.25", "0.15"]

        # Create table
        table_header = VGroup(
            Text("X:", font_size=28),
            *[Text(x, font_size=28) for x in x_values]
        ).arrange(RIGHT, buff=0.5)

        table_probs = VGroup(
            Text("P(X):", font_size=28),
            *[Text(p, font_size=28) for p in p_values]
        ).arrange(RIGHT, buff=0.5)

        # Align the probability values with X values
        for i in range(len(x_values)):
            table_probs[i+1].align_to(table_header[i+1], LEFT)
        table_probs[0].next_to(table_header[0], DOWN, aligned_edge=LEFT)

        table = VGroup(table_header, table_probs)
        table.move_to(UP * 1.5)

        self.play(FadeIn(table_header), FadeIn(table_probs))
        self.wait(1)

        # Example 1: P(X ≤ 2)
        example1_text = Text("Example 1: Find P(X ≤ 2)", font_size=32, color=BLUE)
        example1_text.next_to(table, DOWN, buff=0.8)
        self.play(Write(example1_text))
        self.wait(0.5)

        # Highlight P(0), P(1), P(2)
        highlight_boxes = VGroup(
            SurroundingRectangle(table_probs[1], color=YELLOW, buff=0.1),
            SurroundingRectangle(table_probs[2], color=YELLOW, buff=0.1),
            SurroundingRectangle(table_probs[3], color=YELLOW, buff=0.1)
        )
        self.play(Create(highlight_boxes))
        self.wait(0.5)

        # Show calculation
        calc1 = MathTex(
            r"P(X \leq 2)", "=", "0.1", "+", "0.2", "+", "0.3", "=", "0.6",
            font_size=36
        )
        calc1.next_to(example1_text, DOWN, buff=0.4)
        calc1[2].set_color(YELLOW)
        calc1[4].set_color(YELLOW)
        calc1[6].set_color(YELLOW)
        calc1[8].set_color(GREEN)

        self.play(Write(calc1[:7]))
        self.wait(0.8)
        self.play(Write(calc1[7:]))
        self.wait(1)

        # Clear example 1
        self.play(
            FadeOut(example1_text),
            FadeOut(highlight_boxes),
            FadeOut(calc1)
        )
        self.wait(0.3)

        # Example 2: P(X ≥ 3)
        example2_text = Text("Example 2: Find P(X ≥ 3)", font_size=32, color=BLUE)
        example2_text.next_to(table, DOWN, buff=0.8)
        self.play(Write(example2_text))
        self.wait(0.5)

        # Highlight P(3), P(4)
        highlight_boxes2 = VGroup(
            SurroundingRectangle(table_probs[4], color=YELLOW, buff=0.1),
            SurroundingRectangle(table_probs[5], color=YELLOW, buff=0.1)
        )
        self.play(Create(highlight_boxes2))
        self.wait(0.5)

        # Show calculation
        calc2 = MathTex(
            r"P(X \geq 3)", "=", "0.25", "+", "0.15", "=", "0.4",
            font_size=36
        )
        calc2.next_to(example2_text, DOWN, buff=0.4)
        calc2[2].set_color(YELLOW)
        calc2[4].set_color(YELLOW)
        calc2[6].set_color(GREEN)

        self.play(Write(calc2[:5]))
        self.wait(0.8)
        self.play(Write(calc2[5:]))
        self.wait(1)

        # Clear example 2
        self.play(
            FadeOut(example2_text),
            FadeOut(highlight_boxes2),
            FadeOut(calc2)
        )
        self.wait(0.3)

        # Key insight
        insight = VGroup(
            Text("Key Insight:", font_size=32, color=GOLD, weight=BOLD),
            Text("Add probabilities for all values", font_size=28),
            Text("in the range", font_size=28)
        )
        insight.arrange(DOWN, buff=0.2, center=False, aligned_edge=LEFT)
        insight[1].align_to(insight[0], LEFT)
        insight[2].align_to(insight[0], LEFT)
        insight.next_to(table, DOWN, buff=0.8)

        self.play(Write(insight))
        self.wait(2)

        # Fade out everything
        self.play(
            FadeOut(title),
            FadeOut(table),
            FadeOut(insight)
        )
        self.wait(0.5)

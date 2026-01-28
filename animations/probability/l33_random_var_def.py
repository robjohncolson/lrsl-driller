"""
Random Variable Definition Animation (l33)

Explains what random variables are, the capital letter convention,
and the requirement that they must be numerical.

Run with:
manim -qm --format=mp4 l33_random_var_def.py RandomVariableDef
"""

from manim import *

class RandomVariableDef(Scene):
    def construct(self):
        # Title
        title = Text("Random Variables", font_size=48, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Definition
        definition = Text(
            "Assigns numbers to random outcomes",
            font_size=36,
            color=YELLOW
        )
        definition.next_to(title, DOWN, buff=0.5)
        self.play(FadeIn(definition, shift=UP))
        self.wait(1)

        # Example label
        example_text = Text("Example:", font_size=32, color=BLUE)
        example_text.next_to(definition, DOWN, buff=0.8)
        self.play(Write(example_text))

        # X = number of heads in 3 coin flips
        x_definition = MathTex(
            "X", "=", "\\text{number of heads in 3 coin flips}",
            font_size=32
        )
        x_definition[0].set_color(GREEN)
        x_definition.next_to(example_text, DOWN, buff=0.3)
        self.play(Write(x_definition))
        self.wait(0.5)

        # Show possible outcomes
        outcomes_label = Text("Possible values:", font_size=28)
        outcomes_label.next_to(x_definition, DOWN, buff=0.5)

        outcomes = MathTex("0, 1, 2, 3", font_size=36, color=GREEN)
        outcomes.next_to(outcomes_label, RIGHT, buff=0.3)

        self.play(
            FadeIn(outcomes_label),
            FadeIn(outcomes, shift=LEFT)
        )
        self.wait(1)

        # Clear for next section
        self.play(
            FadeOut(example_text),
            FadeOut(x_definition),
            FadeOut(outcomes_label),
            FadeOut(outcomes)
        )

        # Capital letter convention
        convention = Text(
            "Always use CAPITAL letters:",
            font_size=32,
            color=BLUE
        )
        convention.next_to(definition, DOWN, buff=0.8)

        letters = MathTex("X, Y, W, Z", font_size=40, color=GREEN)
        letters.next_to(convention, DOWN, buff=0.3)

        self.play(Write(convention))
        self.play(Write(letters))
        self.wait(1)

        # Clear for counterexample
        self.play(
            FadeOut(convention),
            FadeOut(letters)
        )

        # NOT a random variable example
        not_rv_label = Text("NOT a random variable:", font_size=32, color=RED)
        not_rv_label.next_to(definition, DOWN, buff=0.8)

        bad_example = Text(
            '"Color of car"',
            font_size=32,
            color=RED
        )
        bad_example.next_to(not_rv_label, DOWN, buff=0.3)

        reason = Text(
            "(not numerical!)",
            font_size=28,
            color=RED,
            slant=ITALIC
        )
        reason.next_to(bad_example, DOWN, buff=0.2)

        self.play(Write(not_rv_label))
        self.play(Write(bad_example))
        self.play(FadeIn(reason))
        self.wait(1)

        # Clear for key insight
        self.play(
            FadeOut(not_rv_label),
            FadeOut(bad_example),
            FadeOut(reason)
        )

        # Key insight
        key_insight = VGroup(
            Text("Numerical", font_size=36, color=GREEN),
            MathTex("+", font_size=36),
            Text("Random", font_size=36, color=BLUE),
            MathTex("=", font_size=36),
            Text("Random Variable", font_size=36, color=YELLOW, weight=BOLD)
        ).arrange(RIGHT, buff=0.3)
        key_insight.next_to(definition, DOWN, buff=1)

        self.play(Write(key_insight))
        self.wait(2)

        # Fade out everything
        self.play(
            FadeOut(title),
            FadeOut(definition),
            FadeOut(key_insight)
        )

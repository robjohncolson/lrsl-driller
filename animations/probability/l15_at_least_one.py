"""
At Least One Problems - Probability Animation

Shows the complement trick for "at least one" problems.
Demonstrates why P(at least 1) = 1 - P(none) is easier than direct calculation.

Render with:
manim -qm --format=mp4 l15_at_least_one.py AtLeastOne
"""

from manim import *

class AtLeastOne(Scene):
    def construct(self):
        # Title
        title = Text("At Least One Problems", font_size=48, weight=BOLD)
        self.play(Write(title))
        self.wait(0.5)
        self.play(title.animate.scale(0.7).to_edge(UP))
        self.wait(0.3)

        # Show the hard way (RED)
        hard_label = Text("Direct Method:", color=RED, font_size=32)
        hard_label.next_to(title, DOWN, buff=0.8).to_edge(LEFT, buff=1)

        hard_formula = MathTex(
            r"P(\geq 1) = ",
            r"P(1)", r"+", r"P(2)", r"+", r"P(3)", r"+", r"\cdots",
            font_size=36
        )
        hard_formula.next_to(hard_label, DOWN, buff=0.4)
        hard_formula[1:].set_color(RED)

        hard_note = Text("(lots of terms!)", color=RED, font_size=24, slant=ITALIC)
        hard_note.next_to(hard_formula, RIGHT, buff=0.3)

        self.play(Write(hard_label))
        self.play(Write(hard_formula))
        self.play(FadeIn(hard_note))
        self.wait(0.8)

        # Show the easy way (GREEN)
        easy_label = Text("Complement Method:", color=GREEN, font_size=32)
        easy_label.next_to(hard_formula, DOWN, buff=0.8).align_to(hard_label, LEFT)

        easy_formula = MathTex(
            r"P(\geq 1) = ",
            r"1 - P(0)",
            font_size=36
        )
        easy_formula.next_to(easy_label, DOWN, buff=0.4)
        easy_formula[1].set_color(GREEN)

        easy_note = Text("(just ONE calculation!)", color=GREEN, font_size=24, slant=ITALIC)
        easy_note.next_to(easy_formula, RIGHT, buff=0.3)

        self.play(Write(easy_label))
        self.play(Write(easy_formula))
        self.play(FadeIn(easy_note))
        self.wait(0.8)

        # Clear for example
        self.play(
            FadeOut(hard_label), FadeOut(hard_formula), FadeOut(hard_note),
            FadeOut(easy_label), FadeOut(easy_formula), FadeOut(easy_note)
        )
        self.wait(0.3)

        # Example: 3 coin flips
        example_title = Text("Example: 3 coin flips", font_size=36, weight=BOLD)
        example_title.next_to(title, DOWN, buff=0.6)

        question = Text("P(at least 1 head) = ?", font_size=32)
        question.next_to(example_title, DOWN, buff=0.5)

        self.play(Write(example_title))
        self.play(Write(question))
        self.wait(0.5)

        # Show coins representing TTT (all tails = no heads)
        coins = VGroup()
        for i in range(3):
            coin = Circle(radius=0.3, color=BLUE, fill_opacity=0.3)
            coin_label = Text("T", font_size=28, color=WHITE)
            coin_label.move_to(coin.get_center())
            coin_group = VGroup(coin, coin_label)
            coin_group.shift(LEFT * 2 + RIGHT * i * 1.2 + DOWN * 1.2)
            coins.add(coin_group)

        self.play(LaggedStart(*[FadeIn(c) for c in coins], lag_ratio=0.2))
        self.wait(0.3)

        # Step 1: P(no heads)
        step1 = MathTex(
            r"P(\text{no heads}) = P(\text{TTT}) = (0.5)^3 = 0.125",
            font_size=32,
            color=YELLOW
        )
        step1.next_to(coins, DOWN, buff=0.6)

        self.play(Write(step1))
        self.wait(0.8)

        # Step 2: Use complement
        step2 = MathTex(
            r"P(\geq 1 \text{ head}) = 1 - 0.125 = 0.875",
            font_size=32,
            color=GREEN
        )
        step2.next_to(step1, DOWN, buff=0.4)

        self.play(Write(step2))
        self.wait(0.8)

        # Clear example
        self.play(
            FadeOut(example_title), FadeOut(question),
            FadeOut(coins), FadeOut(step1), FadeOut(step2)
        )
        self.wait(0.3)

        # Key insight
        insight_box = Rectangle(
            width=10,
            height=2,
            color=GREEN,
            fill_opacity=0.2,
            stroke_width=3
        )
        insight_box.move_to(ORIGIN)

        insight_text = Text(
            "Use the complement - it's easier!",
            font_size=40,
            weight=BOLD,
            color=GREEN
        )
        insight_text.move_to(insight_box.get_center())

        formula_reminder = MathTex(
            r"P(\text{at least 1}) = 1 - P(\text{none})",
            font_size=36,
            color=WHITE
        )
        formula_reminder.next_to(insight_text, DOWN, buff=0.3)

        self.play(Create(insight_box))
        self.play(Write(insight_text))
        self.play(Write(formula_reminder))
        self.wait(1.5)

        # Fade out
        self.play(
            FadeOut(insight_box),
            FadeOut(insight_text),
            FadeOut(formula_reminder),
            FadeOut(title)
        )
        self.wait(0.3)

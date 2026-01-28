"""
Independent Events Definition Animation

Render with:
manim -qm --format=mp4 l25_independent_def.py IndependentEventsDef

Duration: ~40 seconds
"""

from manim import *

class IndependentEventsDef(Scene):
    def construct(self):
        # 1. Title (0-3s)
        title = Text("Independent Events", font_size=56, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(1)

        # 2. Definition (3-8s)
        definition = Text(
            "Knowing one occurred doesn't change\nthe probability of the other",
            font_size=36,
            color=YELLOW
        )
        definition.next_to(title, DOWN, buff=0.5)
        self.play(FadeIn(definition))
        self.wait(3)

        # Move definition up and shrink
        self.play(
            definition.animate.scale(0.7).next_to(title, DOWN, buff=0.3)
        )

        # 3. Two equivalent tests (8-20s)
        test_title = Text("Two Equivalent Tests:", font_size=32, weight=BOLD)
        test_title.move_to(UP * 1.5)

        # Test 1
        test1_label = Text("Test 1:", font_size=28, color=BLUE)
        test1_formula = MathTex(r"P(A|B) = P(A)", font_size=40, color=BLUE)
        test1_desc = Text("(Conditional = Unconditional)", font_size=20, color=GRAY)
        test1_group = VGroup(test1_label, test1_formula, test1_desc)
        test1_group.arrange(RIGHT, buff=0.3)
        test1_group.move_to(UP * 0.5)

        # Test 2
        test2_label = Text("Test 2:", font_size=28, color=GREEN)
        test2_formula = MathTex(r"P(A \cap B) = P(A) \times P(B)", font_size=40, color=GREEN)
        test2_desc = Text("(Multiplication Rule)", font_size=20, color=GRAY)
        test2_group = VGroup(test2_label, test2_formula, test2_desc)
        test2_group.arrange(RIGHT, buff=0.3)
        test2_group.next_to(test1_group, DOWN, buff=0.5)

        self.play(
            FadeOut(definition),
            Write(test_title)
        )
        self.wait(1)

        # Show Test 1
        self.play(
            Write(test1_label),
            Write(test1_formula)
        )
        self.play(FadeIn(test1_desc))
        self.wait(2)

        # Show Test 2
        self.play(
            Write(test2_label),
            Write(test2_formula)
        )
        self.play(FadeIn(test2_desc))
        self.wait(2)

        # 4. Example: Coin flip and die roll (20-30s)
        self.play(
            FadeOut(test_title),
            FadeOut(test1_group),
            FadeOut(test2_group)
        )

        example_title = Text("Example: Coin & Die", font_size=36, weight=BOLD, color=YELLOW)
        example_title.move_to(UP * 2)

        # Coin
        coin = Circle(radius=0.5, color=GOLD, fill_opacity=0.8)
        coin_label = Text("H", font_size=32, color=BLACK, weight=BOLD)
        coin_group = VGroup(coin, coin_label)
        coin_group.move_to(LEFT * 3 + UP * 0.5)

        coin_text = Text("Flip Heads", font_size=24)
        coin_text.next_to(coin_group, DOWN, buff=0.3)

        # Die
        die = Square(side_length=1, color=RED, fill_opacity=0.8)
        die_label = Text("6", font_size=40, color=WHITE, weight=BOLD)
        die_group = VGroup(die, die_label)
        die_group.move_to(RIGHT * 3 + UP * 0.5)

        die_text = Text("Roll 6", font_size=24)
        die_text.next_to(die_group, DOWN, buff=0.3)

        # Independence statement
        independence = Text(
            "These are INDEPENDENT\n(coin doesn't affect die)",
            font_size=28,
            color=GREEN
        )
        independence.move_to(DOWN * 1.2)

        # Verification
        verify = MathTex(
            r"P(\text{H}) = \frac{1}{2}, \quad P(\text{6}) = \frac{1}{6}",
            font_size=32
        )
        verify.next_to(independence, DOWN, buff=0.4)

        verify2 = MathTex(
            r"P(\text{H and 6}) = \frac{1}{2} \times \frac{1}{6} = \frac{1}{12} \quad \checkmark",
            font_size=32,
            color=GREEN
        )
        verify2.next_to(verify, DOWN, buff=0.3)

        self.play(Write(example_title))
        self.play(
            Create(coin),
            Write(coin_label),
            FadeIn(coin_text)
        )
        self.play(
            Create(die),
            Write(die_label),
            FadeIn(die_text)
        )
        self.wait(1)

        self.play(Write(independence))
        self.wait(1)
        self.play(Write(verify))
        self.wait(1)
        self.play(Write(verify2))
        self.wait(2)

        # 5. Warning box (30-40s)
        self.play(
            FadeOut(example_title),
            FadeOut(coin_group),
            FadeOut(coin_text),
            FadeOut(die_group),
            FadeOut(die_text),
            FadeOut(independence),
            FadeOut(verify),
            FadeOut(verify2)
        )

        # Warning box
        warning_box = Rectangle(
            width=11,
            height=2.5,
            color=RED,
            fill_opacity=0.2,
            stroke_width=6
        )
        warning_box.move_to(ORIGIN)

        warning_icon = Text("⚠", font_size=80, color=RED)
        warning_icon.move_to(LEFT * 4)

        warning_title = Text("IMPORTANT:", font_size=36, weight=BOLD, color=RED)
        warning_title.move_to(UP * 0.6 + RIGHT * 0.5)

        warning_text = Text(
            "Independent ≠ Mutually Exclusive!",
            font_size=40,
            weight=BOLD,
            color=WHITE
        )
        warning_text.next_to(warning_title, DOWN, buff=0.3)

        explanation = Text(
            "ME: Can't both happen  |  Ind: One doesn't affect other",
            font_size=22,
            color=GRAY
        )
        explanation.next_to(warning_text, DOWN, buff=0.3)

        self.play(Create(warning_box))
        self.play(Write(warning_icon))
        self.wait(0.5)
        self.play(Write(warning_title))
        self.play(Write(warning_text))
        self.wait(1)
        self.play(FadeIn(explanation))
        self.wait(3)

        # Fade out
        self.play(
            FadeOut(title),
            FadeOut(warning_box),
            FadeOut(warning_icon),
            FadeOut(warning_title),
            FadeOut(warning_text),
            FadeOut(explanation)
        )
        self.wait(0.5)

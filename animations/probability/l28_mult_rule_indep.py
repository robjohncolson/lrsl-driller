"""
Manim animation for Multiplication Rule for Independent Events (Lesson 28).

Demonstrates P(A ∩ B) = P(A) × P(B) for independent events only.

Render with:
manim -qm --format=mp4 l28_mult_rule_indep.py MultRuleIndependent
"""

from manim import *


class MultRuleIndependent(Scene):
    def construct(self):
        # 1. Title
        title = Text("Multiplication Rule for Independent Events", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(1)

        # 2. Formula with emphasis on independence
        formula = MathTex(
            r"P(A \cap B) = P(A) \times P(B)",
            font_size=48
        )
        formula.next_to(title, DOWN, buff=0.5)

        independence_note = Text(
            "for INDEPENDENT events only!",
            font_size=28,
            color=YELLOW
        ).next_to(formula, DOWN, buff=0.3)

        self.play(Write(formula))
        self.play(FadeIn(independence_note, shift=UP))
        self.wait(1.5)

        # Move formula up to make room
        self.play(
            VGroup(formula, independence_note).animate.scale(0.7).to_edge(UP, buff=1.2)
        )

        # 3. Example: Two coin flips
        example_title = Text("Example: Two Coin Flips", font_size=32, color=BLUE)
        example_title.move_to(UP * 1.5)
        self.play(Write(example_title))
        self.wait(0.5)

        # Show two coins
        coin1 = Circle(radius=0.5, color=GOLD, fill_opacity=0.8)
        coin1.shift(LEFT * 2.5 + UP * 0.3)
        coin1_label = Text("H", font_size=36, color=BLACK).move_to(coin1.get_center())
        coin1_text = Text("First flip", font_size=20).next_to(coin1, DOWN, buff=0.2)

        coin2 = Circle(radius=0.5, color=GOLD, fill_opacity=0.8)
        coin2.shift(RIGHT * 2.5 + UP * 0.3)
        coin2_label = Text("H", font_size=36, color=BLACK).move_to(coin2.get_center())
        coin2_text = Text("Second flip", font_size=20).next_to(coin2, DOWN, buff=0.2)

        self.play(
            FadeIn(coin1),
            FadeIn(coin1_label),
            FadeIn(coin1_text),
            FadeIn(coin2),
            FadeIn(coin2_label),
            FadeIn(coin2_text)
        )
        self.wait(1)

        # Show probabilities
        prob1 = MathTex(r"P(H_1) = 0.5", font_size=32)
        prob1.next_to(coin1_text, DOWN, buff=0.3)

        prob2 = MathTex(r"P(H_2) = 0.5", font_size=32)
        prob2.next_to(coin2_text, DOWN, buff=0.3)

        self.play(Write(prob1), Write(prob2))
        self.wait(1)

        # Show multiplication
        times_symbol = MathTex(r"\times", font_size=48, color=GREEN)
        times_symbol.move_to(ORIGIN + UP * 0.3)

        self.play(FadeIn(times_symbol, scale=1.5))
        self.wait(0.5)

        # Calculate result
        calculation = MathTex(
            r"P(\text{both H}) = 0.5 \times 0.5 = 0.25",
            font_size=36,
            color=GREEN
        )
        calculation.move_to(DOWN * 1.5)

        self.play(Write(calculation))
        self.wait(1.5)

        # Clear example
        self.play(
            FadeOut(example_title),
            FadeOut(coin1), FadeOut(coin1_label), FadeOut(coin1_text),
            FadeOut(coin2), FadeOut(coin2_label), FadeOut(coin2_text),
            FadeOut(prob1), FadeOut(prob2),
            FadeOut(times_symbol),
            FadeOut(calculation)
        )

        # 4. Warning
        warning_box = Rectangle(
            width=10,
            height=2.5,
            color=RED,
            fill_opacity=0.2,
            stroke_width=4
        )
        warning_box.move_to(ORIGIN)

        warning_title = Text("⚠️ WARNING ⚠️", font_size=40, color=RED)
        warning_title.move_to(warning_box.get_top() + DOWN * 0.5)

        warning_text = Text(
            "Only works for INDEPENDENT events!",
            font_size=32,
            color=RED,
            weight=BOLD
        )
        warning_text.next_to(warning_title, DOWN, buff=0.4)

        self.play(Create(warning_box))
        self.play(Write(warning_title))
        self.play(FadeIn(warning_text, shift=UP))
        self.wait(2)

        # 5. Counter-example preview
        self.play(
            FadeOut(warning_box),
            FadeOut(warning_title),
            FadeOut(warning_text)
        )

        counter_title = Text("Counter-example:", font_size=32, color=ORANGE)
        counter_title.move_to(UP * 1.5)

        counter_text = VGroup(
            Text("Drawing cards WITHOUT replacement", font_size=28),
            Text("→ Events are NOT independent", font_size=28, color=RED),
            Text("→ Must use general rule instead", font_size=28, color=YELLOW)
        ).arrange(DOWN, buff=0.3)
        counter_text.next_to(counter_title, DOWN, buff=0.5)

        self.play(Write(counter_title))
        self.play(FadeIn(counter_text, lag_ratio=0.3))
        self.wait(2.5)

        # Fade all
        self.play(
            *[FadeOut(mob) for mob in self.mobjects]
        )
        self.wait(0.5)

"""
Manim animation demonstrating how to check independence using the multiplication method.

Render command:
    manim -qm --format=mp4 l27_check_indep_mult.py CheckIndepMultiplication

Duration: ~45 seconds
"""

from manim import *


class CheckIndepMultiplication(Scene):
    def construct(self):
        # Title
        title = Text("Checking Independence: Multiplication Method", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(1)

        # Main formula
        formula_text = Text("Compare:", font_size=32)
        formula_left = MathTex(r"P(A) \times P(B)", font_size=36)
        vs_text = Text("vs", font_size=28, color=YELLOW)
        formula_right = MathTex(r"P(A \cap B)", font_size=36)

        formula_group = VGroup(formula_left, vs_text, formula_right).arrange(RIGHT, buff=0.4)
        formula_full = VGroup(formula_text, formula_group).arrange(DOWN, buff=0.3)
        formula_full.next_to(title, DOWN, buff=0.5)

        self.play(Write(formula_text))
        self.play(Write(formula_group))
        self.wait(1.5)

        # Example 1: Independent
        example1_title = Text("Example 1: Testing Independence", font_size=30, color=BLUE)
        example1_title.next_to(formula_full, DOWN, buff=0.6)
        self.play(Write(example1_title))
        self.wait(0.5)

        # Given probabilities
        given1 = VGroup(
            MathTex(r"P(A) = 0.5", font_size=28),
            MathTex(r"P(B) = 0.4", font_size=28),
            MathTex(r"P(A \cap B) = 0.2", font_size=28)
        ).arrange(RIGHT, buff=0.5)
        given1.next_to(example1_title, DOWN, buff=0.4)
        self.play(Write(given1))
        self.wait(1)

        # Calculation
        calc1_step1 = MathTex(r"P(A) \times P(B) = 0.5 \times 0.4", font_size=30)
        calc1_step1.next_to(given1, DOWN, buff=0.4)
        self.play(Write(calc1_step1))
        self.wait(0.8)

        calc1_step2 = MathTex(r"= 0.2", font_size=30)
        calc1_step2.next_to(calc1_step1, RIGHT, buff=0.3)
        self.play(Write(calc1_step2))
        self.wait(0.8)

        # Comparison
        comparison1 = MathTex(r"0.2 = 0.2", font_size=32, color=GREEN)
        comparison1.next_to(calc1_step1, DOWN, buff=0.4)
        self.play(Write(comparison1))
        self.wait(0.5)

        # Checkmark using simple circle
        checkmark = Circle(radius=0.3, color=GREEN, fill_opacity=0.5)
        checkmark.next_to(comparison1, RIGHT, buff=0.3)
        self.play(FadeIn(checkmark, scale=1.5))
        self.wait(0.5)

        result1 = Text("INDEPENDENT", font_size=32, color=GREEN, weight=BOLD)
        result1.next_to(comparison1, DOWN, buff=0.3)
        self.play(Write(result1))
        self.wait(1.5)

        # Clear for Example 2
        self.play(
            FadeOut(example1_title),
            FadeOut(given1),
            FadeOut(calc1_step1),
            FadeOut(calc1_step2),
            FadeOut(comparison1),
            FadeOut(checkmark),
            FadeOut(result1)
        )
        self.wait(0.5)

        # Example 2: Dependent
        example2_title = Text("Example 2: Testing Independence", font_size=30, color=BLUE)
        example2_title.next_to(formula_full, DOWN, buff=0.6)
        self.play(Write(example2_title))
        self.wait(0.5)

        # Given probabilities
        given2 = VGroup(
            MathTex(r"P(A) = 0.5", font_size=28),
            MathTex(r"P(B) = 0.4", font_size=28),
            MathTex(r"P(A \cap B) = 0.3", font_size=28, color=ORANGE)
        ).arrange(RIGHT, buff=0.5)
        given2.next_to(example2_title, DOWN, buff=0.4)
        self.play(Write(given2))
        self.wait(1)

        # Calculation
        calc2_step1 = MathTex(r"P(A) \times P(B) = 0.5 \times 0.4", font_size=30)
        calc2_step1.next_to(given2, DOWN, buff=0.4)
        self.play(Write(calc2_step1))
        self.wait(0.8)

        calc2_step2 = MathTex(r"= 0.2", font_size=30)
        calc2_step2.next_to(calc2_step1, RIGHT, buff=0.3)
        self.play(Write(calc2_step2))
        self.wait(0.8)

        # Comparison - Not equal
        comparison2 = MathTex(r"0.2 \neq 0.3", font_size=32, color=RED)
        comparison2.next_to(calc2_step1, DOWN, buff=0.4)
        self.play(Write(comparison2))
        self.wait(0.5)

        # X mark using simple X shape
        xmark = Cross(scale_factor=0.3, color=RED, stroke_width=8)
        xmark.next_to(comparison2, RIGHT, buff=0.3)
        self.play(FadeIn(xmark, scale=1.5))
        self.wait(0.5)

        result2 = Text("DEPENDENT", font_size=32, color=RED, weight=BOLD)
        result2.next_to(comparison2, DOWN, buff=0.3)
        self.play(Write(result2))
        self.wait(1.5)

        # Key insight
        self.play(
            FadeOut(example2_title),
            FadeOut(given2),
            FadeOut(calc2_step1),
            FadeOut(calc2_step2),
            FadeOut(comparison2),
            FadeOut(xmark),
            FadeOut(result2)
        )

        insight_box = Rectangle(
            width=10,
            height=1.2,
            color=YELLOW,
            fill_opacity=0.2,
            stroke_width=3
        )
        insight_text = Text(
            "Key: Multiply first, then compare",
            font_size=32,
            color=YELLOW,
            weight=BOLD
        )
        insight_text.move_to(insight_box.get_center())
        insight_group = VGroup(insight_box, insight_text)
        insight_group.next_to(formula_full, DOWN, buff=0.8)

        self.play(Create(insight_box))
        self.play(Write(insight_text))
        self.wait(2)

        # Fade out everything explicitly
        self.play(
            FadeOut(title),
            FadeOut(formula_full),
            FadeOut(insight_group)
        )
        self.wait(0.5)

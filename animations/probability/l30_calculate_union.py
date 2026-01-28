"""
Manim animation for calculating P(A or B) with general and mutually exclusive cases.

Render command:
manim -qm --format=mp4 l30_calculate_union.py CalculateUnion
"""

from manim import *

class CalculateUnion(Scene):
    def construct(self):
        # Title
        title = Text("Calculating P(A or B)", font_size=48, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # General formula
        formula = MathTex(
            r"P(A \cup B) = P(A) + P(B) - P(A \cap B)",
            font_size=40
        )
        formula.next_to(title, DOWN, buff=0.5)
        self.play(Write(formula))
        self.wait(1)

        # Example 1: General case
        example1_title = Text("Example 1: General Case", font_size=36, color=BLUE)
        example1_title.next_to(formula, DOWN, buff=0.8)
        self.play(FadeIn(example1_title))
        self.wait(0.3)

        # Given values with colors
        given1 = VGroup(
            MathTex(r"P(A) = 0.4", color=RED, font_size=36),
            MathTex(r"P(B) = 0.5", color=GREEN, font_size=36),
            MathTex(r"P(A \cap B) = 0.1", color=ORANGE, font_size=36)
        ).arrange(RIGHT, buff=0.8)
        given1.next_to(example1_title, DOWN, buff=0.4)
        self.play(FadeIn(given1))
        self.wait(0.5)

        # Step-by-step calculation
        calc1_step1 = MathTex(
            r"P(A \cup B) = ",
            r"0.4",
            r" + ",
            r"0.5",
            r" - ",
            r"0.1",
            font_size=36
        )
        calc1_step1[1].set_color(RED)
        calc1_step1[3].set_color(GREEN)
        calc1_step1[5].set_color(ORANGE)
        calc1_step1.next_to(given1, DOWN, buff=0.5)
        self.play(Write(calc1_step1))
        self.wait(0.5)

        # Step 2: Add first two
        calc1_step2 = MathTex(
            r"P(A \cup B) = ",
            r"0.9",
            r" - ",
            r"0.1",
            font_size=36
        )
        calc1_step2[1].set_color(PURPLE)
        calc1_step2[3].set_color(ORANGE)
        calc1_step2.next_to(given1, DOWN, buff=0.5)
        self.play(Transform(calc1_step1, calc1_step2))
        self.wait(0.5)

        # Step 3: Final answer
        calc1_step3 = MathTex(
            r"P(A \cup B) = ",
            r"0.8",
            font_size=36
        )
        calc1_step3[1].set_color(YELLOW)
        calc1_step3.next_to(given1, DOWN, buff=0.5)
        self.play(Transform(calc1_step1, calc1_step3))
        self.wait(1)

        # Clear for example 2
        self.play(
            FadeOut(example1_title),
            FadeOut(given1),
            FadeOut(calc1_step1)
        )
        self.wait(0.3)

        # Example 2: Mutually Exclusive case
        example2_title = Text("Example 2: Mutually Exclusive", font_size=36, color=BLUE)
        example2_title.next_to(formula, DOWN, buff=0.8)
        self.play(FadeIn(example2_title))
        self.wait(0.3)

        # Given values for ME case
        given2 = VGroup(
            MathTex(r"P(A) = 0.3", color=RED, font_size=36),
            MathTex(r"P(B) = 0.5", color=GREEN, font_size=36),
            MathTex(r"P(A \cap B) = 0", color=ORANGE, font_size=36)
        ).arrange(RIGHT, buff=0.8)
        given2.next_to(example2_title, DOWN, buff=0.4)
        self.play(FadeIn(given2))
        self.wait(0.5)

        # ME calculation
        calc2_step1 = MathTex(
            r"P(A \cup B) = ",
            r"0.3",
            r" + ",
            r"0.5",
            r" - ",
            r"0",
            font_size=36
        )
        calc2_step1[1].set_color(RED)
        calc2_step1[3].set_color(GREEN)
        calc2_step1[5].set_color(ORANGE)
        calc2_step1.next_to(given2, DOWN, buff=0.5)
        self.play(Write(calc2_step1))
        self.wait(0.5)

        # Simplify (subtract zero disappears)
        calc2_step2 = MathTex(
            r"P(A \cup B) = ",
            r"0.3",
            r" + ",
            r"0.5",
            font_size=36
        )
        calc2_step2[1].set_color(RED)
        calc2_step2[3].set_color(GREEN)
        calc2_step2.next_to(given2, DOWN, buff=0.5)
        self.play(Transform(calc2_step1, calc2_step2))
        self.wait(0.5)

        # Final answer
        calc2_step3 = MathTex(
            r"P(A \cup B) = ",
            r"0.8",
            font_size=36
        )
        calc2_step3[1].set_color(YELLOW)
        calc2_step3.next_to(given2, DOWN, buff=0.5)
        self.play(Transform(calc2_step1, calc2_step3))
        self.wait(0.5)

        # Key insight
        insight_box = Rectangle(
            width=8,
            height=1.2,
            fill_color=BLUE,
            fill_opacity=0.2,
            stroke_color=BLUE,
            stroke_width=3
        )
        insight_text = Text(
            "When Mutually Exclusive, just add!",
            font_size=36,
            weight=BOLD,
            color=YELLOW
        )
        insight = VGroup(insight_box, insight_text)
        insight.move_to(DOWN * 2.8)

        self.play(
            Create(insight_box),
            Write(insight_text)
        )
        self.wait(2)

        # Fade out everything
        self.play(
            FadeOut(title),
            FadeOut(formula),
            FadeOut(example2_title),
            FadeOut(given2),
            FadeOut(calc2_step1),
            FadeOut(insight)
        )
        self.wait(0.5)

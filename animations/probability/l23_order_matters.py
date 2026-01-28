"""
Order Matters in Conditional Probability

Demonstrates that P(A|B) ≠ P(B|A) by showing:
- Same numerator P(A ∩ B)
- Different denominators P(B) vs P(A)
- Concrete numerical example

Render with:
manim -qm --format=mp4 l23_order_matters.py OrderMattersConditional
"""

from manim import *

class OrderMattersConditional(Scene):
    def construct(self):
        # Title (0-2s)
        title = Text("Order Matters in Conditional Probability", font_size=40)
        title.to_edge(UP)
        self.play(Write(title), run_time=1.5)
        self.wait(0.5)

        # Show both formulas side by side (2-6s)
        formula_left = MathTex(
            "P(A|B)", "=", r"\frac{P(A \cap B)}{P(B)}"
        ).scale(0.9)
        formula_right = MathTex(
            "P(B|A)", "=", r"\frac{P(A \cap B)}{P(A)}"
        ).scale(0.9)

        formula_left.shift(LEFT * 3.5 + UP * 1.5)
        formula_right.shift(RIGHT * 3.5 + UP * 1.5)

        self.play(
            Write(formula_left),
            Write(formula_right),
            run_time=2
        )
        self.wait(2)

        # Highlight same numerator (6-10s)
        numerator_left = formula_left[2][0:7]  # P(A ∩ B)
        numerator_right = formula_right[2][0:7]  # P(A ∩ B)

        same_num_label = Text("Same numerator!", font_size=28, color=YELLOW)
        same_num_label.next_to(formula_left, DOWN, buff=0.3)

        self.play(
            numerator_left.animate.set_color(YELLOW),
            numerator_right.animate.set_color(YELLOW),
            FadeIn(same_num_label),
            run_time=1.5
        )
        self.wait(2.5)

        # Highlight different denominators (10-15s)
        denominator_left = formula_left[2][8:12]  # P(B)
        denominator_right = formula_right[2][8:12]  # P(A)

        diff_denom_label = Text("Different denominators!", font_size=28, color=RED)
        diff_denom_label.next_to(same_num_label, DOWN, buff=0.2)

        self.play(
            FadeOut(same_num_label),
            denominator_left.animate.set_color(RED),
            denominator_right.animate.set_color(BLUE),
            FadeIn(diff_denom_label),
            run_time=1.5
        )
        self.wait(3.5)

        # Concrete example (15-35s)
        self.play(
            FadeOut(diff_denom_label),
            formula_left.animate.shift(UP * 0.5).scale(0.85),
            formula_right.animate.shift(UP * 0.5).scale(0.85),
            run_time=1
        )

        # Given values
        given = VGroup(
            MathTex(r"P(A \cap B) = 20", color=YELLOW),
            MathTex(r"P(A) = 50", color=BLUE),
            MathTex(r"P(B) = 80", color=RED),
            Text("(out of 100 total)", font_size=24, color=GRAY)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.25)
        given.shift(DOWN * 0.5 + LEFT * 3.5)

        self.play(Write(given), run_time=2)
        self.wait(1)

        # Calculate P(A|B)
        calc_left = VGroup(
            MathTex("P(A|B)", "=", r"\frac{20}{80}").scale(0.8),
            MathTex("=", "0.25").scale(0.8)
        ).arrange(DOWN, buff=0.3)
        calc_left.next_to(given, DOWN, buff=0.5)
        calc_left[0][2][0:2].set_color(YELLOW)  # 20
        calc_left[0][2][3:5].set_color(RED)  # 80

        # Calculate P(B|A)
        calc_right = VGroup(
            MathTex("P(B|A)", "=", r"\frac{20}{50}").scale(0.8),
            MathTex("=", "0.40").scale(0.8)
        ).arrange(DOWN, buff=0.3)
        calc_right.shift(RIGHT * 3.5 + DOWN * 0.5)
        calc_right[0][2][0:2].set_color(YELLOW)  # 20
        calc_right[0][2][3:5].set_color(BLUE)  # 50

        self.play(
            Write(calc_left),
            Write(calc_right),
            run_time=2.5
        )
        self.wait(2)

        # Highlight different results
        box_left = SurroundingRectangle(calc_left[1], color=GREEN, buff=0.1)
        box_right = SurroundingRectangle(calc_right[1], color=GREEN, buff=0.1)

        self.play(
            Create(box_left),
            Create(box_right),
            run_time=1
        )
        self.wait(2.5)

        # Key insight (35-45s)
        insight = Text(
            "Same top, different bottom → different answers!",
            font_size=36,
            color=GREEN,
            weight=BOLD
        )
        insight.to_edge(DOWN, buff=0.5)

        self.play(Write(insight), run_time=1.5)
        self.wait(3.5)

        # Fade out
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
            run_time=1
        )

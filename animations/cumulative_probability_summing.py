"""
Cumulative Binomial Probability - Direct Sum vs Complement
AP Statistics: Shows two approaches for calculating cumulative binomial probabilities.

- Direct sum: P(X <= k) = P(0) + P(1) + ... + P(k)
- Complement: P(X >= k) = 1 - P(X <= k-1)

Uses example: n=5, p=0.4

Run with: manim -qm --format=mp4 cumulative_probability_summing.py CumulativeProbabilitySumming
"""
from manim import *
import math


def binomial_prob(n, k, p):
    """Calculate P(X = k) for binomial(n, p)"""
    comb = math.comb(n, k)
    return comb * (p ** k) * ((1 - p) ** (n - k))


class CumulativeProbabilitySumming(Scene):
    def construct(self):
        # Parameters
        n = 5
        p = 0.4

        # Calculate all probabilities P(X = k) for k = 0 to 5
        probs = [binomial_prob(n, k, p) for k in range(n + 1)]

        # Color scheme
        DIRECT_SUM_COLOR = BLUE
        COMPLEMENT_COLOR = RED
        FINAL_ANSWER_COLOR = GREEN

        # =====================
        # PART 1: Title and Setup
        # =====================

        title = Text("Cumulative Binomial Probability", font_size=40)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # Show the setup
        setup_text = MathTex(
            r"\text{Binomial: } n = 5, \, p = 0.4",
            font_size=32
        )
        setup_text.next_to(title, DOWN, buff=0.3)
        self.play(Write(setup_text))
        self.wait(0.5)

        # =====================
        # PART 2: Build Histogram
        # =====================

        # Create bars for the distribution
        bars = VGroup()
        bar_width = 0.5
        bar_scale = 6  # Scale factor for visibility
        bar_spacing = 0.8

        for k in range(n + 1):
            bar_height = probs[k] * bar_scale
            bar = Rectangle(
                width=bar_width,
                height=max(bar_height, 0.05),  # Minimum height for visibility
                fill_color=WHITE,
                fill_opacity=0.5,
                stroke_color=WHITE,
                stroke_width=2
            )
            bar.move_to(RIGHT * (k * bar_spacing) + UP * (bar_height / 2))

            # X label below bar
            x_label = MathTex(str(k), font_size=20)
            x_label.next_to(bar, DOWN, buff=0.1)

            # Probability label on top
            p_label = MathTex(f"{probs[k]:.3f}", font_size=14)
            p_label.next_to(bar, UP, buff=0.05)

            bar_group = VGroup(bar, x_label, p_label)
            bars.add(bar_group)

        bars.center()
        bars.shift(UP * 0.5)

        # Axis labels
        x_axis_label = MathTex("X", font_size=24)
        x_axis_label.next_to(bars, DOWN, buff=0.4)

        self.play(
            LaggedStart(*[GrowFromEdge(bar[0], DOWN) for bar in bars], lag_ratio=0.15),
            run_time=1.5
        )
        self.play(
            *[Write(bar[1]) for bar in bars],  # X labels
            *[Write(bar[2]) for bar in bars],  # P labels
            Write(x_axis_label),
            run_time=0.8
        )
        self.wait(0.5)

        # Move histogram up and scale down slightly
        self.play(
            bars.animate.scale(0.85).move_to(UP * 2.2),
            x_axis_label.animate.scale(0.85).move_to(UP * 0.9),
            FadeOut(setup_text)
        )
        self.wait(0.3)

        # =====================
        # PART 3: Create Dividing Line for Two Approaches
        # =====================

        divider = DashedLine(
            start=UP * 0.5,
            end=DOWN * 3.5,
            color=WHITE,
            dash_length=0.1
        )
        self.play(Create(divider))

        # Section labels
        left_label = Text("Direct Sum", font_size=24, color=DIRECT_SUM_COLOR)
        left_label.move_to(LEFT * 3.5 + UP * 0.3)

        right_label = Text("Complement", font_size=24, color=COMPLEMENT_COLOR)
        right_label.move_to(RIGHT * 3.5 + UP * 0.3)

        self.play(Write(left_label), Write(right_label))
        self.wait(0.5)

        # =====================
        # PART 4: Left Side - Direct Sum P(X <= 2)
        # =====================

        # Question
        left_question = MathTex(
            r"P(X \leq 2) = \, ?",
            font_size=28,
            color=DIRECT_SUM_COLOR
        )
        left_question.move_to(LEFT * 3.5 + DOWN * 0.3)
        self.play(Write(left_question))

        # Highlight bars 0, 1, 2
        bar_highlights_left = []
        for k in range(3):  # k = 0, 1, 2
            self.play(
                bars[k][0].animate.set_fill(DIRECT_SUM_COLOR, opacity=0.8),
                run_time=0.4
            )
            bar_highlights_left.append(k)
        self.wait(0.3)

        # Formula
        left_formula = MathTex(
            r"P(X \leq 2) = P(0) + P(1) + P(2)",
            font_size=22
        )
        left_formula.move_to(LEFT * 3.5 + DOWN * 0.9)
        self.play(Write(left_formula))
        self.wait(0.3)

        # Calculation
        p0, p1, p2 = probs[0], probs[1], probs[2]
        cumulative_2 = p0 + p1 + p2

        left_calc = MathTex(
            f"= {p0:.3f} + {p1:.3f} + {p2:.3f}",
            font_size=22
        )
        left_calc.move_to(LEFT * 3.5 + DOWN * 1.4)
        self.play(Write(left_calc))
        self.wait(0.3)

        # Result
        left_result = MathTex(
            f"= {cumulative_2:.3f}",
            font_size=28,
            color=FINAL_ANSWER_COLOR
        )
        left_result.move_to(LEFT * 3.5 + DOWN * 1.9)
        self.play(Write(left_result))
        self.wait(0.5)

        # General formula
        left_general = MathTex(
            r"P(X \leq k) = \sum_{i=0}^{k} P(X = i)",
            font_size=20
        )
        left_general.move_to(LEFT * 3.5 + DOWN * 2.6)
        left_general_box = SurroundingRectangle(left_general, color=DIRECT_SUM_COLOR, buff=0.1)
        self.play(Write(left_general), Create(left_general_box))
        self.wait(0.5)

        # =====================
        # PART 5: Right Side - Complement P(X >= 3)
        # =====================

        # Question
        right_question = MathTex(
            r"P(X \geq 3) = \, ?",
            font_size=28,
            color=COMPLEMENT_COLOR
        )
        right_question.move_to(RIGHT * 3.5 + DOWN * 0.3)
        self.play(Write(right_question))
        self.wait(0.3)

        # Show the "at least" concept
        right_approach1 = Text("Could sum P(3) + P(4) + P(5)...", font_size=16)
        right_approach1.move_to(RIGHT * 3.5 + DOWN * 0.8)
        self.play(Write(right_approach1))
        self.wait(0.3)

        # But there's a trick!
        right_trick = Text("OR use the complement!", font_size=18, color=YELLOW)
        right_trick.move_to(RIGHT * 3.5 + DOWN * 1.2)
        self.play(Write(right_trick))
        self.wait(0.5)

        self.play(FadeOut(right_approach1))

        # Complement formula
        right_formula = MathTex(
            r"P(X \geq 3) = 1 - P(X \leq 2)",
            font_size=22,
            color=COMPLEMENT_COLOR
        )
        right_formula.move_to(RIGHT * 3.5 + DOWN * 0.9)
        self.play(Write(right_formula), FadeOut(right_trick))
        self.wait(0.3)

        # Highlight bars 3, 4, 5 in red
        for k in range(3, 6):  # k = 3, 4, 5
            self.play(
                bars[k][0].animate.set_fill(COMPLEMENT_COLOR, opacity=0.8),
                run_time=0.3
            )
        self.wait(0.3)

        # Calculation using the result from left side
        right_calc = MathTex(
            f"= 1 - {cumulative_2:.3f}",
            font_size=22
        )
        right_calc.move_to(RIGHT * 3.5 + DOWN * 1.4)
        self.play(Write(right_calc))
        self.wait(0.3)

        # Result
        complement_result = 1 - cumulative_2
        right_result = MathTex(
            f"= {complement_result:.3f}",
            font_size=28,
            color=FINAL_ANSWER_COLOR
        )
        right_result.move_to(RIGHT * 3.5 + DOWN * 1.9)
        self.play(Write(right_result))
        self.wait(0.5)

        # General formula
        right_general = MathTex(
            r"P(X \geq k) = 1 - P(X \leq k-1)",
            font_size=20
        )
        right_general.move_to(RIGHT * 3.5 + DOWN * 2.6)
        right_general_box = SurroundingRectangle(right_general, color=COMPLEMENT_COLOR, buff=0.1)
        self.play(Write(right_general), Create(right_general_box))
        self.wait(0.5)

        # =====================
        # PART 6: Key Insight Callout
        # =====================

        # Highlight the complement trick
        trick_text = Text(
            'For "at least", use 1 minus',
            font_size=24,
            color=YELLOW
        )
        trick_text.to_edge(DOWN, buff=0.5)
        trick_box = SurroundingRectangle(trick_text, color=YELLOW, buff=0.15, corner_radius=0.1)

        self.play(Write(trick_text), Create(trick_box))
        self.wait(0.5)

        # Pulse effect
        self.play(
            trick_box.animate.set_stroke(width=6),
            rate_func=there_and_back,
            run_time=0.6
        )
        self.wait(1)

        # =====================
        # PART 7: Final Summary
        # =====================

        # Clear the middle and prepare for summary
        self.play(
            FadeOut(trick_text),
            FadeOut(trick_box),
            FadeOut(left_question),
            FadeOut(left_formula),
            FadeOut(left_calc),
            FadeOut(left_result),
            FadeOut(right_question),
            FadeOut(right_formula),
            FadeOut(right_calc),
            FadeOut(right_result),
        )

        # Verification: show both answers sum to 1
        verify_text = Text("Verification: Probabilities must sum to 1", font_size=20)
        verify_text.move_to(DOWN * 0.4)
        self.play(Write(verify_text))

        verify_calc = MathTex(
            f"P(X \\leq 2) + P(X \\geq 3) = {cumulative_2:.3f} + {complement_result:.3f} = 1.000",
            font_size=22,
            color=FINAL_ANSWER_COLOR
        )
        verify_calc.move_to(DOWN * 0.9)
        self.play(Write(verify_calc))

        # Checkmark
        check = MathTex(r"\checkmark", font_size=36, color=FINAL_ANSWER_COLOR)
        check.next_to(verify_calc, RIGHT, buff=0.3)
        self.play(Write(check))
        self.wait(1)

        # Final summary box
        summary = VGroup(
            MathTex(r"\text{Direct Sum: } P(X \leq k) = \sum_{i=0}^{k} P(i)", font_size=22, color=DIRECT_SUM_COLOR),
            MathTex(r"\text{Complement: } P(X \geq k) = 1 - P(X < k)", font_size=22, color=COMPLEMENT_COLOR),
        ).arrange(DOWN, buff=0.2)
        summary.move_to(DOWN * 2)

        summary_box = SurroundingRectangle(summary, color=WHITE, buff=0.2, corner_radius=0.1)

        self.play(Write(summary), Create(summary_box))
        self.wait(2)


class CumulativeProbabilitySummingQuick(Scene):
    """Quick reference version - shorter summary for review."""
    def construct(self):
        # Parameters
        n = 5
        p = 0.4
        probs = [binomial_prob(n, k, p) for k in range(n + 1)]

        # Title
        title = Text("Cumulative Probability: Two Methods", font_size=36)
        title.to_edge(UP)
        self.play(Write(title))

        # Setup
        setup = MathTex(r"n = 5, \, p = 0.4", font_size=28)
        setup.next_to(title, DOWN, buff=0.3)
        self.play(Write(setup))

        # Side by side formulas
        left_col = VGroup(
            Text("Direct Sum", font_size=24, color=BLUE),
            MathTex(r"P(X \leq 2)", font_size=28),
            MathTex(r"= P(0) + P(1) + P(2)", font_size=22),
            MathTex(f"= {sum(probs[:3]):.3f}", font_size=28, color=GREEN)
        ).arrange(DOWN, buff=0.3)
        left_col.shift(LEFT * 3.5 + DOWN * 0.5)

        right_col = VGroup(
            Text("Complement", font_size=24, color=RED),
            MathTex(r"P(X \geq 3)", font_size=28),
            MathTex(r"= 1 - P(X \leq 2)", font_size=22),
            MathTex(f"= {1 - sum(probs[:3]):.3f}", font_size=28, color=GREEN)
        ).arrange(DOWN, buff=0.3)
        right_col.shift(RIGHT * 3.5 + DOWN * 0.5)

        self.play(Write(left_col), Write(right_col))
        self.wait(1)

        # Key insight
        insight = Text(
            'Tip: For "at least k", use 1 - P(X < k)',
            font_size=22,
            color=YELLOW
        )
        insight.to_edge(DOWN, buff=0.5)
        box = SurroundingRectangle(insight, color=YELLOW, buff=0.15)

        self.play(Write(insight), Create(box))
        self.wait(2)

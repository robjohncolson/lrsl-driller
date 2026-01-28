"""
Simulation Step 3: Relative Frequency

This animation demonstrates how to calculate estimated probability from simulation results.

Render command:
manim -qm --format=mp4 l09_relative_frequency.py RelativeFrequency
"""

from manim import *

class RelativeFrequency(Scene):
    def construct(self):
        # Title
        title = Text("Simulation Step 3: Calculate Probability", font_size=36)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Show simulation results
        results_text = Text("Simulation Results:", font_size=28, color=BLUE)
        results_text.next_to(title, DOWN, buff=0.7)
        self.play(FadeIn(results_text))

        # Show tally building up
        trials_label = Text("Total Trials:", font_size=24)
        trials_label.shift(LEFT * 3 + UP * 0.5)

        successes_label = Text("Successes:", font_size=24)
        successes_label.next_to(trials_label, DOWN, buff=0.3)

        trials_count = Integer(0, font_size=24, color=YELLOW)
        trials_count.next_to(trials_label, RIGHT, buff=0.3)

        successes_count = Integer(0, font_size=24, color=GREEN)
        successes_count.next_to(successes_label, RIGHT, buff=0.3)

        self.play(
            FadeIn(trials_label),
            FadeIn(successes_label),
            FadeIn(trials_count),
            FadeIn(successes_count)
        )

        # Animate counting up
        self.play(
            trials_count.animate.set_value(50),
            run_time=1.5,
            rate_func=linear
        )
        self.play(
            successes_count.animate.set_value(16),
            run_time=1.5,
            rate_func=linear
        )
        self.wait(0.5)

        # Build the formula
        formula_title = Text("Formula:", font_size=26, color=BLUE)
        formula_title.shift(DOWN * 0.5 + LEFT * 4)
        self.play(Write(formula_title))

        # P ≈ successes/total
        formula = MathTex(
            r"P", r"\approx", r"\frac{\text{Successes}}{\text{Total Trials}}",
            font_size=40
        )
        formula.next_to(formula_title, RIGHT, buff=0.4)
        formula[0].set_color(ORANGE)
        formula[2].set_color(WHITE)

        self.play(Write(formula))
        self.wait(0.5)

        # Substitute values
        substitution = MathTex(
            r"P", r"\approx", r"\frac{16}{50}",
            font_size=40
        )
        substitution.next_to(formula, DOWN, buff=0.5)
        substitution[0].set_color(ORANGE)
        substitution[2][0:2].set_color(GREEN)  # 16
        substitution[2][3:5].set_color(YELLOW)  # 50

        self.play(Write(substitution))
        self.wait(0.5)

        # Calculate decimal
        decimal_result = MathTex(
            r"P", r"\approx", r"0.32",
            font_size=40
        )
        decimal_result.next_to(substitution, DOWN, buff=0.5)
        decimal_result[0].set_color(ORANGE)
        decimal_result[2].set_color(ORANGE)

        self.play(Write(decimal_result))
        self.wait(0.5)

        # Convert to percent
        percent_result = MathTex(
            r"P", r"\approx", r"32\%",
            font_size=40
        )
        percent_result.next_to(decimal_result, DOWN, buff=0.5)
        percent_result[0].set_color(ORANGE)
        percent_result[2].set_color(ORANGE)

        # Draw box around final answer
        percent_box = SurroundingRectangle(percent_result, color=ORANGE, buff=0.2)

        self.play(Write(percent_result))
        self.play(Create(percent_box))
        self.wait(0.5)

        # Fade out everything except title for key insight
        fade_group = VGroup(
            results_text, trials_label, successes_label,
            trials_count, successes_count, formula_title,
            formula, substitution, decimal_result,
            percent_result, percent_box
        )
        self.play(FadeOut(fade_group))

        # Key insight
        insight_title = Text("Key Insight:", font_size=30, color=BLUE)
        insight_title.shift(UP * 1)

        insight_text1 = Text("More trials →", font_size=26)
        insight_text2 = Text("better estimate", font_size=26, color=GREEN)

        insight_group = VGroup(insight_text1, insight_text2)
        insight_group.arrange(RIGHT, buff=0.3)
        insight_group.next_to(insight_title, DOWN, buff=0.5)

        law_text = Text("(Law of Large Numbers)", font_size=22, color=GRAY)
        law_text.next_to(insight_group, DOWN, buff=0.4)

        self.play(Write(insight_title))
        self.play(Write(insight_text1))
        self.play(Write(insight_text2))
        self.play(FadeIn(law_text))
        self.wait(1.5)

        # Fade out
        self.play(
            FadeOut(title),
            FadeOut(insight_title),
            FadeOut(insight_group),
            FadeOut(law_text)
        )
        self.wait(0.5)

"""
Valid Probability Distribution Animation

Demonstrates the two conditions required for a valid probability distribution:
1. Each P(X) must be between 0 and 1 (inclusive)
2. All probabilities must sum to exactly 1

Run with:
manim -qm --format=mp4 l35_valid_prob_dist.py ValidProbDistribution
"""

from manim import *

class ValidProbDistribution(Scene):
    def construct(self):
        # Title
        title = Text("Valid Probability Distribution", font_size=48, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Create probability table (valid example)
        table_data = [
            ["X", "0", "1", "2", "3"],
            ["P(X)", "0.1", "0.3", "0.4", "0.2"]
        ]

        table = Table(
            table_data,
            include_outer_lines=True,
            line_config={"stroke_width": 2, "color": WHITE}
        ).scale(0.6)
        table.shift(UP * 1.5)

        self.play(Create(table))
        self.wait(0.5)

        # Check 1: Are all P(X) between 0 and 1?
        check1_text = Text("Check 1: 0 ≤ P(X) ≤ 1?", font_size=32)
        check1_text.next_to(table, DOWN, buff=0.5)
        self.play(Write(check1_text))

        # Highlight probability values
        prob_cells = [table.get_cell((2, i+2)) for i in range(4)]
        for cell in prob_cells:
            self.play(
                cell.animate.set_fill(GREEN, opacity=0.3),
                run_time=0.2
            )

        check1_result = Text("✓ All between 0 and 1", font_size=28, color=GREEN)
        check1_result.next_to(check1_text, RIGHT, buff=0.5)
        self.play(Write(check1_result))
        self.wait(0.5)

        # Check 2: Does ΣP(X) = 1?
        check2_text = Text("Check 2: ΣP(X) = 1?", font_size=32)
        check2_text.next_to(check1_text, DOWN, buff=0.3)
        self.play(Write(check2_text))

        # Show sum calculation
        sum_calc = MathTex("0.1 + 0.3 + 0.4 + 0.2", font_size=36)
        sum_calc.next_to(check2_text, DOWN, buff=0.3)
        self.play(Write(sum_calc))
        self.wait(0.3)

        sum_result = MathTex("= 1.0", font_size=36, color=GREEN)
        sum_result.next_to(sum_calc, RIGHT, buff=0.2)
        self.play(Write(sum_result))

        check2_result = Text("✓ Sums to 1", font_size=28, color=GREEN)
        check2_result.next_to(check2_text, RIGHT, buff=0.5)
        self.play(Write(check2_result))
        self.wait(0.5)

        # Valid stamp
        valid_stamp = Text("VALID", font_size=48, color=GREEN, weight=BOLD)
        valid_stamp.next_to(table, RIGHT, buff=0.8)
        self.play(FadeIn(valid_stamp, scale=1.5))
        self.wait(0.5)

        # Clear for invalid example
        self.play(
            FadeOut(check1_text),
            FadeOut(check1_result),
            FadeOut(check2_text),
            FadeOut(check2_result),
            FadeOut(sum_calc),
            FadeOut(sum_result),
            FadeOut(valid_stamp),
            FadeOut(table)
        )
        self.wait(0.3)

        # Invalid example - sums to 1.1
        invalid_label = Text("Invalid Example:", font_size=32, color=RED)
        invalid_label.move_to(UP * 2.5)
        self.play(Write(invalid_label))

        invalid_table_data = [
            ["X", "0", "1", "2", "3"],
            ["P(X)", "0.2", "0.3", "0.4", "0.2"]
        ]

        invalid_table = Table(
            invalid_table_data,
            include_outer_lines=True,
            line_config={"stroke_width": 2, "color": WHITE}
        ).scale(0.6)
        invalid_table.shift(UP * 1.3)

        self.play(Create(invalid_table))
        self.wait(0.3)

        # Check sum for invalid example
        invalid_check = Text("Check: ΣP(X) = ?", font_size=32)
        invalid_check.next_to(invalid_table, DOWN, buff=0.5)
        self.play(Write(invalid_check))

        invalid_sum_calc = MathTex("0.2 + 0.3 + 0.4 + 0.2", font_size=36)
        invalid_sum_calc.next_to(invalid_check, DOWN, buff=0.3)
        self.play(Write(invalid_sum_calc))
        self.wait(0.3)

        invalid_sum_result = MathTex("= 1.1", font_size=36, color=RED)
        invalid_sum_result.next_to(invalid_sum_calc, RIGHT, buff=0.2)
        self.play(Write(invalid_sum_result))

        invalid_x = Text("✗ Does not sum to 1", font_size=28, color=RED)
        invalid_x.next_to(invalid_sum_calc, DOWN, buff=0.3)
        self.play(Write(invalid_x))

        # Invalid stamp
        invalid_stamp = Text("INVALID", font_size=48, color=RED, weight=BOLD)
        invalid_stamp.next_to(invalid_table, RIGHT, buff=0.8)
        self.play(FadeIn(invalid_stamp, scale=1.5))
        self.wait(0.5)

        # Clear everything except title
        self.play(
            FadeOut(invalid_label),
            FadeOut(invalid_table),
            FadeOut(invalid_check),
            FadeOut(invalid_sum_calc),
            FadeOut(invalid_sum_result),
            FadeOut(invalid_x),
            FadeOut(invalid_stamp)
        )
        self.wait(0.3)

        # Key insight
        key_insight = VGroup(
            Text("Check BOTH conditions:", font_size=40, weight=BOLD, color=YELLOW),
            Text("1. 0 ≤ P(X) ≤ 1", font_size=32),
            Text("2. ΣP(X) = 1", font_size=32)
        ).arrange(DOWN, buff=0.4)
        key_insight.move_to(ORIGIN)

        self.play(FadeIn(key_insight, shift=UP))
        self.wait(1.5)

        # Fade out
        self.play(FadeOut(title), FadeOut(key_insight))
        self.wait(0.3)

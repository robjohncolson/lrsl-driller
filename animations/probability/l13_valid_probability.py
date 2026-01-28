"""
Valid Probability Model Animation

Demonstrates the two conditions that must be satisfied for a valid probability distribution:
1. Each probability is between 0 and 1 (inclusive)
2. All probabilities sum to exactly 1

Render with:
manim -qm --format=mp4 l13_valid_probability.py ValidProbabilityModel
"""

from manim import *

class ValidProbabilityModel(Scene):
    def construct(self):
        # Title
        title = Text("Valid Probability Model", font_size=48, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Two conditions with checkboxes
        conditions_title = Text("A valid probability model must satisfy:", font_size=32)
        conditions_title.next_to(title, DOWN, buff=0.5)

        condition1 = Text("1. Each probability: 0 ≤ P(x) ≤ 1", font_size=28)
        condition2 = Text("2. Sum of all probabilities = 1", font_size=28)

        conditions = VGroup(condition1, condition2).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        conditions.next_to(conditions_title, DOWN, buff=0.4)

        self.play(Write(conditions_title))
        self.play(Write(condition1))
        self.play(Write(condition2))
        self.wait(0.5)

        # Move conditions to top
        all_top = VGroup(title, conditions_title, conditions)
        self.play(all_top.animate.scale(0.7).to_edge(UP, buff=0.2))
        self.wait(0.3)

        # Example 1: VALID
        example1_title = Text("Example 1:", font_size=32, color=YELLOW)
        example1_title.to_edge(LEFT, buff=0.5).shift(UP*0.5)

        probs1 = VGroup(
            Text("P(1) = 0.2", font_size=28),
            Text("P(2) = 0.3", font_size=28),
            Text("P(3) = 0.5", font_size=28)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        probs1.next_to(example1_title, DOWN, buff=0.3, aligned_edge=LEFT)

        self.play(Write(example1_title), Write(probs1))
        self.wait(0.3)

        # Check condition 2: Sum
        sum_check1 = Text("Sum: 0.2 + 0.3 + 0.5 = 1.0 ✓", font_size=26, color=GREEN)
        sum_check1.next_to(probs1, DOWN, buff=0.3, aligned_edge=LEFT)

        # Check condition 1: Range
        range_check1 = Text("All between 0 and 1 ✓", font_size=26, color=GREEN)
        range_check1.next_to(sum_check1, DOWN, buff=0.2, aligned_edge=LEFT)

        self.play(Write(sum_check1))
        self.play(Write(range_check1))

        # VALID stamp
        valid_stamp = Text("VALID", font_size=40, color=GREEN, weight=BOLD)
        valid_stamp.next_to(range_check1, DOWN, buff=0.3, aligned_edge=LEFT)
        self.play(FadeIn(valid_stamp, scale=1.5))
        self.wait(0.5)

        # Clear Example 1
        self.play(FadeOut(VGroup(example1_title, probs1, sum_check1, range_check1, valid_stamp)))
        self.wait(0.2)

        # Example 2: INVALID (Sum > 1)
        example2_title = Text("Example 2:", font_size=32, color=YELLOW)
        example2_title.to_edge(LEFT, buff=0.5).shift(UP*0.5)

        probs2 = VGroup(
            Text("P(1) = 0.4", font_size=28),
            Text("P(2) = 0.4", font_size=28),
            Text("P(3) = 0.4", font_size=28)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        probs2.next_to(example2_title, DOWN, buff=0.3, aligned_edge=LEFT)

        self.play(Write(example2_title), Write(probs2))
        self.wait(0.3)

        # Check condition 2: Sum FAILS
        sum_check2 = Text("Sum: 0.4 + 0.4 + 0.4 = 1.2 ✗", font_size=26, color=RED)
        sum_check2.next_to(probs2, DOWN, buff=0.3, aligned_edge=LEFT)

        # Check condition 1: Range OK
        range_check2 = Text("All between 0 and 1 ✓", font_size=26, color=GREEN)
        range_check2.next_to(sum_check2, DOWN, buff=0.2, aligned_edge=LEFT)

        self.play(Write(sum_check2))
        self.play(Write(range_check2))

        # INVALID stamp
        invalid_stamp2 = Text("INVALID", font_size=40, color=RED, weight=BOLD)
        invalid_stamp2.next_to(range_check2, DOWN, buff=0.3, aligned_edge=LEFT)
        self.play(FadeIn(invalid_stamp2, scale=1.5))
        self.wait(0.5)

        # Clear Example 2
        self.play(FadeOut(VGroup(example2_title, probs2, sum_check2, range_check2, invalid_stamp2)))
        self.wait(0.2)

        # Example 3: INVALID (Negative probability)
        example3_title = Text("Example 3:", font_size=32, color=YELLOW)
        example3_title.to_edge(LEFT, buff=0.5).shift(UP*0.5)

        probs3 = VGroup(
            Text("P(1) = -0.1", font_size=28, color=RED),
            Text("P(2) = 0.6", font_size=28),
            Text("P(3) = 0.5", font_size=28)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        probs3.next_to(example3_title, DOWN, buff=0.3, aligned_edge=LEFT)

        self.play(Write(example3_title), Write(probs3))
        self.wait(0.3)

        # Check condition 1: Range FAILS
        range_check3 = Text("Negative probability! ✗", font_size=26, color=RED)
        range_check3.next_to(probs3, DOWN, buff=0.3, aligned_edge=LEFT)

        # Check condition 2: Sum OK
        sum_check3 = Text("Sum: -0.1 + 0.6 + 0.5 = 1.0 ✓", font_size=26, color=GREEN)
        sum_check3.next_to(range_check3, DOWN, buff=0.2, aligned_edge=LEFT)

        self.play(Write(range_check3))
        self.play(Write(sum_check3))

        # INVALID stamp
        invalid_stamp3 = Text("INVALID", font_size=40, color=RED, weight=BOLD)
        invalid_stamp3.next_to(sum_check3, DOWN, buff=0.3, aligned_edge=LEFT)
        self.play(FadeIn(invalid_stamp3, scale=1.5))
        self.wait(0.5)

        # Clear Example 3
        self.play(FadeOut(VGroup(example3_title, probs3, range_check3, sum_check3, invalid_stamp3)))
        self.wait(0.2)

        # Key insight
        insight_box = Rectangle(width=10, height=2, color=BLUE, fill_opacity=0.2, stroke_width=3)
        insight_text = Text("Check BOTH conditions!", font_size=40, color=BLUE, weight=BOLD)
        insight_group = VGroup(insight_box, insight_text)
        insight_text.move_to(insight_box.get_center())

        self.play(FadeIn(insight_box), Write(insight_text))
        self.wait(1.5)

        # Fade out everything
        self.play(FadeOut(Group(*self.mobjects)))
        self.wait(0.3)

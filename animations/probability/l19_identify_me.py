"""
Manim animation for Identifying Mutually Exclusive Events (l19).

Render with:
    manim -qm --format=mp4 l19_identify_me.py IdentifyMutuallyExclusive

Concept:
    - Check if events are mutually exclusive by examining P(A ∩ B)
    - If P(A ∩ B) = 0 → Events ARE mutually exclusive
    - If P(A ∩ B) > 0 → Events are NOT mutually exclusive
    - Zero intersection means events cannot occur together
"""

from manim import *

class IdentifyMutuallyExclusive(Scene):
    def construct(self):
        # Title
        title = Text("Identifying Mutually Exclusive Events", font_size=40, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Decision flowchart
        # Start box
        start_box = RoundedRectangle(
            width=3.5, height=0.8, corner_radius=0.1,
            fill_color=BLUE_D, fill_opacity=0.3, stroke_color=BLUE
        )
        start_text = MathTex(r"\text{Find } P(A \cap B)", font_size=32)
        start = VGroup(start_box, start_text).shift(UP * 1.5)

        self.play(Create(start_box), Write(start_text))
        self.wait(0.3)

        # Decision arrows
        left_arrow = Arrow(start.get_bottom(), LEFT * 2.5 + DOWN * 0.3, buff=0.1, stroke_width=4)
        right_arrow = Arrow(start.get_bottom(), RIGHT * 2.5 + DOWN * 0.3, buff=0.1, stroke_width=4)

        # Left path: P(A ∩ B) = 0
        left_condition = MathTex(r"P(A \cap B) = 0", font_size=28, color=GREEN)
        left_condition.next_to(left_arrow, LEFT, buff=0.2).shift(UP * 0.3)

        left_box = RoundedRectangle(
            width=3.2, height=1.2, corner_radius=0.1,
            fill_color=GREEN_D, fill_opacity=0.4, stroke_color=GREEN, stroke_width=4
        )
        left_result = VGroup(
            Text("Mutually", font_size=28, color=GREEN),
            Text("Exclusive!", font_size=28, weight=BOLD, color=GREEN)
        ).arrange(DOWN, buff=0.1)
        left_check = Text("✓", font_size=48, color=GREEN, weight=BOLD)
        left_check.next_to(left_result, RIGHT, buff=0.3)
        left_content = VGroup(left_result, left_check)
        left_outcome = VGroup(left_box, left_content).shift(LEFT * 2.5 + DOWN * 1.5)
        left_content.move_to(left_box.get_center())

        # Right path: P(A ∩ B) > 0
        right_condition = MathTex(r"P(A \cap B) > 0", font_size=28, color=RED)
        right_condition.next_to(right_arrow, RIGHT, buff=0.2).shift(UP * 0.3)

        right_box = RoundedRectangle(
            width=3.2, height=1.2, corner_radius=0.1,
            fill_color=RED_D, fill_opacity=0.4, stroke_color=RED, stroke_width=4
        )
        right_result = VGroup(
            Text("NOT", font_size=28, color=RED, weight=BOLD),
            Text("Mutually Exclusive", font_size=24, color=RED)
        ).arrange(DOWN, buff=0.1)
        right_x = Text("✗", font_size=48, color=RED, weight=BOLD)
        right_x.next_to(right_result, RIGHT, buff=0.3)
        right_content = VGroup(right_result, right_x)
        right_outcome = VGroup(right_box, right_content).shift(RIGHT * 2.5 + DOWN * 1.5)
        right_content.move_to(right_box.get_center())

        # Animate flowchart
        self.play(
            GrowArrow(left_arrow),
            GrowArrow(right_arrow),
            Write(left_condition),
            Write(right_condition)
        )
        self.wait(0.3)

        self.play(
            Create(left_box),
            Create(right_box),
            Write(left_content),
            Write(right_content)
        )
        self.wait(1)

        # Clear for examples
        self.play(
            FadeOut(start, left_arrow, right_arrow, left_condition, right_condition,
                   left_outcome, right_outcome)
        )

        # Example 1: P(A ∩ B) = 0
        ex1_title = Text("Example 1:", font_size=32, weight=BOLD, color=YELLOW)
        ex1_title.next_to(title, DOWN, buff=0.5).shift(LEFT * 3)

        ex1_prob = MathTex(r"P(A \cap B) = 0", font_size=36)
        ex1_prob.next_to(ex1_title, DOWN, buff=0.4, aligned_edge=LEFT)

        ex1_arrow = Arrow(ORIGIN, DOWN * 0.6, buff=0.1, color=GREEN, stroke_width=5)
        ex1_arrow.next_to(ex1_prob, DOWN, buff=0.2)

        ex1_result_box = RoundedRectangle(
            width=2.8, height=0.8, corner_radius=0.1,
            fill_color=GREEN_D, fill_opacity=0.5, stroke_color=GREEN, stroke_width=3
        )
        ex1_result_text = Text("ME ✓", font_size=32, color=GREEN, weight=BOLD)
        ex1_result = VGroup(ex1_result_box, ex1_result_text)
        ex1_result.next_to(ex1_arrow, DOWN, buff=0.2)
        ex1_result_text.move_to(ex1_result_box.get_center())

        example1 = VGroup(ex1_title, ex1_prob, ex1_arrow, ex1_result)

        self.play(Write(ex1_title))
        self.play(Write(ex1_prob))
        self.wait(0.3)
        self.play(GrowArrow(ex1_arrow))
        self.play(Create(ex1_result_box), Write(ex1_result_text))
        self.wait(0.8)

        # Example 2: P(A ∩ B) = 0.15
        ex2_title = Text("Example 2:", font_size=32, weight=BOLD, color=YELLOW)
        ex2_title.next_to(title, DOWN, buff=0.5).shift(RIGHT * 2.8)

        ex2_prob = MathTex(r"P(A \cap B) = 0.15", font_size=36)
        ex2_prob.next_to(ex2_title, DOWN, buff=0.4, aligned_edge=LEFT)

        ex2_arrow = Arrow(ORIGIN, DOWN * 0.6, buff=0.1, color=RED, stroke_width=5)
        ex2_arrow.next_to(ex2_prob, DOWN, buff=0.2)

        ex2_result_box = RoundedRectangle(
            width=3.2, height=0.8, corner_radius=0.1,
            fill_color=RED_D, fill_opacity=0.5, stroke_color=RED, stroke_width=3
        )
        ex2_result_text = Text("NOT ME ✗", font_size=32, color=RED, weight=BOLD)
        ex2_result = VGroup(ex2_result_box, ex2_result_text)
        ex2_result.next_to(ex2_arrow, DOWN, buff=0.2)
        ex2_result_text.move_to(ex2_result_box.get_center())

        example2 = VGroup(ex2_title, ex2_prob, ex2_arrow, ex2_result)

        self.play(Write(ex2_title))
        self.play(Write(ex2_prob))
        self.wait(0.3)
        self.play(GrowArrow(ex2_arrow))
        self.play(Create(ex2_result_box), Write(ex2_result_text))
        self.wait(0.8)

        # Key insight
        self.play(FadeOut(example1, example2))

        insight_box = RoundedRectangle(
            width=11, height=1.8, corner_radius=0.15,
            fill_color=BLUE_D, fill_opacity=0.3, stroke_color=BLUE_B, stroke_width=3
        )
        insight_box.shift(DOWN * 0.5)

        insight_title = Text("Key Insight:", font_size=32, weight=BOLD, color=BLUE_B)
        insight_title.next_to(insight_box.get_top(), DOWN, buff=0.3)

        insight_text = VGroup(
            Text("Zero intersection = cannot happen together", font_size=28),
            MathTex(r"P(A \cap B) = 0 \Rightarrow \text{ Events are mutually exclusive}", font_size=28)
        ).arrange(DOWN, buff=0.25)
        insight_text.next_to(insight_title, DOWN, buff=0.25)

        self.play(Create(insight_box))
        self.play(Write(insight_title))
        self.play(Write(insight_text))
        self.wait(2)

        # Fade out
        self.play(
            FadeOut(title, insight_box, insight_title, insight_text)
        )
        self.wait(0.5)

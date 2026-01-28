"""
Independent vs Mutually Exclusive (Conceptual Inversion)
AP Statistics: The most commonly confused probability concepts.

- INDEPENDENT: Two events that CAN happen together, P(A|B) = P(A)
- MUTUALLY EXCLUSIVE: Two events that CANNOT happen together, P(A and B) = 0

KEY INSIGHT: These are OPPOSITE concepts!

Run with: manim -qm --format=mp4 independent_vs_mutually_exclusive.py IndependentVsMutuallyExclusive
"""
from manim import *


class IndependentVsMutuallyExclusive(Scene):
    def construct(self):
        # Color scheme
        EVENT_A_COLOR = BLUE
        EVENT_B_COLOR = RED
        INTERSECTION_COLOR = PURPLE

        # Title
        title = Text("Independent vs Mutually Exclusive", font_size=40)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # Subtitle - the common mistake
        subtitle = Text("The Most Confused Probability Concepts!", font_size=24, color=YELLOW)
        subtitle.next_to(title, DOWN, buff=0.2)
        self.play(FadeIn(subtitle))
        self.wait(1)
        self.play(FadeOut(subtitle))

        # Create dividing line
        divider = DashedLine(
            start=UP * 2.5,
            end=DOWN * 3.5,
            color=WHITE,
            dash_length=0.1
        )
        self.play(Create(divider))

        # Section labels
        indep_label = Text("INDEPENDENT", font_size=28, color=GREEN)
        indep_label.move_to(LEFT * 3.5 + UP * 2)

        mutex_label = Text("MUTUALLY EXCLUSIVE", font_size=24, color=ORANGE)
        mutex_label.move_to(RIGHT * 3.5 + UP * 2)

        self.play(Write(indep_label), Write(mutex_label))
        self.wait(0.5)

        # =====================
        # LEFT SIDE: INDEPENDENT EVENTS
        # =====================

        # Create overlapping circles for independent events
        indep_circle_a = Circle(radius=1.0, color=EVENT_A_COLOR, fill_opacity=0.4, stroke_width=3)
        indep_circle_a.move_to(LEFT * 4.2 + DOWN * 0.3)

        indep_circle_b = Circle(radius=1.0, color=EVENT_B_COLOR, fill_opacity=0.4, stroke_width=3)
        indep_circle_b.move_to(LEFT * 2.8 + DOWN * 0.3)

        # Labels for circles
        indep_a_label = Text("A", font_size=24, color=EVENT_A_COLOR)
        indep_a_label.move_to(LEFT * 4.8 + DOWN * 0.3)

        indep_b_label = Text("B", font_size=24, color=EVENT_B_COLOR)
        indep_b_label.move_to(LEFT * 2.2 + DOWN * 0.3)

        # Create intersection highlight
        indep_intersection = Intersection(
            indep_circle_a, indep_circle_b,
            color=INTERSECTION_COLOR,
            fill_opacity=0.7,
            stroke_width=0
        )

        self.play(
            Create(indep_circle_a),
            Write(indep_a_label),
            run_time=1
        )
        self.play(
            Create(indep_circle_b),
            Write(indep_b_label),
            run_time=1
        )

        # Highlight the intersection
        self.play(FadeIn(indep_intersection))

        # Arrow pointing to intersection
        indep_arrow = Arrow(
            LEFT * 3.5 + UP * 0.8,
            LEFT * 3.5 + DOWN * 0.1,
            color=YELLOW,
            stroke_width=3
        )
        indep_arrow_label = Text("CAN happen\ntogether!", font_size=16, color=YELLOW)
        indep_arrow_label.next_to(indep_arrow, UP, buff=0.05)

        self.play(GrowArrow(indep_arrow), Write(indep_arrow_label))
        self.wait(0.5)

        # Example for independent
        indep_example = VGroup(
            Text("Example:", font_size=16, color=WHITE),
            Text("Roll 6 AND Flip Heads", font_size=14, color=GREEN)
        ).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        indep_example.move_to(LEFT * 3.5 + DOWN * 1.8)

        self.play(Write(indep_example))
        self.wait(0.5)

        # Formula for independent
        indep_formula = MathTex(
            r"P(A \cap B) = P(A) \times P(B)",
            font_size=28
        )
        indep_formula.move_to(LEFT * 3.5 + DOWN * 2.6)
        indep_neq_zero = MathTex(r"\neq 0", font_size=28, color=GREEN)
        indep_neq_zero.next_to(indep_formula, RIGHT, buff=0.1)

        self.play(Write(indep_formula), Write(indep_neq_zero))
        self.wait(1)

        # =====================
        # RIGHT SIDE: MUTUALLY EXCLUSIVE EVENTS
        # =====================

        # Create separate circles for mutually exclusive events
        mutex_circle_a = Circle(radius=1.0, color=EVENT_A_COLOR, fill_opacity=0.4, stroke_width=3)
        mutex_circle_a.move_to(RIGHT * 2.3 + DOWN * 0.3)

        mutex_circle_b = Circle(radius=1.0, color=EVENT_B_COLOR, fill_opacity=0.4, stroke_width=3)
        mutex_circle_b.move_to(RIGHT * 4.7 + DOWN * 0.3)

        # Labels for circles
        mutex_a_label = Text("A", font_size=24, color=EVENT_A_COLOR)
        mutex_a_label.move_to(RIGHT * 2.3 + DOWN * 0.3)

        mutex_b_label = Text("B", font_size=24, color=EVENT_B_COLOR)
        mutex_b_label.move_to(RIGHT * 4.7 + DOWN * 0.3)

        self.play(
            Create(mutex_circle_a),
            Write(mutex_a_label),
            run_time=1
        )
        self.play(
            Create(mutex_circle_b),
            Write(mutex_b_label),
            run_time=1
        )

        # Show the gap between circles
        mutex_gap_arrow = DoubleArrow(
            mutex_circle_a.get_right() + RIGHT * 0.1,
            mutex_circle_b.get_left() + LEFT * 0.1,
            color=ORANGE,
            stroke_width=3,
            buff=0
        )
        mutex_gap_label = Text("CANNOT\noverlap!", font_size=16, color=ORANGE)
        mutex_gap_label.next_to(mutex_gap_arrow, UP, buff=0.1)

        self.play(GrowArrow(mutex_gap_arrow), Write(mutex_gap_label))
        self.wait(0.5)

        # Example for mutually exclusive
        mutex_example = VGroup(
            Text("Example:", font_size=16, color=WHITE),
            Text("Roll Even AND Roll Odd", font_size=14, color=ORANGE)
        ).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        mutex_example.move_to(RIGHT * 3.5 + DOWN * 1.8)

        self.play(Write(mutex_example))
        self.wait(0.5)

        # Formula for mutually exclusive
        mutex_formula = MathTex(
            r"P(A \cap B) = 0",
            font_size=28,
            color=ORANGE
        )
        mutex_formula.move_to(RIGHT * 3.5 + DOWN * 2.6)

        self.play(Write(mutex_formula))
        self.wait(1.5)

        # =====================
        # KEY INSIGHT - THE CONTRADICTION
        # =====================

        # Fade out formulas and examples temporarily
        left_group = VGroup(indep_example, indep_formula, indep_neq_zero)
        right_group = VGroup(mutex_example, mutex_formula)

        self.play(
            FadeOut(left_group),
            FadeOut(right_group),
            FadeOut(indep_arrow),
            FadeOut(indep_arrow_label),
            FadeOut(mutex_gap_arrow),
            FadeOut(mutex_gap_label)
        )

        # Big reveal - these are OPPOSITES
        opposite_text = Text(
            "These are OPPOSITE concepts!",
            font_size=32,
            color=YELLOW
        )
        opposite_text.move_to(DOWN * 1.8)
        opposite_box = SurroundingRectangle(opposite_text, color=YELLOW, buff=0.2, stroke_width=3)

        self.play(Write(opposite_text), Create(opposite_box))
        self.wait(0.5)

        # Pulse effect
        self.play(
            opposite_box.animate.set_stroke(width=6),
            rate_func=there_and_back,
            run_time=0.6
        )
        self.wait(1)

        # Show the key insight explanations
        insight_left = VGroup(
            Text("Independent:", font_size=18, color=GREEN),
            Text("Knowing A occurred", font_size=16),
            Text("doesn't change P(B)", font_size=16, color=GREEN)
        ).arrange(DOWN, buff=0.1)
        insight_left.move_to(LEFT * 3.5 + DOWN * 2.8)

        insight_right = VGroup(
            Text("Mutually Exclusive:", font_size=18, color=ORANGE),
            Text("If A occurred,", font_size=16),
            Text("then P(B) = 0!", font_size=16, color=ORANGE)
        ).arrange(DOWN, buff=0.1)
        insight_right.move_to(RIGHT * 3.5 + DOWN * 2.8)

        self.play(Write(insight_left), Write(insight_right))
        self.wait(2)

        # =====================
        # COMMON MISCONCEPTION CALLOUT
        # =====================

        self.play(
            FadeOut(opposite_text),
            FadeOut(opposite_box),
            FadeOut(insight_left),
            FadeOut(insight_right)
        )

        # The misconception
        misconception_title = Text("Common Mistake Students Make:", font_size=24, color=RED)
        misconception_title.move_to(DOWN * 1.6)

        misconception_text = Text(
            '"Mutually exclusive events are independent"',
            font_size=20,
            color=RED,
            slant=ITALIC
        )
        misconception_text.next_to(misconception_title, DOWN, buff=0.2)

        # X mark
        x_mark = VGroup(
            Line(LEFT * 0.3 + UP * 0.3, RIGHT * 0.3 + DOWN * 0.3, color=RED, stroke_width=6),
            Line(LEFT * 0.3 + DOWN * 0.3, RIGHT * 0.3 + UP * 0.3, color=RED, stroke_width=6)
        )
        x_mark.next_to(misconception_text, RIGHT, buff=0.3)

        self.play(Write(misconception_title))
        self.play(Write(misconception_text), Create(x_mark))
        self.wait(1)

        # Correct understanding
        correct_text = Text(
            "WRONG! If events are mutually exclusive (and both possible),",
            font_size=18,
            color=WHITE
        )
        correct_text.next_to(misconception_text, DOWN, buff=0.3)

        correct_text2 = Text(
            "they CANNOT be independent!",
            font_size=20,
            color=YELLOW
        )
        correct_text2.next_to(correct_text, DOWN, buff=0.1)

        self.play(Write(correct_text), Write(correct_text2))
        self.wait(2)

        # =====================
        # FINAL SUMMARY
        # =====================

        # Clear middle section
        self.play(
            FadeOut(misconception_title),
            FadeOut(misconception_text),
            FadeOut(x_mark),
            FadeOut(correct_text),
            FadeOut(correct_text2),
            FadeOut(indep_intersection)
        )

        # Summary boxes
        summary_box_left = VGroup(
            Text("INDEPENDENT", font_size=20, color=GREEN),
            MathTex(r"P(A|B) = P(A)", font_size=24),
            Text("Events don't", font_size=14),
            Text("affect each other", font_size=14),
            MathTex(r"P(A \cap B) = P(A) \cdot P(B)", font_size=20)
        ).arrange(DOWN, buff=0.15)
        summary_box_left.move_to(LEFT * 3.5 + DOWN * 2.3)
        summary_rect_left = SurroundingRectangle(summary_box_left, color=GREEN, buff=0.15)

        summary_box_right = VGroup(
            Text("MUTUALLY EXCLUSIVE", font_size=18, color=ORANGE),
            MathTex(r"P(A \cap B) = 0", font_size=24),
            Text("Events cannot", font_size=14),
            Text("happen together", font_size=14),
            MathTex(r"P(A \cup B) = P(A) + P(B)", font_size=20)
        ).arrange(DOWN, buff=0.15)
        summary_box_right.move_to(RIGHT * 3.5 + DOWN * 2.3)
        summary_rect_right = SurroundingRectangle(summary_box_right, color=ORANGE, buff=0.15)

        self.play(
            Write(summary_box_left),
            Create(summary_rect_left),
            run_time=1.5
        )
        self.play(
            Write(summary_box_right),
            Create(summary_rect_right),
            run_time=1.5
        )
        self.wait(1)

        # Final takeaway
        takeaway = Text(
            "Overlapping circles = CAN happen together = NOT mutually exclusive",
            font_size=18,
            color=YELLOW
        )
        takeaway.to_edge(DOWN, buff=0.3)

        self.play(Write(takeaway))
        self.wait(2)


class IndependentVsMutuallyExclusiveQuick(Scene):
    """Quick reference version - shorter summary."""
    def construct(self):
        # Title
        title = Text("Independent vs Mutually Exclusive", font_size=36)
        title.to_edge(UP)
        self.play(Write(title))

        # Side by side comparison
        left_col = VGroup(
            Text("INDEPENDENT", font_size=28, color=GREEN),
            Circle(radius=0.6, color=BLUE, fill_opacity=0.3).shift(LEFT * 0.3),
            Circle(radius=0.6, color=RED, fill_opacity=0.3).shift(RIGHT * 0.3),
            MathTex(r"P(A|B) = P(A)", font_size=28),
            Text("CAN overlap", font_size=18, color=GREEN)
        )
        left_col[1:3] = VGroup(left_col[1], left_col[2])
        left_col.arrange(DOWN, buff=0.3)
        left_col.shift(LEFT * 3)

        right_col = VGroup(
            Text("MUTUALLY EXCLUSIVE", font_size=24, color=ORANGE),
            VGroup(
                Circle(radius=0.6, color=BLUE, fill_opacity=0.3).shift(LEFT * 0.8),
                Circle(radius=0.6, color=RED, fill_opacity=0.3).shift(RIGHT * 0.8)
            ),
            MathTex(r"P(A \cap B) = 0", font_size=28),
            Text("CANNOT overlap", font_size=18, color=ORANGE)
        )
        right_col.arrange(DOWN, buff=0.3)
        right_col.shift(RIGHT * 3)

        self.play(Write(left_col), Write(right_col))
        self.wait(1)

        # Key insight
        insight = Text(
            "If mutually exclusive, CANNOT be independent!",
            font_size=24,
            color=YELLOW
        )
        insight.to_edge(DOWN, buff=0.5)
        box = SurroundingRectangle(insight, color=YELLOW, buff=0.15)

        self.play(Write(insight), Create(box))
        self.wait(2)

"""
Geometric vs Binomial Distinction Animation

Comparison animation showing the key differences between Geometric and Binomial distributions
for AP Statistics students.

Render command:
    manim -qm --format=mp4 geometric_vs_binomial_distinction.py GeometricVsBinomialDistinction
"""

from manim import *


class GeometricVsBinomialDistinction(Scene):
    def construct(self):
        # Colors for each distribution
        BINOMIAL_COLOR = BLUE
        GEOMETRIC_COLOR = GREEN

        # Title
        title = Text("Geometric vs Binomial: Which Distribution?", font_size=40)
        title.to_edge(UP, buff=0.4)

        self.play(Write(title), run_time=1.5)
        self.wait(0.5)

        # Create column headers
        binomial_header = Text("BINOMIAL", font_size=32, color=BINOMIAL_COLOR, weight=BOLD)
        geometric_header = Text("GEOMETRIC", font_size=32, color=GEOMETRIC_COLOR, weight=BOLD)

        binomial_header.move_to(LEFT * 3.5 + UP * 2)
        geometric_header.move_to(RIGHT * 3.5 + UP * 2)

        # Vertical divider line
        divider = Line(UP * 2.3, DOWN * 2.5, color=GREY, stroke_width=2)

        self.play(
            Write(binomial_header),
            Write(geometric_header),
            Create(divider),
            run_time=1
        )
        self.wait(0.5)

        # Column content - Binomial (Left)
        binomial_items = [
            Text("Fixed number of trials (n)", font_size=24, color=BINOMIAL_COLOR),
            Text("Count: How many successes?", font_size=24, color=WHITE),
            Text("Example: In 10 shots,", font_size=22, color=GREY_B),
            Text("how many baskets?", font_size=22, color=GREY_B),
        ]

        # Column content - Geometric (Right)
        geometric_items = [
            Text("Trials until first success", font_size=24, color=GEOMETRIC_COLOR),
            Text("Count: Which trial is first success?", font_size=24, color=WHITE),
            Text("Example: How many shots", font_size=22, color=GREY_B),
            Text("until first basket?", font_size=22, color=GREY_B),
        ]

        # Position binomial items
        binomial_group = VGroup(*binomial_items)
        binomial_group.arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        binomial_group.move_to(LEFT * 3.5 + UP * 0.5)

        # Position geometric items
        geometric_group = VGroup(*geometric_items)
        geometric_group.arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        geometric_group.move_to(RIGHT * 3.5 + UP * 0.5)

        # Animate items appearing
        for b_item, g_item in zip(binomial_items, geometric_items):
            self.play(
                FadeIn(b_item, shift=RIGHT * 0.3),
                FadeIn(g_item, shift=LEFT * 0.3),
                run_time=0.6
            )
        self.wait(0.5)

        # Formulas
        binomial_formula = MathTex(
            r"P(X = k) = \binom{n}{k} p^k (1-p)^{n-k}",
            font_size=28,
            color=BINOMIAL_COLOR
        )
        binomial_formula.move_to(LEFT * 3.5 + DOWN * 1.2)

        geometric_formula = MathTex(
            r"P(X = x) = (1-p)^{x-1} \cdot p",
            font_size=28,
            color=GEOMETRIC_COLOR
        )
        geometric_formula.move_to(RIGHT * 3.5 + DOWN * 1.2)

        # Formula boxes
        binomial_box = SurroundingRectangle(binomial_formula, color=BINOMIAL_COLOR, buff=0.15)
        geometric_box = SurroundingRectangle(geometric_formula, color=GEOMETRIC_COLOR, buff=0.15)

        self.play(
            Write(binomial_formula),
            Write(geometric_formula),
            run_time=1.5
        )
        self.play(
            Create(binomial_box),
            Create(geometric_box),
            run_time=0.5
        )
        self.wait(1)

        # KEY DISTINCTION section
        key_label = Text("KEY DISTINCTION", font_size=28, color=YELLOW, weight=BOLD)
        key_label.move_to(DOWN * 2.3)

        self.play(Write(key_label), run_time=0.5)

        # Arrows with labels
        fixed_n_text = Text("Fixed n", font_size=24, color=BINOMIAL_COLOR)
        arrow_binomial = Arrow(ORIGIN, RIGHT * 0.8, color=BINOMIAL_COLOR, buff=0)
        binomial_label = Text("Binomial", font_size=24, color=BINOMIAL_COLOR, weight=BOLD)

        fixed_n_group = VGroup(fixed_n_text, arrow_binomial, binomial_label)
        fixed_n_group.arrange(RIGHT, buff=0.2)
        fixed_n_group.move_to(LEFT * 3 + DOWN * 2.9)

        until_text = Text("Until success", font_size=24, color=GEOMETRIC_COLOR)
        arrow_geometric = Arrow(ORIGIN, RIGHT * 0.8, color=GEOMETRIC_COLOR, buff=0)
        geometric_label = Text("Geometric", font_size=24, color=GEOMETRIC_COLOR, weight=BOLD)

        until_group = VGroup(until_text, arrow_geometric, geometric_label)
        until_group.arrange(RIGHT, buff=0.2)
        until_group.move_to(RIGHT * 3 + DOWN * 2.9)

        self.play(
            FadeIn(fixed_n_group, shift=UP * 0.3),
            FadeIn(until_group, shift=UP * 0.3),
            run_time=1
        )
        self.wait(1)

        # Fade out current content for flowchart
        current_objects = VGroup(
            binomial_header, geometric_header, divider,
            binomial_group, geometric_group,
            binomial_formula, geometric_formula,
            binomial_box, geometric_box,
            key_label, fixed_n_group, until_group
        )

        self.play(FadeOut(current_objects), run_time=0.8)

        # Decision Flowchart
        flowchart_title = Text("Decision Flowchart", font_size=32, color=YELLOW)
        flowchart_title.next_to(title, DOWN, buff=0.3)

        self.play(Write(flowchart_title), run_time=0.5)

        # Question box
        question_text = Text("Is the number of trials fixed?", font_size=26)
        question_box = RoundedRectangle(
            width=5.5, height=1, corner_radius=0.1,
            color=WHITE, stroke_width=2
        )
        question_box.move_to(UP * 0.8)
        question_text.move_to(question_box.get_center())
        question_group = VGroup(question_box, question_text)

        self.play(
            Create(question_box),
            Write(question_text),
            run_time=0.8
        )
        self.wait(0.3)

        # YES arrow and Binomial box
        yes_arrow = Arrow(
            question_box.get_left() + DOWN * 0.5,
            LEFT * 3 + DOWN * 0.5,
            color=BINOMIAL_COLOR
        )
        yes_label = Text("YES", font_size=22, color=BINOMIAL_COLOR, weight=BOLD)
        yes_label.next_to(yes_arrow, UP, buff=0.1)

        binomial_result_text = Text("Use BINOMIAL", font_size=26, color=BINOMIAL_COLOR, weight=BOLD)
        binomial_result_box = RoundedRectangle(
            width=3.5, height=0.9, corner_radius=0.1,
            color=BINOMIAL_COLOR, stroke_width=3, fill_opacity=0.1, fill_color=BINOMIAL_COLOR
        )
        binomial_result_box.move_to(LEFT * 3.5 + DOWN * 1.5)
        binomial_result_text.move_to(binomial_result_box.get_center())

        binomial_desc = Text("Count successes in n trials", font_size=20, color=GREY_B)
        binomial_desc.next_to(binomial_result_box, DOWN, buff=0.2)

        # NO arrow and Geometric box
        no_arrow = Arrow(
            question_box.get_right() + DOWN * 0.5,
            RIGHT * 3 + DOWN * 0.5,
            color=GEOMETRIC_COLOR
        )
        no_label = Text("NO", font_size=22, color=GEOMETRIC_COLOR, weight=BOLD)
        no_label.next_to(no_arrow, UP, buff=0.1)

        geometric_result_text = Text("Use GEOMETRIC", font_size=26, color=GEOMETRIC_COLOR, weight=BOLD)
        geometric_result_box = RoundedRectangle(
            width=3.5, height=0.9, corner_radius=0.1,
            color=GEOMETRIC_COLOR, stroke_width=3, fill_opacity=0.1, fill_color=GEOMETRIC_COLOR
        )
        geometric_result_box.move_to(RIGHT * 3.5 + DOWN * 1.5)
        geometric_result_text.move_to(geometric_result_box.get_center())

        geometric_desc = Text("Count trials until success", font_size=20, color=GREY_B)
        geometric_desc.next_to(geometric_result_box, DOWN, buff=0.2)

        # Animate flowchart branches
        self.play(
            GrowArrow(yes_arrow),
            Write(yes_label),
            GrowArrow(no_arrow),
            Write(no_label),
            run_time=0.8
        )

        self.play(
            Create(binomial_result_box),
            Write(binomial_result_text),
            Create(geometric_result_box),
            Write(geometric_result_text),
            run_time=0.8
        )

        self.play(
            FadeIn(binomial_desc, shift=UP * 0.2),
            FadeIn(geometric_desc, shift=UP * 0.2),
            run_time=0.5
        )

        # Final emphasis box around the whole flowchart
        final_box = RoundedRectangle(
            width=12, height=4.5, corner_radius=0.2,
            color=YELLOW, stroke_width=2
        )
        final_box.move_to(DOWN * 0.3)

        self.play(Create(final_box), run_time=0.8)
        self.wait(2)

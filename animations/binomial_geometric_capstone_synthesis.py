"""
Binomial vs Geometric: Complete Summary Animation

Renders a comprehensive comparison table and decision flowchart
for distinguishing between binomial and geometric distributions.

Render command:
manim -qm --format=mp4 binomial_geometric_capstone_synthesis.py BinomialGeometricCapstoneSynthesis
"""

from manim import *


class BinomialGeometricCapstoneSynthesis(Scene):
    def construct(self):
        # Color scheme
        BINOMIAL_COLOR = BLUE
        GEOMETRIC_COLOR = GREEN
        HEADER_COLOR = YELLOW

        # Title
        title = Text("Binomial vs Geometric: Complete Summary", font_size=42)
        title.to_edge(UP, buff=0.4)

        self.play(Write(title))
        self.wait(0.5)

        # Table setup - positioning
        table_center = DOWN * 0.3
        col_width = 4.2
        row_height = 0.7

        # Column positions
        feature_x = -col_width
        binomial_x = 0
        geometric_x = col_width

        # Header row
        header_y = 2.0

        feature_header = Text("Feature", font_size=28, color=HEADER_COLOR)
        binomial_header = Text("Binomial", font_size=28, color=BINOMIAL_COLOR)
        geometric_header = Text("Geometric", font_size=28, color=GEOMETRIC_COLOR)

        feature_header.move_to([feature_x, header_y, 0])
        binomial_header.move_to([binomial_x, header_y, 0])
        geometric_header.move_to([geometric_x, header_y, 0])

        # Create header underline
        header_line = Line(
            start=[-6, header_y - 0.35, 0],
            end=[6, header_y - 0.35, 0],
            color=WHITE
        )

        # Vertical lines for columns
        v_line1 = Line(
            start=[-col_width/2 - 0.1, header_y + 0.3, 0],
            end=[-col_width/2 - 0.1, header_y - 4.2, 0],
            color=GRAY
        )
        v_line2 = Line(
            start=[col_width/2 + 0.1, header_y + 0.3, 0],
            end=[col_width/2 + 0.1, header_y - 4.2, 0],
            color=GRAY
        )

        # Animate headers
        self.play(
            FadeIn(feature_header),
            FadeIn(binomial_header),
            FadeIn(geometric_header),
            Create(header_line),
            Create(v_line1),
            Create(v_line2),
            run_time=1
        )
        self.wait(0.3)

        # Table rows data
        rows = [
            {
                "feature": "Question",
                "binomial": Text("How many in n?", font_size=24, color=BINOMIAL_COLOR),
                "geometric": Text("Which trial first?", font_size=24, color=GEOMETRIC_COLOR)
            },
            {
                "feature": "Random variable",
                "binomial": MathTex(r"X = \text{\# successes}", font_size=32, color=BINOMIAL_COLOR),
                "geometric": MathTex(r"X = \text{trial number}", font_size=32, color=GEOMETRIC_COLOR)
            },
            {
                "feature": "Probability",
                "binomial": MathTex(r"\binom{n}{k} p^k (1-p)^{n-k}", font_size=30, color=BINOMIAL_COLOR),
                "geometric": MathTex(r"(1-p)^{x-1} \cdot p", font_size=30, color=GEOMETRIC_COLOR)
            },
            {
                "feature": "Mean",
                "binomial": MathTex(r"\mu = np", font_size=32, color=BINOMIAL_COLOR),
                "geometric": MathTex(r"\mu = \frac{1}{p}", font_size=32, color=GEOMETRIC_COLOR)
            },
            {
                "feature": "SD",
                "binomial": MathTex(r"\sigma = \sqrt{np(1-p)}", font_size=30, color=BINOMIAL_COLOR),
                "geometric": MathTex(r"\sigma = \frac{\sqrt{1-p}}{p}", font_size=30, color=GEOMETRIC_COLOR)
            }
        ]

        # Build table row by row
        for i, row in enumerate(rows):
            row_y = header_y - 0.7 - (i * row_height)

            feature_text = Text(row["feature"], font_size=24)
            feature_text.move_to([feature_x, row_y, 0])

            binomial_content = row["binomial"]
            binomial_content.move_to([binomial_x, row_y, 0])

            geometric_content = row["geometric"]
            geometric_content.move_to([geometric_x, row_y, 0])

            # Animate row appearing
            self.play(
                FadeIn(feature_text),
                FadeIn(binomial_content),
                FadeIn(geometric_content),
                run_time=0.6
            )
            self.wait(0.3)

        self.wait(1)

        # Transition to flowchart
        self.play(
            *[FadeOut(mob) for mob in self.mobjects if mob != title],
            run_time=0.8
        )

        # Decision flowchart
        flowchart_title = Text("Decision Flowchart", font_size=36, color=YELLOW)
        flowchart_title.next_to(title, DOWN, buff=0.5)

        self.play(FadeIn(flowchart_title))
        self.wait(0.3)

        # Question box
        question_box = RoundedRectangle(
            corner_radius=0.2,
            width=3.5,
            height=1,
            color=WHITE
        )
        question_box.move_to([0, 0.8, 0])
        question_text = Text("Is n fixed?", font_size=28)
        question_text.move_to(question_box.get_center())

        self.play(Create(question_box), Write(question_text))
        self.wait(0.5)

        # Yes branch (Binomial)
        yes_arrow = Arrow(
            start=question_box.get_left() + LEFT * 0.1,
            end=[-3.5, -0.8, 0],
            color=BINOMIAL_COLOR,
            buff=0.1
        )
        yes_label = Text("Yes", font_size=24, color=BINOMIAL_COLOR)
        yes_label.next_to(yes_arrow, UP, buff=0.1)

        binomial_box = RoundedRectangle(
            corner_radius=0.2,
            width=3,
            height=0.8,
            color=BINOMIAL_COLOR
        )
        binomial_box.move_to([-3.5, -1.5, 0])
        binomial_result = Text("BINOMIAL", font_size=28, color=BINOMIAL_COLOR, weight=BOLD)
        binomial_result.move_to(binomial_box.get_center())

        self.play(
            Create(yes_arrow),
            FadeIn(yes_label),
            run_time=0.5
        )
        self.play(
            Create(binomial_box),
            Write(binomial_result),
            run_time=0.5
        )
        self.wait(0.3)

        # No branch (Geometric)
        no_arrow = Arrow(
            start=question_box.get_right() + RIGHT * 0.1,
            end=[3.5, -0.8, 0],
            color=GEOMETRIC_COLOR,
            buff=0.1
        )
        no_label = Text("No", font_size=24, color=GEOMETRIC_COLOR)
        no_label.next_to(no_arrow, UP, buff=0.1)

        no_detail = Text("counting until\nfirst success", font_size=20, color=GEOMETRIC_COLOR)
        no_detail.next_to(no_arrow, RIGHT, buff=0.1).shift(DOWN * 0.3)

        geometric_box = RoundedRectangle(
            corner_radius=0.2,
            width=3,
            height=0.8,
            color=GEOMETRIC_COLOR
        )
        geometric_box.move_to([3.5, -1.5, 0])
        geometric_result = Text("GEOMETRIC", font_size=28, color=GEOMETRIC_COLOR, weight=BOLD)
        geometric_result.move_to(geometric_box.get_center())

        self.play(
            Create(no_arrow),
            FadeIn(no_label),
            FadeIn(no_detail),
            run_time=0.5
        )
        self.play(
            Create(geometric_box),
            Write(geometric_result),
            run_time=0.5
        )
        self.wait(1)

        # Common requirements box at bottom
        common_box = RoundedRectangle(
            corner_radius=0.2,
            width=10,
            height=1.2,
            color=YELLOW
        )
        common_box.move_to([0, -3, 0])

        common_title = Text("Both require:", font_size=24, color=YELLOW, weight=BOLD)
        common_title.move_to(common_box.get_center() + UP * 0.3)

        common_text = Text(
            "Binary outcomes  •  Independent trials  •  Same probability",
            font_size=22
        )
        common_text.move_to(common_box.get_center() + DOWN * 0.2)

        self.play(
            Create(common_box),
            run_time=0.5
        )
        self.play(
            Write(common_title),
            Write(common_text),
            run_time=1
        )

        self.wait(2)

        # Final fade out
        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=1)
        self.wait(0.5)

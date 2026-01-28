"""
Standard Deviation of Random Variable Animation

Renders the step-by-step calculation of standard deviation using a probability distribution.

Usage:
    manim -qm --format=mp4 l39_std_dev_formula.py StdDevFormula
"""

from manim import *

class StdDevFormula(Scene):
    def construct(self):
        # Title
        title = Text("Standard Deviation of a Random Variable", font_size=42)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Main formula
        formula = MathTex(
            r"\sigma = \sqrt{\sum (x - \mu)^2 \cdot P(x)}",
            font_size=44
        )
        formula.next_to(title, DOWN, buff=0.4)
        self.play(Write(formula))
        self.wait(1)

        # Given mean
        given = MathTex(r"\text{Given: } \mu = 2.7", font_size=36)
        given.next_to(formula, DOWN, buff=0.5)
        self.play(FadeIn(given))
        self.wait(0.5)

        # Shift everything up to make room
        self.play(
            VGroup(title, formula, given).animate.shift(UP * 0.3),
            run_time=0.5
        )

        # Table header
        table_data = [
            [r"x", r"x - \mu", r"(x - \mu)^2", r"P(x)", r"(x - \mu)^2 \cdot P(x)"],
            ["1", "-1.7", "2.89", "0.3", "0.867"],
            ["2", "-0.7", "0.49", "0.15", "0.074"],
            ["3", "0.3", "0.09", "0.2", "0.018"],
            ["4", "1.3", "1.69", "0.35", "0.592"],
        ]

        # Create table
        table = Table(
            table_data,
            include_outer_lines=True,
            line_config={"stroke_width": 1}
        ).scale(0.45)
        table.next_to(given, DOWN, buff=0.4)

        # Highlight header row
        header_cells = table.get_rows()[0]

        # Show header first
        self.play(Create(table.get_horizontal_lines()[0]))
        self.play(Write(header_cells), run_time=1.5)
        self.play(Create(table.get_horizontal_lines()[1]))
        self.wait(0.5)

        # Build table row by row
        rows = table.get_rows()[1:]
        h_lines = table.get_horizontal_lines()[2:]
        v_lines = table.get_vertical_lines()

        # Show vertical lines
        self.play(Create(VGroup(*v_lines)), run_time=0.5)

        # Animate each row with step-by-step reveal
        for i, row in enumerate(rows):
            cells = row
            # Show x value
            self.play(Write(cells[0]), run_time=0.3)
            # Show x - μ
            self.play(Write(cells[1]), run_time=0.3)
            # Show (x - μ)²
            self.play(Write(cells[2]), run_time=0.3)
            # Show P(x)
            self.play(Write(cells[3]), run_time=0.3)
            # Show product (highlight this)
            self.play(
                Write(cells[4]),
                cells[4].animate.set_color(YELLOW),
                run_time=0.4
            )
            # Draw horizontal line
            if i < len(h_lines):
                self.play(Create(h_lines[i]), run_time=0.2)

        self.wait(0.5)

        # Sum calculation
        sum_line = MathTex(
            r"\sum (x - \mu)^2 \cdot P(x) = 0.867 + 0.074 + 0.018 + 0.592",
            font_size=32
        )
        sum_line.next_to(table, DOWN, buff=0.3)
        self.play(Write(sum_line))
        self.wait(0.5)

        # Equals sum
        sum_result = MathTex(r"= 1.551", font_size=32)
        sum_result.next_to(sum_line, RIGHT, buff=0.2)
        self.play(Write(sum_result))
        self.wait(0.5)

        # Square root step
        sqrt_step = MathTex(
            r"\sigma = \sqrt{1.551}",
            font_size=36
        )
        sqrt_step.next_to(sum_line, DOWN, buff=0.3)
        self.play(Write(sqrt_step))
        self.wait(0.5)

        # Final answer
        final_answer = MathTex(
            r"\sigma \approx 1.25",
            font_size=40
        )
        final_answer.next_to(sqrt_step, DOWN, buff=0.3)
        final_answer.set_color(GREEN)

        # Box around final answer
        box = SurroundingRectangle(final_answer, color=GREEN, buff=0.15)

        self.play(Write(final_answer))
        self.play(Create(box))
        self.wait(1)

        # Key insight
        insight = Text(
            "Measures typical deviation from mean",
            font_size=32,
            color=BLUE
        )
        insight.to_edge(DOWN, buff=0.5)

        self.play(FadeIn(insight, shift=UP))
        self.wait(2)

        # Fade out
        self.play(
            FadeOut(VGroup(*self.mobjects)),
            run_time=1
        )

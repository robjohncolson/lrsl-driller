"""
Pascal's Triangle: Building the triangle and showing patterns
- Each number is the sum of the two numbers above
- Row sums = powers of 2
- Connection to binomial coefficients

Run with: manim -pql pascals_triangle.py PascalsTriangle
"""
from manim import *

class PascalsTriangle(Scene):
    def construct(self):
        title = Text("Pascal's Triangle", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Build Pascal's triangle row by row
        rows = [
            [1],
            [1, 1],
            [1, 2, 1],
            [1, 3, 3, 1],
            [1, 4, 6, 4, 1],
            [1, 5, 10, 10, 5, 1],
            [1, 6, 15, 20, 15, 6, 1],
        ]

        # Position settings
        start_y = 2
        y_spacing = 0.65
        x_spacing = 0.7

        all_numbers = []
        all_circles = []

        for row_idx, row in enumerate(rows):
            row_numbers = []
            row_circles = []
            y = start_y - row_idx * y_spacing
            # Center the row
            x_start = -len(row) * x_spacing / 2 + x_spacing / 2

            for col_idx, val in enumerate(row):
                x = x_start + col_idx * x_spacing

                # Create number
                num = MathTex(str(val), font_size=28)
                num.move_to(np.array([x, y, 0]))

                # Create circle around it
                circle = Circle(radius=0.28, color=BLUE, stroke_width=2)
                circle.move_to(num.get_center())

                row_numbers.append(num)
                row_circles.append(circle)

            all_numbers.append(row_numbers)
            all_circles.append(row_circles)

        # Animate building row by row
        # Row 0 (just 1)
        self.play(
            Write(all_numbers[0][0]),
            Create(all_circles[0][0])
        )
        self.wait(0.3)

        # Row 1
        self.play(
            Write(all_numbers[1][0]),
            Write(all_numbers[1][1]),
            Create(all_circles[1][0]),
            Create(all_circles[1][1])
        )
        self.wait(0.3)

        # Remaining rows - show the addition pattern
        explanation = Text(
            "Each number = sum of two numbers above",
            font_size=24,
            color=YELLOW
        )
        explanation.to_edge(DOWN, buff=1.5)
        self.play(Write(explanation))

        for row_idx in range(2, len(rows)):
            row = rows[row_idx]
            anims = []

            for col_idx, val in enumerate(row):
                num = all_numbers[row_idx][col_idx]
                circle = all_circles[row_idx][col_idx]

                # Show arrows for middle numbers
                if col_idx > 0 and col_idx < len(row) - 1:
                    # Get the two numbers above
                    above_left = all_numbers[row_idx - 1][col_idx - 1]
                    above_right = all_numbers[row_idx - 1][col_idx]

                    # Highlight them briefly
                    self.play(
                        Indicate(above_left, color=GREEN, scale_factor=1.3),
                        Indicate(above_right, color=GREEN, scale_factor=1.3),
                        run_time=0.3
                    )

                anims.extend([Write(num), Create(circle)])

            self.play(*anims, run_time=0.5)
            self.wait(0.2)

        self.wait(1)
        self.play(FadeOut(explanation))

        # Show row sum pattern
        row_sum_title = Text("Row Sum Pattern", font_size=32, color=GREEN)
        row_sum_title.to_edge(DOWN, buff=1.8)
        self.play(Write(row_sum_title))

        sums_display = VGroup()
        for row_idx, row in enumerate(rows[:5]):
            row_sum = sum(row)
            power = row_idx
            text = MathTex(
                f"\\text{{Row {row_idx}:}} \\quad \\sum = {row_sum} = 2^{{{power}}}",
                font_size=24
            )
            sums_display.add(text)

        sums_display.arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        sums_display.next_to(row_sum_title, DOWN)
        sums_display.to_edge(RIGHT, buff=0.5)

        for text in sums_display:
            self.play(Write(text), run_time=0.4)

        self.wait(2)

        # Clear and show binomial coefficient connection
        self.play(
            FadeOut(row_sum_title),
            FadeOut(sums_display)
        )

        binom_title = Text("Binomial Coefficients", font_size=32, color=YELLOW)
        binom_title.to_edge(DOWN, buff=1.8)
        self.play(Write(binom_title))

        # Highlight row 4 as example
        row4_highlight = VGroup(*all_circles[4])
        self.play(
            *[c.animate.set_color(YELLOW) for c in all_circles[4]]
        )

        binom_explain = MathTex(
            "\\text{Row 4: } \\binom{4}{0}, \\binom{4}{1}, \\binom{4}{2}, \\binom{4}{3}, \\binom{4}{4}",
            font_size=28
        )
        binom_explain.next_to(binom_title, DOWN)
        self.play(Write(binom_explain))

        values_explain = MathTex(
            "= 1, 4, 6, 4, 1",
            font_size=28,
            color=YELLOW
        )
        values_explain.next_to(binom_explain, DOWN)
        self.play(Write(values_explain))

        self.wait(2)

        # Connection to binomial theorem
        self.play(FadeOut(binom_explain), FadeOut(values_explain))

        connection = MathTex(
            "(x + y)^4 = ",
            "\\binom{4}{0}", "x^4 + ",
            "\\binom{4}{1}", "x^3y + ",
            "\\binom{4}{2}", "x^2y^2 + ",
            "\\binom{4}{3}", "xy^3 + ",
            "\\binom{4}{4}", "y^4",
            font_size=24
        )
        connection.next_to(binom_title, DOWN)
        self.play(Write(connection), run_time=2)
        self.wait(1)

        expanded = MathTex(
            "= 1x^4 + 4x^3y + 6x^2y^2 + 4xy^3 + 1y^4",
            font_size=28,
            color=GREEN
        )
        expanded.next_to(connection, DOWN)
        self.play(Write(expanded))

        self.wait(3)


class PascalsTriangleFillIn(Scene):
    """Interactive-style: find the missing number"""
    def construct(self):
        title = Text("Find the Missing Number", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Show partial Pascal's triangle with one missing
        rows_text = VGroup(
            MathTex("1", font_size=32),
            MathTex("1 \\quad 1", font_size=32),
            MathTex("1 \\quad 2 \\quad 1", font_size=32),
            MathTex("1 \\quad 3 \\quad 3 \\quad 1", font_size=32),
            MathTex("1 \\quad 4 \\quad ? \\quad 4 \\quad 1", font_size=32),
        ).arrange(DOWN, buff=0.4)
        rows_text.shift(UP * 0.5)

        self.play(Write(rows_text), run_time=2)
        self.wait(1)

        # Highlight the question mark
        q_mark = rows_text[4][0][4]  # The ? character
        box = SurroundingRectangle(q_mark, color=RED, buff=0.1)
        self.play(Create(box))
        self.wait(1)

        # Show hint
        hint = Text(
            "Hint: Add the two numbers above it",
            font_size=28,
            color=YELLOW
        )
        hint.to_edge(DOWN, buff=1.5)
        self.play(Write(hint))

        # Highlight 3 and 3 from row above
        three_left = rows_text[3][0][2]  # First 3
        three_right = rows_text[3][0][4]  # Second 3

        self.play(
            Indicate(three_left, color=GREEN, scale_factor=1.5),
            Indicate(three_right, color=GREEN, scale_factor=1.5),
        )

        # Show calculation
        calc = MathTex("3 + 3 = 6", font_size=36, color=GREEN)
        calc.next_to(hint, DOWN)
        self.play(Write(calc))
        self.wait(1)

        # Replace ? with 6
        new_row = MathTex("1 \\quad 4 \\quad 6 \\quad 4 \\quad 1", font_size=32)
        new_row.move_to(rows_text[4].get_center())

        self.play(
            FadeOut(box),
            Transform(rows_text[4], new_row)
        )

        answer_box = SurroundingRectangle(
            new_row[0][4],
            color=GREEN,
            buff=0.1
        )
        self.play(Create(answer_box))
        self.wait(2)

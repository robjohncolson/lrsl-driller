"""
Conditional Probability from Tables Animation

Demonstrates finding P(B|A) from a two-way table by using row/column totals.

Render command:
    manim -qm --format=mp4 l21_conditional_table.py ConditionalFromTable
"""

from manim import *

class ConditionalFromTable(Scene):
    def construct(self):
        # Title
        title = Text("Conditional Probability from Tables", font_size=36)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Create two-way table
        table_data = [
            ["", "Soccer", "Basketball", "Total"],
            ["10th", "15", "25", "40"],
            ["11th", "20", "30", "50"],
            ["Total", "35", "55", "90"]
        ]

        table = Table(
            table_data,
            include_outer_lines=True,
            line_config={"stroke_width": 2, "color": WHITE}
        ).scale(0.6)
        table.move_to(ORIGIN).shift(UP * 0.5)

        self.play(Create(table))
        self.wait(0.5)

        # Question
        question = Text("Find P(Soccer | 10th grade)", font_size=28, color=YELLOW)
        question.next_to(table, DOWN, buff=0.5)
        self.play(Write(question))
        self.wait(1)

        # Step 1: Highlight 10th grade ROW (the condition)
        step1 = Text("Step 1: Find the condition ROW", font_size=24, color=BLUE)
        step1.next_to(question, DOWN, buff=0.3)
        self.play(Write(step1))

        # Highlight entire 10th grade row
        row_rect = SurroundingRectangle(
            VGroup(*[table.get_entries((2, i)) for i in range(1, 5)]),
            color=BLUE,
            buff=0.1,
            stroke_width=4
        )
        self.play(Create(row_rect))
        self.wait(1)

        # Step 2: Find Soccer ∩ 10th grade cell
        self.play(FadeOut(step1))
        step2 = Text("Step 2: Find Soccer AND 10th grade", font_size=24, color=GREEN)
        step2.next_to(question, DOWN, buff=0.3)
        self.play(Write(step2))

        # Highlight the cell with 15
        cell_rect = SurroundingRectangle(
            table.get_entries((2, 2)),
            color=GREEN,
            buff=0.1,
            stroke_width=4
        )
        self.play(Create(cell_rect))
        self.wait(1)

        # Step 3: Show the calculation
        self.play(FadeOut(step2))
        step3 = Text("Step 3: Divide by ROW total", font_size=24, color=ORANGE)
        step3.next_to(question, DOWN, buff=0.3)
        self.play(Write(step3))

        # Highlight the row total (40)
        total_rect = SurroundingRectangle(
            table.get_entries((2, 4)),
            color=ORANGE,
            buff=0.1,
            stroke_width=4
        )
        self.play(Create(total_rect))
        self.wait(1)

        # Show WRONG denominator (grand total) crossed out
        self.play(FadeOut(step3), FadeOut(question))

        wrong_calc = MathTex(r"P(\text{Soccer}|\text{10th}) = \frac{15}{90}", color=RED)
        wrong_calc.next_to(table, DOWN, buff=0.5)

        # Cross out wrong answer
        cross = Line(
            wrong_calc.get_corner(DL) + LEFT * 0.2,
            wrong_calc.get_corner(UR) + RIGHT * 0.2,
            color=RED,
            stroke_width=6
        )

        self.play(Write(wrong_calc))
        self.wait(0.3)
        self.play(Create(cross))
        self.wait(0.5)

        # Highlight grand total to show what NOT to use
        # Use position of last valid cell since (4,4) causes index error
        grand_total_rect = SurroundingRectangle(
            table.get_entries((4, 3)),
            color=RED,
            buff=0.1,
            stroke_width=4
        )
        # Shift to cover the grand total area
        grand_total_rect.shift(RIGHT * 0.5)
        self.play(
            FadeOut(row_rect),
            Create(grand_total_rect)
        )
        self.wait(0.5)

        # Show CORRECT calculation
        self.play(
            FadeOut(wrong_calc),
            FadeOut(cross),
            FadeOut(grand_total_rect)
        )

        correct_calc = MathTex(r"P(\text{Soccer}|\text{10th}) = \frac{15}{40}", color=GREEN)
        correct_calc.next_to(table, DOWN, buff=0.5)

        self.play(Write(correct_calc))
        self.play(
            cell_rect.animate.set_color(GREEN),
            total_rect.animate.set_color(GREEN)
        )
        self.wait(0.5)

        # Simplify
        simplified = MathTex(r"= \frac{3}{8} = 0.375", color=GREEN)
        simplified.next_to(correct_calc, RIGHT, buff=0.3)
        self.play(Write(simplified))
        self.wait(0.5)

        # Final emphasis
        emphasis = Text(
            "Use ROW total, NOT grand total!",
            font_size=30,
            color=YELLOW,
            weight=BOLD
        )
        emphasis.next_to(correct_calc, DOWN, buff=0.5)

        self.play(
            Write(emphasis),
            emphasis.animate.scale(1.1).set_color(YELLOW)
        )

        # Circle the correct denominator
        circle = Circle(
            radius=0.3,
            color=YELLOW,
            stroke_width=4
        ).move_to(total_rect)
        self.play(Create(circle))

        self.wait(2)

        # Fade out
        self.play(
            *[FadeOut(mob) for mob in self.mobjects]
        )

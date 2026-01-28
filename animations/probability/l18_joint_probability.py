"""
Joint Probability from Two-Way Tables

Demonstrates how to calculate P(A ∩ B) using two-way tables.

Usage:
    manim -qm --format=mp4 l18_joint_probability.py JointProbability
"""

from manim import *

class JointProbability(Scene):
    def construct(self):
        # Title
        title = Text("Joint Probability P(A ∩ B)", font_size=48, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Create two-way table
        # Headers: Sports, Music, Total
        # Rows: Male, Female, Total
        table_data = [
            ["", "Sports", "Music", "Total"],
            ["Male", "35", "25", "60"],
            ["Female", "20", "15", "35"],
            ["Total", "55", "40", "95"]
        ]

        # Note: Corrected grand total to 95 for consistency
        table_data[3][3] = "95"

        table = Table(
            table_data,
            include_outer_lines=True,
            line_config={"stroke_width": 2}
        ).scale(0.6)
        table.move_to(UP * 0.5)

        self.play(Create(table))
        self.wait(0.5)

        # Question text
        question = Text("What is P(Female ∩ Music)?", font_size=32)
        question.next_to(table, DOWN, buff=0.5)
        self.play(FadeIn(question))
        self.wait(0.5)

        # Highlight the intersection cell (Female AND Music)
        # Row 2, Column 2 (15)
        intersection_cell = table.get_cell((3, 3))  # 0-indexed: row 3, col 3
        intersection_highlight = intersection_cell.copy()
        intersection_highlight.set_fill(BLUE, opacity=0.3)

        self.play(FadeIn(intersection_highlight))
        self.wait(0.5)

        # Show the value in intersection
        intersection_label = Text("Count: 15", font_size=28, color=BLUE)
        intersection_label.next_to(intersection_highlight, LEFT, buff=0.3)
        self.play(Write(intersection_label))
        self.wait(0.5)

        # Highlight GRAND TOTAL (bottom-right cell)
        grand_total_cell = table.get_cell((4, 4))  # 0-indexed: row 4, col 4
        grand_total_highlight = grand_total_cell.copy()
        grand_total_highlight.set_fill(YELLOW, opacity=0.5)

        self.play(FadeIn(grand_total_highlight))
        self.wait(0.3)

        # Show grand total label
        grand_total_label = Text("Grand Total: 95", font_size=28, color=YELLOW, weight=BOLD)
        grand_total_label.next_to(grand_total_highlight, RIGHT, buff=0.3)
        self.play(Write(grand_total_label))
        self.wait(0.5)

        # Show calculation
        self.play(FadeOut(question))

        calculation = MathTex(
            r"P(\text{Female} \cap \text{Music})", "=", r"\frac{15}{95}", "=", "0.158"
        ).scale(0.9)
        calculation.move_to(question.get_center())

        self.play(Write(calculation))
        self.wait(1)

        # Emphasize denominator
        emphasis = Text(
            "Denominator is GRAND TOTAL,\nnot row/column total!",
            font_size=28,
            color=YELLOW,
            weight=BOLD
        )
        emphasis.next_to(calculation, DOWN, buff=0.4)
        self.play(FadeIn(emphasis, shift=UP * 0.2))
        self.wait(1)

        # Clear for formula
        self.play(
            FadeOut(intersection_highlight),
            FadeOut(intersection_label),
            FadeOut(grand_total_highlight),
            FadeOut(grand_total_label),
            FadeOut(table),
            FadeOut(calculation),
            FadeOut(emphasis)
        )

        # Key formula box
        formula_title = Text("Joint Probability Formula", font_size=36, weight=BOLD)
        formula_title.move_to(UP * 1)

        formula = MathTex(
            r"P(A \cap B) = \frac{\text{Count in both A AND B}}{\text{GRAND TOTAL}}"
        ).scale(0.9)
        formula.next_to(formula_title, DOWN, buff=0.5)

        formula_box = SurroundingRectangle(
            VGroup(formula_title, formula),
            color=BLUE,
            buff=0.4,
            corner_radius=0.2
        )

        self.play(
            Create(formula_box),
            Write(formula_title),
            Write(formula)
        )
        self.wait(2)

        # Fade out everything
        self.play(
            FadeOut(title),
            FadeOut(formula_box),
            FadeOut(formula_title),
            FadeOut(formula)
        )
        self.wait(0.5)

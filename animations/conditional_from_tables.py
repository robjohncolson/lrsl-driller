"""
Conditional Probability from Two-Way Tables (AP Stats Unit 4, Topic 4.5b)

Shows how to read conditional probabilities directly from a two-way table
by restricting to the given row/column.

Run with: manim -qm --format=mp4 conditional_from_tables.py ConditionalFromTables
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class ConditionalFromTables(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Conditional Probability from Tables", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== TWO-WAY TABLE ==========
        headers = ["", "Sports", "Music", "Total"]
        row1 = ["Male", "40", "10", "50"]
        row2 = ["Female", "20", "30", "50"]
        row3 = ["Total", "60", "40", "100"]

        table = Table(
            [row1, row2, row3],
            col_labels=[Text(h, font_size=18) for h in headers],
            include_outer_lines=True,
            line_config={"color": GREY_B},
        ).scale(0.65).next_to(title, DOWN, buff=0.4)

        self.play(Create(table), run_time=0.8)
        self.wait(0.5)

        # ========== QUESTION ==========
        question = Text(
            "P(Sports | Male) = ?",
            font_size=26, color=YELLOW_3B1B, weight=BOLD,
        )
        question.next_to(table, DOWN, buff=0.4)
        self.play(Write(question), run_time=0.4)
        self.wait(0.5)

        # ========== HIGHLIGHT ROW ==========
        step1 = Text("Step 1: Restrict to Male row (the GIVEN)", font_size=20, color=TEAL_3B1B)
        step1.next_to(question, DOWN, buff=0.3)
        self.play(Write(step1), run_time=0.4)

        row_highlight = SurroundingRectangle(
            table.get_rows()[1], color=ManimColor(BLUE_3B1B), buff=0.05
        )
        self.play(Create(row_highlight), run_time=0.5)
        self.wait(0.5)

        # ========== CALCULATE ==========
        step2 = Text("Step 2: Favorable / Row total", font_size=20, color=TEAL_3B1B)
        step2.next_to(step1, DOWN, buff=0.2)
        self.play(Write(step2), run_time=0.4)

        calc = MathTex(
            r"P(\text{Sports} \mid \text{Male}) = \frac{40}{50} = 0.80",
            font_size=32, color=ManimColor(GREEN_3B1B),
        )
        calc.next_to(step2, DOWN, buff=0.3)
        calc_box = SurroundingRectangle(calc, color=ManimColor(GREEN_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(calc), Create(calc_box), run_time=0.5)
        self.wait(0.5)

        # ========== KEY INSIGHT ==========
        closing = Text(
            "The denominator is the row total, not the grand total.",
            font_size=20, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.3)
        self.play(Write(closing), run_time=0.5)
        self.wait(1.5)

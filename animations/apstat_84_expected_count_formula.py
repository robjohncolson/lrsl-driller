"""
Derive the expected count formula and plug in values for the Public/2019 cell.

Render:
manim -qm --format=mp4 animations/apstat_84_expected_count_formula.py ExpectedCountFormula
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ExpectedCountFormula(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Expected Count Formula", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "How many we'd expect in each cell if there were no association",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # formula box
        formula_box = RoundedRectangle(
            corner_radius=0.22, width=9.5, height=1.3,
            stroke_color=BLUE_3B1B, stroke_width=4,
        )
        formula_box.set_fill(BLUE_3B1B, opacity=0.08)
        formula_box.shift(UP * 0.9)

        formula = Text(
            "Expected Count = (Row Total  x  Column Total) / Table Total",
            font_size=28, color=WHITE, weight=BOLD,
        )
        formula.move_to(formula_box.get_center())

        # labels for plugging in
        cell_label = Text("Cell: Public / 2019", font_size=26, color=TEAL_3B1B, weight=BOLD)
        cell_label.shift(DOWN * 0.15)

        # step-by-step pieces
        row_piece = Text("Row Total (Public) = 429", font_size=26, color=YELLOW_3B1B)
        col_piece = Text("Column Total (2019) = 320", font_size=26, color=YELLOW_3B1B)
        table_piece = Text("Table Total = 534", font_size=26, color=YELLOW_3B1B)

        pieces = VGroup(row_piece, col_piece, table_piece).arrange(DOWN, buff=0.28, aligned_edge=LEFT)
        pieces.shift(DOWN * 1.3 + LEFT * 2.0)

        # calculation
        calc_box = RoundedRectangle(
            corner_radius=0.18, width=5.2, height=1.6,
            stroke_color=GREEN_3B1B, stroke_width=4,
        )
        calc_box.set_fill(GREEN_3B1B, opacity=0.08)
        calc_box.shift(DOWN * 1.3 + RIGHT * 2.8)

        calc_line1 = Text("(429 x 320) / 534", font_size=26, color=WHITE)
        calc_line2 = Text("= 137,280 / 534", font_size=26, color=WHITE)
        calc_line3 = Text("= 257.1", font_size=30, color=GREEN_3B1B, weight=BOLD)

        calc_stack = VGroup(calc_line1, calc_line2, calc_line3).arrange(DOWN, buff=0.18)
        calc_stack.move_to(calc_box.get_center())

        # bottom callout
        result_box = RoundedRectangle(
            corner_radius=0.2, width=8.5, height=0.85,
            stroke_color=PINK_3B1B, stroke_width=4,
        )
        result_box.set_fill(PINK_3B1B, opacity=0.08)
        result_box.to_edge(DOWN, buff=0.4)
        result_text = Text(
            "We'd expect 257.1 Public-school students in 2019 if no association",
            font_size=24, color=WHITE,
        )
        result_text.move_to(result_box.get_center())

        # --- animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)
        self.play(DrawBorderThenFill(formula_box), Write(formula), run_time=1.4)
        self.play(FadeIn(cell_label, shift=UP * 0.15), run_time=0.7)
        self.play(
            LaggedStart(
                FadeIn(row_piece, shift=RIGHT * 0.2),
                FadeIn(col_piece, shift=RIGHT * 0.2),
                FadeIn(table_piece, shift=RIGHT * 0.2),
                lag_ratio=0.3,
                run_time=2.0,
            )
        )
        self.play(DrawBorderThenFill(calc_box), run_time=0.6)
        self.play(Write(calc_line1), run_time=0.9)
        self.play(Write(calc_line2), run_time=0.9)
        self.play(Write(calc_line3), run_time=0.9)
        self.play(DrawBorderThenFill(result_box), Write(result_text), run_time=1.3)
        self.wait(1.8)

"""
Identify the Error Type (AP Stats Unit 6, Topic 6.7)

Shows the 2x2 decision table for hypothesis testing outcomes.
Columns: Reality (H0 True vs H0 False). Rows: Decision (Reject vs Fail to Reject).
Highlights the two error cells: Type I (reject when H0 true) and
Type II (fail to reject when H0 false).

Run with: manim -qm --format=mp4 apstat_67_identify_error_type.py IdentifyErrorType
"""
from manim import *
import numpy as np

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class IdentifyErrorType(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Type I and Type II Errors", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Two ways a hypothesis test can go wrong",
            font_size=24, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== BUILD 2x2 TABLE ==========
        cell_w, cell_h = 2.8, 1.2

        # Column headers
        col_header_bg = Rectangle(
            width=cell_w * 2, height=0.6, fill_opacity=0.15,
            fill_color=BLUE_3B1B, stroke_color=WHITE, stroke_width=1,
        )
        col_header_bg.move_to(UP * 1.6 + RIGHT * 0.9)
        col_title = Text("REALITY", font_size=20, weight=BOLD, color=BLUE_3B1B)
        col_title.move_to(col_header_bg)

        h0_true_label = Text("H\u2080 is TRUE", font_size=18, color=WHITE, weight=BOLD)
        h0_true_label.move_to(UP * 1.0 + LEFT * 0.5)
        h0_false_label = Text("H\u2080 is FALSE", font_size=18, color=WHITE, weight=BOLD)
        h0_false_label.move_to(UP * 1.0 + RIGHT * 2.3)

        # Row headers
        row_header_bg = Rectangle(
            width=0.9, height=cell_h * 2, fill_opacity=0.15,
            fill_color=YELLOW_3B1B, stroke_color=WHITE, stroke_width=1,
        )
        row_header_bg.move_to(DOWN * 0.2 + LEFT * 2.35)
        row_title = Text("D\nE\nC\nI\nS\nI\nO\nN", font_size=12, weight=BOLD, color=YELLOW_3B1B)
        row_title.move_to(row_header_bg)

        reject_label = Text("Reject\nH\u2080", font_size=16, color=WHITE, weight=BOLD)
        reject_label.move_to(DOWN * -0.2 + LEFT * 1.55)
        fail_label = Text("Fail to\nReject H\u2080", font_size=16, color=WHITE, weight=BOLD)
        fail_label.move_to(DOWN * 1.0 + LEFT * 1.55)

        self.play(
            FadeIn(col_header_bg), Write(col_title),
            FadeIn(row_header_bg), Write(row_title),
            run_time=0.5,
        )
        self.play(
            Write(h0_true_label), Write(h0_false_label),
            Write(reject_label), Write(fail_label),
            run_time=0.5,
        )
        self.wait(0.3)

        # ========== FOUR CELLS ==========
        # Cell positions: (col_center, row_center)
        positions = [
            (LEFT * 0.5, UP * 0.4),     # top-left: Reject + H0 True = TYPE I
            (RIGHT * 2.3, UP * 0.4),    # top-right: Reject + H0 False = CORRECT
            (LEFT * 0.5, DOWN * 0.8),   # bot-left: Fail to Reject + H0 True = CORRECT
            (RIGHT * 2.3, DOWN * 0.8),  # bot-right: Fail to Reject + H0 False = TYPE II
        ]

        # Correct cells first (green)
        correct1 = Rectangle(
            width=cell_w, height=cell_h, fill_opacity=0.15,
            fill_color=GREEN_3B1B, stroke_color=GREEN_3B1B, stroke_width=2,
        )
        correct1.move_to(positions[1][0] + positions[1][1])
        correct1_text = Text("Correct!\nRejected a\nfalse H\u2080", font_size=16, color=GREEN_3B1B)
        correct1_text.move_to(correct1)

        correct2 = Rectangle(
            width=cell_w, height=cell_h, fill_opacity=0.15,
            fill_color=GREEN_3B1B, stroke_color=GREEN_3B1B, stroke_width=2,
        )
        correct2.move_to(positions[2][0] + positions[2][1])
        correct2_text = Text("Correct!\nKept a\ntrue H\u2080", font_size=16, color=GREEN_3B1B)
        correct2_text.move_to(correct2)

        self.play(
            FadeIn(correct1), Write(correct1_text),
            FadeIn(correct2), Write(correct2_text),
            run_time=0.6,
        )
        self.wait(0.5)

        # TYPE I ERROR cell (top-left) — red
        type1_cell = Rectangle(
            width=cell_w, height=cell_h, fill_opacity=0.25,
            fill_color=RED_3B1B, stroke_color=RED_3B1B, stroke_width=3,
        )
        type1_cell.move_to(positions[0][0] + positions[0][1])
        type1_text = Text("TYPE I\nERROR", font_size=22, color=RED_3B1B, weight=BOLD)
        type1_text.move_to(type1_cell)

        self.play(FadeIn(type1_cell), Write(type1_text), run_time=0.6)
        self.wait(0.3)

        type1_desc = Text(
            "Rejected H\u2080 when it was actually TRUE",
            font_size=18, color=RED_3B1B,
        )
        type1_desc.next_to(VGroup(correct2, type1_cell), DOWN, buff=0.5)
        self.play(Write(type1_desc), run_time=0.5)
        self.wait(0.8)
        self.play(FadeOut(type1_desc), run_time=0.3)

        # TYPE II ERROR cell (bottom-right) — orange
        type2_cell = Rectangle(
            width=cell_w, height=cell_h, fill_opacity=0.25,
            fill_color=ORANGE_3B1B, stroke_color=ORANGE_3B1B, stroke_width=3,
        )
        type2_cell.move_to(positions[3][0] + positions[3][1])
        type2_text = Text("TYPE II\nERROR", font_size=22, color=ORANGE_3B1B, weight=BOLD)
        type2_text.move_to(type2_cell)

        self.play(FadeIn(type2_cell), Write(type2_text), run_time=0.6)
        self.wait(0.3)

        type2_desc = Text(
            "Failed to reject H\u2080 when it was actually FALSE",
            font_size=18, color=ORANGE_3B1B,
        )
        type2_desc.next_to(VGroup(correct2, type2_cell), DOWN, buff=0.5)
        self.play(Write(type2_desc), run_time=0.5)
        self.wait(0.8)
        self.play(FadeOut(type2_desc), run_time=0.3)

        # ========== MEMORY AIDS ==========
        self.play(
            *[FadeOut(mob) for mob in self.mobjects if mob is not title],
            run_time=0.5,
        )

        aid_title = Text("How to Remember", font_size=30, weight=BOLD, color=TEAL_3B1B)
        aid_title.next_to(title, DOWN, buff=0.4)

        aid1 = Text(
            'Type I  = "False Positive" = Reject a true H\u2080',
            font_size=22, color=RED_3B1B,
        )
        aid1.next_to(aid_title, DOWN, buff=0.4).align_to(LEFT * 4.5, LEFT)

        aid1b = Text(
            "  P(Type I error) = \u03b1 (significance level)",
            font_size=20, color=YELLOW_3B1B,
        )
        aid1b.next_to(aid1, DOWN, buff=0.12, aligned_edge=LEFT)

        aid2 = Text(
            'Type II = "False Negative" = Keep a false H\u2080',
            font_size=22, color=ORANGE_3B1B,
        )
        aid2.next_to(aid1b, DOWN, buff=0.3).align_to(aid1, LEFT)

        aid2b = Text(
            "  P(Type II error) = \u03b2",
            font_size=20, color=YELLOW_3B1B,
        )
        aid2b.next_to(aid2, DOWN, buff=0.12, aligned_edge=LEFT)

        self.play(Write(aid_title), run_time=0.4)
        self.play(Write(aid1), run_time=0.5)
        self.play(Write(aid1b), run_time=0.4)
        self.play(Write(aid2), run_time=0.5)
        self.play(Write(aid2b), run_time=0.4)
        self.wait(0.5)

        # Key rule box
        rule = Text(
            "Type I = rejecting truth    Type II = missing the truth",
            font_size=20, color=WHITE,
        )
        rule.to_edge(DOWN, buff=0.5)
        rule_box = SurroundingRectangle(rule, color=TEAL_3B1B, buff=0.2, corner_radius=0.1)
        self.play(Write(rule), Create(rule_box), run_time=0.5)
        self.wait(1.5)

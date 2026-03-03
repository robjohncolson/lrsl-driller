"""
Three Conditions for Inference (AP Stats Unit 6, Topic 6.2)

Builds a numbered checklist of the three conditions required before constructing
a confidence interval for a population proportion p:
  1. Random — data come from a random sample or randomized experiment
  2. 10% Condition — n <= 10% of N (approximate independence)
  3. Large Counts — np-hat >= 10 AND n(1-p-hat) >= 10 (approx Normal)
Shows a passing example (n=200, p-hat=0.35) and a failing example (n=20,
p-hat=0.10) for the Large Counts condition. Ends with a key insight box.

Run with: manim -qm --format=mp4 apstat_62_check_conditions.py CheckConditions
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class CheckConditions(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Three Conditions for Inference", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Before constructing a confidence interval for p",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== CONDITION 1: RANDOM ==========
        cond1_num = Text("1.", font_size=30, weight=BOLD, color=BLUE_3B1B)
        cond1_label = Text("Random", font_size=30, weight=BOLD, color=BLUE_3B1B)
        cond1_header = VGroup(cond1_num, cond1_label).arrange(RIGHT, buff=0.15)
        cond1_header.next_to(subtitle, DOWN, buff=0.45).align_to(LEFT * 4.5, LEFT)

        cond1_desc = Text(
            "The data come from a random sample",
            font_size=22,
        )
        cond1_desc.next_to(cond1_header, DOWN, buff=0.12, aligned_edge=LEFT)

        cond1_desc2 = Text(
            "or a randomized experiment.",
            font_size=22,
        )
        cond1_desc2.next_to(cond1_desc, DOWN, buff=0.06, aligned_edge=LEFT)

        # SRS icon: small box with "SRS" inside
        srs_box_text = Text("SRS", font_size=20, color=YELLOW_3B1B, weight=BOLD)
        srs_box_rect = SurroundingRectangle(
            srs_box_text, color=YELLOW_3B1B, buff=0.1, corner_radius=0.05,
        )
        srs_icon = VGroup(srs_box_rect, srs_box_text)
        srs_icon.next_to(cond1_desc2, DOWN, buff=0.12, aligned_edge=LEFT)

        srs_note = Text(
            "Random selection eliminates bias",
            font_size=18, color=GREY_B,
        )
        srs_note.next_to(srs_icon, RIGHT, buff=0.2)

        self.play(Write(cond1_header), run_time=0.5)
        self.play(Write(cond1_desc), Write(cond1_desc2), run_time=0.6)
        self.play(FadeIn(srs_icon), Write(srs_note), run_time=0.5)
        self.wait(0.5)

        # Checkmark for condition 1
        cond1_check = Text("--", font_size=26, color=ManimColor(GREEN_3B1B), weight=BOLD)
        cond1_check.next_to(cond1_header, RIGHT, buff=0.3)
        self.play(Write(cond1_check), run_time=0.3)

        # Group condition 1
        cond1_group = VGroup(
            cond1_header, cond1_desc, cond1_desc2, srs_icon, srs_note, cond1_check,
        )

        # Shrink condition 1 to make room
        self.play(
            cond1_group.animate.scale(0.7).next_to(subtitle, DOWN, buff=0.3).align_to(LEFT * 5.5, LEFT),
            run_time=0.5,
        )

        # ========== CONDITION 2: 10% CONDITION ==========
        cond2_num = Text("2.", font_size=30, weight=BOLD, color=TEAL_3B1B)
        cond2_label = Text("10% Condition", font_size=30, weight=BOLD, color=TEAL_3B1B)
        cond2_header = VGroup(cond2_num, cond2_label).arrange(RIGHT, buff=0.15)
        cond2_header.next_to(cond1_group, DOWN, buff=0.3).align_to(cond1_group, LEFT)

        cond2_formula = MathTex(
            r"n \leq 0.10 \times N",
            font_size=34, color=BLUE,
        )
        cond2_formula.next_to(cond2_header, DOWN, buff=0.15, aligned_edge=LEFT)

        self.play(Write(cond2_header), run_time=0.5)
        self.play(Write(cond2_formula), run_time=0.5)
        self.wait(0.3)

        # Example: n=100, N=5000
        ex_10pct = MathTex(
            r"n = 100, \quad N = 5000",
            font_size=26,
        )
        ex_10pct.next_to(cond2_formula, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(ex_10pct), run_time=0.4)

        ex_10pct_check = MathTex(
            r"100 \leq 500",
            font_size=26, color=ManimColor(GREEN_3B1B),
        )
        check_mark_10 = Text(" Pass", font_size=22, color=ManimColor(GREEN_3B1B), weight=BOLD)
        ex_10pct_result = VGroup(ex_10pct_check, check_mark_10).arrange(RIGHT, buff=0.1)
        ex_10pct_result.next_to(ex_10pct, DOWN, buff=0.1, aligned_edge=LEFT)
        self.play(Write(ex_10pct_result), run_time=0.4)
        self.wait(0.3)

        # Note about independence
        cond2_note = Text(
            "Ensures approximate independence when",
            font_size=18, color=GREY_B,
        )
        cond2_note2 = Text(
            "sampling without replacement",
            font_size=18, color=GREY_B,
        )
        cond2_note.next_to(ex_10pct_result, DOWN, buff=0.1, aligned_edge=LEFT)
        cond2_note2.next_to(cond2_note, DOWN, buff=0.04, aligned_edge=LEFT)
        self.play(Write(cond2_note), Write(cond2_note2), run_time=0.5)
        self.wait(0.5)

        # Group condition 2
        cond2_group = VGroup(
            cond2_header, cond2_formula, ex_10pct, ex_10pct_result,
            cond2_note, cond2_note2,
        )

        # Shrink conditions 1 and 2 together
        self.play(
            cond1_group.animate.scale(0.85).to_corner(UL, buff=0.3).shift(DOWN * 0.5),
            cond2_group.animate.scale(0.7).next_to(
                cond1_group.copy().scale(0.85).to_corner(UL, buff=0.3).shift(DOWN * 0.5),
                DOWN, buff=0.15,
            ).align_to(LEFT * 5.5, LEFT),
            run_time=0.6,
        )

        # ========== CONDITION 3: LARGE COUNTS ==========
        cond3_num = Text("3.", font_size=30, weight=BOLD, color=PINK_3B1B)
        cond3_label = Text("Large Counts", font_size=30, weight=BOLD, color=PINK_3B1B)
        cond3_header = VGroup(cond3_num, cond3_label).arrange(RIGHT, buff=0.15)
        cond3_header.move_to(UP * 0.8 + RIGHT * 1.5)

        cond3_formula_np = MathTex(r"n\hat{p} \geq 10", font_size=34, color=BLUE)
        cond3_and = Text("AND", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        cond3_formula_nq = MathTex(r"n(1-\hat{p}) \geq 10", font_size=34, color=BLUE)
        cond3_formulas = VGroup(cond3_formula_np, cond3_and, cond3_formula_nq).arrange(
            RIGHT, buff=0.3,
        )
        cond3_formulas.next_to(cond3_header, DOWN, buff=0.2)

        self.play(Write(cond3_header), run_time=0.5)
        self.play(Write(cond3_formula_np), run_time=0.4)
        self.play(Write(cond3_and), run_time=0.2)
        self.play(Write(cond3_formula_nq), run_time=0.4)
        self.wait(0.3)

        # --- PASSING example: n=200, p-hat=0.35 ---
        pass_title = Text(
            "Example: n = 200, p-hat = 0.35",
            font_size=24, color=ManimColor(GREEN_3B1B),
        )
        pass_title.next_to(cond3_formulas, DOWN, buff=0.35)

        pass_np = MathTex(r"200(0.35) = 70", font_size=26)
        pass_np_check = MathTex(r"\geq 10", font_size=26, color=ManimColor(GREEN_3B1B))
        pass_np_mark = Text(" Pass", font_size=20, color=ManimColor(GREEN_3B1B), weight=BOLD)
        pass_np_row = VGroup(pass_np, pass_np_check, pass_np_mark).arrange(RIGHT, buff=0.15)
        pass_np_row.next_to(pass_title, DOWN, buff=0.15)

        pass_nq = MathTex(r"200(0.65) = 130", font_size=26)
        pass_nq_check = MathTex(r"\geq 10", font_size=26, color=ManimColor(GREEN_3B1B))
        pass_nq_mark = Text(" Pass", font_size=20, color=ManimColor(GREEN_3B1B), weight=BOLD)
        pass_nq_row = VGroup(pass_nq, pass_nq_check, pass_nq_mark).arrange(RIGHT, buff=0.15)
        pass_nq_row.next_to(pass_np_row, DOWN, buff=0.1)

        self.play(Write(pass_title), run_time=0.4)
        self.play(Write(pass_np_row), run_time=0.5)
        self.play(Write(pass_nq_row), run_time=0.5)

        # Note
        cond3_note = Text(
            "Ensures the sampling distribution is approximately Normal",
            font_size=18, color=GREY_B,
        )
        cond3_note.next_to(pass_nq_row, DOWN, buff=0.15)
        self.play(Write(cond3_note), run_time=0.5)
        self.wait(0.5)

        # --- FAILING example: n=20, p-hat=0.10 ---
        pass_section = VGroup(pass_title, pass_np_row, pass_nq_row, cond3_note)
        self.play(FadeOut(pass_section), run_time=0.4)

        fail_title = Text(
            "Example: n = 20, p-hat = 0.10",
            font_size=24, color=RED,
        )
        fail_title.next_to(cond3_formulas, DOWN, buff=0.35)

        fail_np = MathTex(r"20(0.10) = 2", font_size=26)
        fail_np_check = MathTex(r"< 10", font_size=26, color=RED)
        fail_np_mark = Text(" Fail", font_size=20, color=RED, weight=BOLD)
        fail_np_row = VGroup(fail_np, fail_np_check, fail_np_mark).arrange(RIGHT, buff=0.15)
        fail_np_row.next_to(fail_title, DOWN, buff=0.15)

        fail_nq = MathTex(r"20(0.90) = 18", font_size=26)
        fail_nq_check = MathTex(r"\geq 10", font_size=26, color=ManimColor(GREEN_3B1B))
        fail_nq_mark = Text(" Pass", font_size=20, color=ManimColor(GREEN_3B1B), weight=BOLD)
        fail_nq_row = VGroup(fail_nq, fail_nq_check, fail_nq_mark).arrange(RIGHT, buff=0.15)
        fail_nq_row.next_to(fail_np_row, DOWN, buff=0.1)

        self.play(Write(fail_title), run_time=0.4)
        self.play(Write(fail_np_row), run_time=0.5)

        # Flash red on the failure
        fail_flash = SurroundingRectangle(fail_np_row, color=RED, buff=0.1)
        self.play(Create(fail_flash), run_time=0.3)
        self.play(FadeOut(fail_flash), run_time=0.3)

        self.play(Write(fail_nq_row), run_time=0.5)
        self.wait(0.3)

        # Verdict
        fail_verdict = Text(
            "One condition fails -- Cannot use Normal model!",
            font_size=22, color=RED, weight=BOLD,
        )
        fail_verdict.next_to(fail_nq_row, DOWN, buff=0.2)
        self.play(Write(fail_verdict), run_time=0.5)
        self.wait(0.8)

        # ========== CLEAR EVERYTHING FOR KEY INSIGHT ==========
        fail_section = VGroup(
            fail_title, fail_np_row, fail_nq_row, fail_verdict,
        )
        cond3_section = VGroup(cond3_header, cond3_formulas)

        self.play(
            FadeOut(fail_section),
            FadeOut(cond3_section),
            FadeOut(cond1_group),
            FadeOut(cond2_group),
            FadeOut(title),
            FadeOut(subtitle),
            run_time=0.5,
        )

        # ========== KEY INSIGHT BOX ==========
        insight_content = VGroup(
            Text(
                "Three Conditions for a CI for p",
                font_size=32, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=6),  # spacer
            VGroup(
                Text("1. Random", font_size=26, color=BLUE_3B1B, weight=BOLD),
                Text("   Data from random sample / randomized experiment", font_size=20),
            ).arrange(DOWN, buff=0.04, aligned_edge=LEFT),
            Text("", font_size=4),  # spacer
            VGroup(
                Text("2. 10% Condition", font_size=26, color=TEAL_3B1B, weight=BOLD),
                MathTex(r"n \leq 0.10 \times N", font_size=28),
            ).arrange(DOWN, buff=0.04, aligned_edge=LEFT),
            Text("", font_size=4),  # spacer
            VGroup(
                Text("3. Large Counts", font_size=26, color=PINK_3B1B, weight=BOLD),
                MathTex(
                    r"n\hat{p} \geq 10 \quad \text{AND} \quad n(1-\hat{p}) \geq 10",
                    font_size=28,
                ),
            ).arrange(DOWN, buff=0.04, aligned_edge=LEFT),
            Text("", font_size=6),  # spacer
            Text(
                "ALL three conditions must be met",
                font_size=26, color=RED, weight=BOLD,
            ),
            Text(
                "before constructing a CI.",
                font_size=26, color=RED, weight=BOLD,
            ),
        ).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        insight_content.move_to(ORIGIN)

        box = SurroundingRectangle(
            insight_content, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.2,
            ),
            run_time=3.0,
        )
        self.play(Create(box))
        self.wait(2)

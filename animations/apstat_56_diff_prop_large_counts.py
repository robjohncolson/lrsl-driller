"""
Large Counts Condition for Two Proportions (AP Stats Unit 5, Topic 5.6)

Demonstrates the Large Counts Condition when comparing two population proportions.
Instead of 2 checks (single proportion), we need ALL FOUR inequalities satisfied:
  n1*p1 >= 10, n1*(1-p1) >= 10, n2*p2 >= 10, n2*(1-p2) >= 10
Walks through a PASSING example (p1=0.60, n1=100, p2=0.45, n2=120) with green
checkmarks, then a FAILING example (p1=0.03, n1=80, p2=0.45, n2=100) where the
first check fails with a red X. Ends with a key insight box emphasizing that ALL
FOUR conditions must hold, and compares to the single-proportion case.

Run with: manim -qm --format=mp4 apstat_56_diff_prop_large_counts.py DiffPropLargeCounts
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class DiffPropLargeCounts(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Large Counts: Two Proportions", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== CHECKLIST: THE 4 CONDITIONS ==========
        checklist_header = Text(
            "Four conditions must ALL hold:",
            font_size=26, color=TEAL_3B1B,
        )
        checklist_header.next_to(title, DOWN, buff=0.3)
        self.play(Write(checklist_header), run_time=0.5)

        cond_texts = [
            r"n_1 \hat{p}_1 \geq 10",
            r"n_1 (1 - \hat{p}_1) \geq 10",
            r"n_2 \hat{p}_2 \geq 10",
            r"n_2 (1 - \hat{p}_2) \geq 10",
        ]

        checklist_items = VGroup()
        for i, tex_str in enumerate(cond_texts):
            bullet = Text("-", font_size=28, color=YELLOW_3B1B)
            formula = MathTex(tex_str, font_size=32, color=BLUE)
            row = VGroup(bullet, formula).arrange(RIGHT, buff=0.2)
            checklist_items.add(row)

        checklist_items.arrange(DOWN, aligned_edge=LEFT, buff=0.18)
        checklist_items.next_to(checklist_header, DOWN, buff=0.25)

        self.play(
            LaggedStart(
                *[FadeIn(item, shift=RIGHT * 0.3) for item in checklist_items],
                lag_ratio=0.15,
            ),
            run_time=1.2,
        )
        self.wait(0.6)

        # Box the checklist
        checklist_box = SurroundingRectangle(
            VGroup(checklist_header, checklist_items),
            color=BLUE_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(checklist_box), run_time=0.4)
        self.wait(0.4)

        # ========== TRANSITION: Clear checklist ==========
        checklist_group = VGroup(checklist_header, checklist_items, checklist_box)
        self.play(
            FadeOut(checklist_group),
            run_time=0.5,
        )

        # ========== EXAMPLE 1: PASSES ==========
        ex1_title = Text(
            "Passing Example", font_size=32, color=ManimColor(GREEN_3B1B), weight=BOLD,
        )
        ex1_title.next_to(title, DOWN, buff=0.25)
        self.play(Write(ex1_title), run_time=0.4)

        ex1_params = MathTex(
            r"p_1 = 0.60,\; n_1 = 100,\quad p_2 = 0.45,\; n_2 = 120",
            font_size=28, color=TEAL_3B1B,
        )
        ex1_params.next_to(ex1_title, DOWN, buff=0.2)
        self.play(Write(ex1_params), run_time=0.6)
        self.wait(0.3)

        # Build the 4 checks for passing example
        pass_checks = [
            (r"100(0.60) = 60", 60, True),
            (r"100(0.40) = 40", 40, True),
            (r"120(0.45) = 54", 54, True),
            (r"120(0.55) = 66", 66, True),
        ]

        check_labels = [
            r"n_1 p_1:",
            r"n_1(1-p_1):",
            r"n_2 p_2:",
            r"n_2(1-p_2):",
        ]

        pass_rows = VGroup()
        for i, ((calc_str, result_val, passes), label_str) in enumerate(
            zip(pass_checks, check_labels)
        ):
            label = MathTex(label_str, font_size=24, color=GREY_B)
            calc = MathTex(calc_str, font_size=26)
            check_icon = Text(
                " >=10 ",
                font_size=22, color=ManimColor(GREEN_3B1B), weight=BOLD,
            )
            checkmark = MathTex(r"\checkmark", font_size=36, color=ManimColor(GREEN_3B1B))
            row = VGroup(label, calc, check_icon, checkmark).arrange(RIGHT, buff=0.2)
            pass_rows.add(row)

        pass_rows.arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        pass_rows.next_to(ex1_params, DOWN, buff=0.3)

        # Animate each check one at a time
        for i, row in enumerate(pass_rows):
            label, calc, check_icon, checkmark = row
            self.play(Write(label), run_time=0.25)
            self.play(Write(calc), run_time=0.35)
            self.play(
                Write(check_icon),
                FadeIn(checkmark, scale=1.5),
                run_time=0.3,
            )
            self.wait(0.1)

        # All pass verdict
        pass_verdict = Text(
            "All four pass -- condition is met!",
            font_size=26, color=ManimColor(GREEN_3B1B), weight=BOLD,
        )
        pass_verdict.next_to(pass_rows, DOWN, buff=0.25)
        pass_verdict_box = SurroundingRectangle(
            pass_verdict, color=ManimColor(GREEN_3B1B), buff=0.15, corner_radius=0.1,
        )
        self.play(Write(pass_verdict), Create(pass_verdict_box), run_time=0.5)
        self.wait(0.6)

        # ========== CLEAR EXAMPLE 1 ==========
        ex1_all = VGroup(ex1_title, ex1_params, pass_rows, pass_verdict, pass_verdict_box)
        self.play(FadeOut(ex1_all), run_time=0.5)

        # ========== EXAMPLE 2: FAILS ==========
        ex2_title = Text(
            "Failing Example", font_size=32, color=RED, weight=BOLD,
        )
        ex2_title.next_to(title, DOWN, buff=0.25)
        self.play(Write(ex2_title), run_time=0.4)

        ex2_params = MathTex(
            r"p_1 = 0.03,\; n_1 = 80,\quad p_2 = 0.45,\; n_2 = 100",
            font_size=28, color=TEAL_3B1B,
        )
        ex2_params.next_to(ex2_title, DOWN, buff=0.2)
        self.play(Write(ex2_params), run_time=0.6)
        self.wait(0.3)

        fail_checks = [
            (r"80(0.03) = 2.4", 2.4, False),
            (r"80(0.97) = 77.6", 77.6, True),
            (r"100(0.45) = 45", 45, True),
            (r"100(0.55) = 55", 55, True),
        ]

        fail_rows = VGroup()
        for i, ((calc_str, result_val, passes), label_str) in enumerate(
            zip(fail_checks, check_labels)
        ):
            label = MathTex(label_str, font_size=24, color=GREY_B)
            calc = MathTex(calc_str, font_size=26)
            if passes:
                status_text = Text(
                    " >=10 ",
                    font_size=22, color=ManimColor(GREEN_3B1B), weight=BOLD,
                )
                icon = MathTex(r"\checkmark", font_size=36, color=ManimColor(GREEN_3B1B))
            else:
                status_text = Text(
                    " < 10 ",
                    font_size=22, color=RED, weight=BOLD,
                )
                icon = MathTex(r"\times", font_size=36, color=RED)
            row = VGroup(label, calc, status_text, icon).arrange(RIGHT, buff=0.2)
            fail_rows.add(row)

        fail_rows.arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        fail_rows.next_to(ex2_params, DOWN, buff=0.3)

        # Animate each check
        for i, row in enumerate(fail_rows):
            label, calc, status_text, icon = row
            self.play(Write(label), run_time=0.25)
            self.play(Write(calc), run_time=0.35)
            if i == 0:
                # Failing check -- emphasize with flash
                self.play(
                    Write(status_text),
                    FadeIn(icon, scale=1.8),
                    run_time=0.4,
                )
                flash_box = SurroundingRectangle(row, color=RED, buff=0.08)
                self.play(Create(flash_box), run_time=0.3)
                self.play(FadeOut(flash_box), run_time=0.3)
            else:
                self.play(
                    Write(status_text),
                    FadeIn(icon, scale=1.5),
                    run_time=0.3,
                )
            self.wait(0.1)

        # Fail verdict
        fail_verdict = Text(
            "One fails -- condition is NOT met!",
            font_size=26, color=RED, weight=BOLD,
        )
        fail_verdict.next_to(fail_rows, DOWN, buff=0.25)
        fail_verdict_box = SurroundingRectangle(
            fail_verdict, color=RED, buff=0.15, corner_radius=0.1,
        )
        self.play(Write(fail_verdict), Create(fail_verdict_box), run_time=0.5)
        self.wait(0.6)

        # ========== CLEAR EVERYTHING FOR KEY INSIGHT ==========
        ex2_all = VGroup(ex2_title, ex2_params, fail_rows, fail_verdict, fail_verdict_box)
        self.play(FadeOut(ex2_all), FadeOut(title), run_time=0.5)

        # ========== KEY INSIGHT BOX ==========
        insight_content = VGroup(
            Text(
                "Large Counts: Two Proportions",
                font_size=32, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=6),  # spacer
            Text(
                "ALL FOUR must be >= 10",
                font_size=28, color=RED, weight=BOLD,
            ),
            Text("", font_size=6),  # spacer
            Text(
                "Failing even ONE means the condition is NOT met",
                font_size=24, color=PINK_3B1B,
            ),
            Text("", font_size=8),  # spacer
            # Comparison line
            Text(
                "Single proportion: 2 checks",
                font_size=24, color=GREY_B,
            ),
            Text(
                "Two proportions: 4 checks",
                font_size=24, color=TEAL_3B1B, weight=BOLD,
            ),
            Text("", font_size=8),  # spacer
            Text(
                "When satisfied: the sampling distribution of",
                font_size=22,
            ),
            VGroup(
                MathTex(r"\hat{p}_1 - \hat{p}_2", font_size=30, color=BLUE),
                Text(" is approximately Normal.", font_size=22, color=ManimColor(GREEN_3B1B)),
            ).arrange(RIGHT, buff=0.12),
        ).arrange(DOWN, buff=0.1)
        insight_content.move_to(ORIGIN)

        insight_box = SurroundingRectangle(
            insight_content, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.18,
            ),
            run_time=3.0,
        )
        self.play(Create(insight_box))
        self.wait(2)

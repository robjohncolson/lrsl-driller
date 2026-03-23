"""
Animate the three conditions for a chi-square test with checkmark confirmations.

Render:
manim -qm --format=mp4 animations/apstat_85_check_conditions.py CheckConditions
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class CheckConditions(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Checking Conditions", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "Three conditions must hold before running the test",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- Condition boxes ---
        box_w = 12.5
        box_h = 0.75

        def make_condition_row(y_pos, num, label_text, detail_text, color):
            box = RoundedRectangle(
                corner_radius=0.15, width=box_w, height=box_h,
                stroke_color=color, stroke_width=3,
            )
            box.set_fill(color, opacity=0.06)
            box.move_to(UP * y_pos)

            num_label = Text(
                f"{num}.", font_size=26, color=color, weight=BOLD,
            )
            cond_label = Text(label_text, font_size=26, color=WHITE, weight=BOLD)
            cond_detail = Text(detail_text, font_size=22, color=GRAY_B)
            row = VGroup(num_label, cond_label, cond_detail).arrange(RIGHT, buff=0.2)
            row.move_to(box.get_center())

            check = Text("\u2713", font_size=34, color=GREEN_3B1B, weight=BOLD)
            check.next_to(box, RIGHT, buff=0.2)

            return box, row, check

        # Condition 1: Random
        c1_box, c1_row, c1_check = make_condition_row(
            0.95, 1, "Random:",
            "Data come from random sample or experiment",
            BLUE_3B1B,
        )

        # Condition 2: 10% rule
        c2_box, c2_row, c2_check = make_condition_row(
            0.05, 2, "10% Condition:",
            "n \u2264 10% of the population",
            TEAL_3B1B,
        )

        # Condition 3: Large Counts
        c3_box, c3_row, c3_check = make_condition_row(
            -0.85, 3, "Large Counts:",
            "All expected counts \u2265 5",
            PINK_3B1B,
        )

        # --- School example verification ---
        example_box = RoundedRectangle(
            corner_radius=0.2, width=12.0, height=2.4,
            stroke_color=GREEN_3B1B, stroke_width=4,
        )
        example_box.set_fill(GREEN_3B1B, opacity=0.06)
        example_box.to_edge(DOWN, buff=0.35)

        ex_title = Text(
            "School Type Example", font_size=24, color=GREEN_3B1B, weight=BOLD,
        )
        ex_title.move_to(example_box.get_top() + DOWN * 0.25)

        ex_10pct = Text(
            "10%: 320 \u2264 10% of all 2019 parents  \u2713",
            font_size=22, color=WHITE,
        )

        ex_counts_label = Text(
            "Expected counts: 257.1, 22.0, 40.7, 171.9, 14.8, 27.3",
            font_size=22, color=WHITE,
        )

        ex_counts_check = Text(
            "All > 5  \u2713",
            font_size=22, color=GREEN_3B1B, weight=BOLD,
        )

        ex_stack = VGroup(ex_10pct, ex_counts_label, ex_counts_check).arrange(
            DOWN, buff=0.18, aligned_edge=LEFT,
        )
        ex_stack.next_to(ex_title, DOWN, buff=0.22)

        # --- animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)

        # Condition 1
        self.play(DrawBorderThenFill(c1_box), Write(c1_row), run_time=1.2)
        self.play(FadeIn(c1_check, scale=1.5), run_time=0.5)

        # Condition 2
        self.play(DrawBorderThenFill(c2_box), Write(c2_row), run_time=1.2)
        self.play(FadeIn(c2_check, scale=1.5), run_time=0.5)

        # Condition 3
        self.play(DrawBorderThenFill(c3_box), Write(c3_row), run_time=1.2)
        self.play(FadeIn(c3_check, scale=1.5), run_time=0.5)

        # Example verification
        self.play(DrawBorderThenFill(example_box), Write(ex_title), run_time=0.8)
        self.play(
            LaggedStart(
                FadeIn(ex_10pct, shift=RIGHT * 0.15),
                FadeIn(ex_counts_label, shift=RIGHT * 0.15),
                FadeIn(ex_counts_check, shift=RIGHT * 0.15),
                lag_ratio=0.35, run_time=2.0,
            )
        )
        self.wait(1.8)

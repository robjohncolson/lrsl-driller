"""
Compute the chi-square test statistic from a two-way table (school type data).

Render:
manim -qm --format=mp4 animations/apstat_86_chi_square_statistic_twoway.py ChiSquareStatisticTwoWay
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ChiSquareStatisticTwoWay(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Computing the Chi-Square Statistic", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "School type \u00d7 Year two-way table",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- Formula ---
        formula_box = RoundedRectangle(
            corner_radius=0.15, width=8.0, height=0.8,
            stroke_color=BLUE_3B1B, stroke_width=3,
        )
        formula_box.set_fill(BLUE_3B1B, opacity=0.06)
        formula_box.shift(UP * 1.05)

        formula = Text(
            "\u03c7\u00b2 = \u03a3 (Observed \u2212 Expected)\u00b2 / Expected",
            font_size=26,
        )
        formula.move_to(formula_box.get_center())

        # --- Cell contributions ---
        cells = [
            ("Public / 2019", "266", "257.1", "0.31"),
            ("Public / 2020", "163", "171.9", "0.46"),
            ("Private / 2019", "14", "22.0", "2.93"),
            ("Private / 2020", "23", "14.8", "4.58"),
        ]

        contrib_rows = VGroup()
        for label, obs, exp, contrib in cells:
            lbl = Text(label + ":", font_size=22, color=TEAL_3B1B, weight=BOLD)
            lbl.set_width(2.8)
            calc = Text(
                f"({obs} \u2212 {exp})\u00b2 / {exp} = {contrib}",
                font_size=24,
            )
            row = VGroup(lbl, calc).arrange(RIGHT, buff=0.3)
            contrib_rows.add(row)

        contrib_rows.arrange(DOWN, buff=0.22, aligned_edge=LEFT)
        contrib_rows.shift(DOWN * 0.55)

        # --- Remaining cells note ---
        dots_text = Text(
            "+ Charter/2019 (0.01) + Charter/2020 (0.00) \u2192 small",
            font_size=20,
            color=GRAY_B,
        )
        dots_text.next_to(contrib_rows, DOWN, buff=0.22)

        # --- Final sum ---
        sum_box = RoundedRectangle(
            corner_radius=0.15, width=6.5, height=0.7,
            stroke_color=GREEN_3B1B, stroke_width=3,
        )
        sum_box.set_fill(GREEN_3B1B, opacity=0.08)
        sum_box.to_edge(DOWN, buff=0.4)

        sum_text = Text(
            "\u03c7\u00b2 = 0.31 + 0.46 + 2.93 + 4.58 + \u2026 = 7.746",
            font_size=26,
        )
        sum_text.move_to(sum_box.get_center())

        # --- Animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)

        self.play(
            DrawBorderThenFill(formula_box), Write(formula), run_time=1.4,
        )

        self.play(
            LaggedStart(
                *[FadeIn(r, shift=RIGHT * 0.15) for r in contrib_rows],
                lag_ratio=0.3, run_time=3.5,
            )
        )

        self.play(FadeIn(dots_text, shift=UP * 0.1), run_time=0.6)

        self.play(
            DrawBorderThenFill(sum_box), Write(sum_text), run_time=1.2,
        )

        self.play(
            sum_box.animate.set_stroke(YELLOW_3B1B, width=5),
            run_time=0.6,
        )
        self.wait(1.8)

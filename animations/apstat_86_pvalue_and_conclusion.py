"""
Show the p-value on a chi-square distribution and draw a conclusion.

Render:
manim -qm --format=mp4 animations/apstat_86_pvalue_and_conclusion.py PValueAndConclusion
"""
from manim import *
import numpy as np

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


def chi2_pdf(x, k=2):
    """Chi-square PDF with k degrees of freedom (k=2 simplifies to exp)."""
    if x <= 0:
        return 0.0
    # For df=2: f(x) = 0.5 * exp(-x/2)
    return 0.5 * np.exp(-x / 2)


class PValueAndConclusion(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("P-Value and Conclusion", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "\u03c7\u00b2 = 7.746,  df = 2",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- Axes ---
        axes = Axes(
            x_range=[0, 14, 2],
            y_range=[0, 0.55, 0.1],
            x_length=8.5,
            y_length=3.0,
            axis_config={"color": GRAY_B, "stroke_width": 2},
            tips=False,
        )
        axes.shift(DOWN * 0.15)

        x_label = Text("\u03c7\u00b2", font_size=26)
        x_label.next_to(axes.x_axis.get_end(), DOWN, buff=0.15)

        curve = axes.plot(
            lambda x: chi2_pdf(x), x_range=[0.05, 13.5, 0.05], color=BLUE_3B1B,
        )

        # Shaded tail region beyond 7.746
        tail_area = axes.get_area(
            curve, x_range=[7.746, 13.5], color=PINK_3B1B, opacity=0.4,
        )

        # Dashed vertical line at chi-square statistic
        stat_x = axes.c2p(7.746, 0)
        stat_top = axes.c2p(7.746, chi2_pdf(7.746))
        dashed_line = DashedLine(stat_x, stat_top, color=YELLOW_3B1B, stroke_width=2)

        stat_label = Text("\u03c7\u00b2 = 7.746", font_size=22, color=YELLOW_3B1B)
        stat_label.next_to(dashed_line, UP, buff=0.12)

        # --- P-value annotation ---
        pval_text = Text(
            "p-value = 0.0208", font_size=26, color=PINK_3B1B, weight=BOLD,
        )
        pval_text.next_to(tail_area, UR, buff=0.2)

        # --- Comparison box ---
        comp_box = RoundedRectangle(
            corner_radius=0.15, width=8.0, height=0.65,
            stroke_color=TEAL_3B1B, stroke_width=3,
        )
        comp_box.set_fill(TEAL_3B1B, opacity=0.06)
        comp_box.to_edge(DOWN, buff=1.25)

        comp_text = Text(
            "0.0208 < 0.05 = \u03b1   \u2192   Reject H\u2080",
            font_size=24, color=WHITE,
        )
        comp_text.move_to(comp_box.get_center())

        # --- Conclusion ---
        conclusion_box = RoundedRectangle(
            corner_radius=0.15, width=12.0, height=0.7,
            stroke_color=GREEN_3B1B, stroke_width=3,
        )
        conclusion_box.set_fill(GREEN_3B1B, opacity=0.06)
        conclusion_box.to_edge(DOWN, buff=0.35)

        conclusion = Text(
            "Convincing evidence that school type distribution differs\nbetween 2019 and 2020.",
            font_size=22, color=WHITE, line_spacing=1.3,
        )
        conclusion.move_to(conclusion_box.get_center())

        # --- Animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)

        self.play(Create(axes), Write(x_label), run_time=0.8)
        self.play(Create(curve), run_time=1.0)

        self.play(Create(dashed_line), FadeIn(stat_label), run_time=0.8)
        self.play(FadeIn(tail_area), run_time=0.8)
        self.play(Write(pval_text), run_time=0.7)

        self.play(
            DrawBorderThenFill(comp_box), Write(comp_text), run_time=1.0,
        )

        self.play(
            DrawBorderThenFill(conclusion_box), Write(conclusion), run_time=1.4,
        )
        self.wait(1.8)

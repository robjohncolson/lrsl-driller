"""
Visualize the two-sample z test statistic for a difference in proportions.

Run with: manim -qm --format=mp4 animations/apstat_611_test_statistic.py TestStatistic611
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class TestStatistic611(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Two-Proportion z Statistic", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        formula_box = RoundedRectangle(
            corner_radius=0.2, width=12.2, height=1.4,
            stroke_color=BLUE_3B1B, stroke_width=4
        ).set_fill(BLUE_3B1B, opacity=0.10)
        formula_box.shift(UP * 1.1)
        formula = Text(
            "z = ((p̂1 - p̂2) - 0) / sqrt[p̂c(1-p̂c)(1/n1 + 1/n2)]",
            font_size=28,
            color=BLUE_3B1B,
            weight=BOLD,
        ).move_to(formula_box.get_center())

        diff_box = RoundedRectangle(
            corner_radius=0.18, width=5.2, height=1.2,
            stroke_color=YELLOW_3B1B, stroke_width=4
        ).set_fill(YELLOW_3B1B, opacity=0.10)
        diff_box.shift(LEFT * 3.3 + DOWN * 0.9)
        diff_text = VGroup(
            Text("Observed difference", font_size=24, color=WHITE),
            Text("0.134", font_size=34, color=YELLOW_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.15).move_to(diff_box.get_center())

        se_box = RoundedRectangle(
            corner_radius=0.18, width=5.2, height=1.2,
            stroke_color=TEAL_3B1B, stroke_width=4
        ).set_fill(TEAL_3B1B, opacity=0.10)
        se_box.shift(RIGHT * 3.3 + DOWN * 0.9)
        se_text = VGroup(
            Text("Pooled SE", font_size=24, color=WHITE),
            Text("0.0595", font_size=34, color=TEAL_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.15).move_to(se_box.get_center())

        arrow = Arrow(
            start=LEFT * 1.2 + DOWN * 2.0,
            end=RIGHT * 1.2 + DOWN * 2.0,
            color=GREEN_3B1B,
            stroke_width=6,
            buff=0.1,
        )
        divide_label = Text("standardize the difference", font_size=24, color=GREEN_3B1B)
        divide_label.next_to(arrow, DOWN, buff=0.18)

        result_box = RoundedRectangle(
            corner_radius=0.2, width=5.6, height=1.3,
            stroke_color=PINK_3B1B, stroke_width=4
        ).set_fill(PINK_3B1B, opacity=0.10)
        result_box.shift(DOWN * 3.0)
        result_text = VGroup(
            Text("z tells how unusual", font_size=22),
            Text("2.25 standard errors", font_size=30, color=PINK_3B1B, weight=BOLD),
            Text("above 0 the sample difference is", font_size=22),
        ).arrange(DOWN, buff=0.08).move_to(result_box.get_center())

        self.play(FadeIn(title, shift=DOWN))
        self.play(Create(formula_box), Write(formula))
        self.play(Create(diff_box), FadeIn(diff_text, shift=UP * 0.2))
        self.play(Create(se_box), FadeIn(se_text, shift=UP * 0.2))
        self.play(GrowArrow(arrow), FadeIn(divide_label, shift=UP * 0.1))
        self.play(Create(result_box), FadeIn(result_text, shift=UP * 0.2))
        self.wait(2)

"""
Build one chi-square contribution step by step.

Render:
manim -qm --format=mp4 animations/apstat_81_chi_square_contribution.py ChiSquareContribution
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ChiSquareContribution(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("One Chi-Square Contribution", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "Use one category at a time: (Observed - Expected)^2 / Expected",
            font_size=24,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        formula_box = RoundedRectangle(
            corner_radius=0.2,
            width=9.8,
            height=1.5,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        formula_box.set_fill(YELLOW_3B1B, opacity=0.1)
        formula_box.shift(UP * 1.2)
        formula_text = Text(
            "Contribution = (O - E)^2 / E",
            font_size=30,
            color=YELLOW_3B1B,
            weight=BOLD,
        )
        formula_text.move_to(formula_box.get_center())

        value_box = RoundedRectangle(
            corner_radius=0.2,
            width=5.2,
            height=1.5,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        value_box.set_fill(BLUE_3B1B, opacity=0.12)
        value_box.shift(UP * 0.05)
        value_text = Text("Observed = 13, Expected = 10", font_size=26, color=BLUE_3B1B, weight=BOLD)
        value_text.move_to(value_box.get_center())

        step1 = RoundedRectangle(
            corner_radius=0.18,
            width=3.0,
            height=1.35,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        step1.set_fill(TEAL_3B1B, opacity=0.12)
        step1.shift(LEFT * 3.4 + DOWN * 2.0)
        step1_text = VGroup(
            Text("Step 1", font_size=22, color=TEAL_3B1B, weight=BOLD),
            Text("13 - 10 = 3", font_size=24, weight=BOLD),
        ).arrange(DOWN, buff=0.12).move_to(step1.get_center())

        step2 = RoundedRectangle(
            corner_radius=0.18,
            width=3.0,
            height=1.35,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        step2.set_fill(PINK_3B1B, opacity=0.12)
        step2.shift(DOWN * 2.0)
        step2_text = VGroup(
            Text("Step 2", font_size=22, color=PINK_3B1B, weight=BOLD),
            Text("3^2 = 9", font_size=24, weight=BOLD),
        ).arrange(DOWN, buff=0.12).move_to(step2.get_center())

        step3 = RoundedRectangle(
            corner_radius=0.18,
            width=3.0,
            height=1.35,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        step3.set_fill(GREEN_3B1B, opacity=0.12)
        step3.shift(RIGHT * 3.4 + DOWN * 2.0)
        step3_text = VGroup(
            Text("Step 3", font_size=22, color=GREEN_3B1B, weight=BOLD),
            Text("9 / 10 = 0.9", font_size=24, weight=BOLD),
        ).arrange(DOWN, buff=0.12).move_to(step3.get_center())

        arrow1 = Arrow(value_box.get_bottom(), step1.get_top(), buff=0.15, color=TEAL_3B1B, stroke_width=5)
        arrow2 = Arrow(step1.get_right(), step2.get_left(), buff=0.15, color=PINK_3B1B, stroke_width=5)
        arrow3 = Arrow(step2.get_right(), step3.get_left(), buff=0.15, color=GREEN_3B1B, stroke_width=5)

        footer = Text(
            "Add one contribution from each category to get the full chi-square statistic.",
            font_size=22,
            color=GREEN_3B1B,
        )
        footer.to_edge(DOWN, buff=0.35)

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.5)
        self.play(Create(formula_box), Write(formula_text), run_time=1.3)
        self.play(FadeIn(value_box), Write(value_text), run_time=1.2)
        self.play(Create(arrow1), FadeIn(step1), Write(step1_text), run_time=1.3)
        self.play(Create(arrow2), FadeIn(step2), Write(step2_text), run_time=1.2)
        self.play(Create(arrow3), FadeIn(step3), Write(step3_text), run_time=1.2)
        self.play(Write(footer), run_time=1.1)
        self.wait(2.0)

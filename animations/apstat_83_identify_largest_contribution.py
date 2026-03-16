"""
Show that the largest chi-square contribution marks the category with the biggest discrepancy.

Render:
manim -qm --format=mp4 animations/apstat_83_identify_largest_contribution.py ChiSquareLargestContribution
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ChiSquareLargestContribution(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Find the Largest Contribution", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "The tallest contribution marks the biggest observed-vs-expected mismatch",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        formula_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.9,
            height=1.0,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        formula_box.set_fill(BLUE_3B1B, opacity=0.1)
        formula_text = Text(
            "Contribution = (Obs - Exp)² / Exp",
            font_size=22,
            color=WHITE,
        )
        formula_text.move_to(formula_box.get_center())
        formula_group = VGroup(formula_box, formula_text)
        formula_group.shift(UP * 1.6)

        labels = VGroup(
            Text("Low income", font_size=24, color=GRAY_B),
            Text("Middle income", font_size=24, color=GRAY_B),
            Text("High income", font_size=24, color=GRAY_B),
        ).arrange(RIGHT, buff=1.2)
        labels.shift(DOWN * 2.75)

        heights = [0.55, 1.65, 3.25]
        values = ["0.20", "2.42", "5.12"]
        colors = [TEAL_3B1B, BLUE_3B1B, PINK_3B1B]
        bars = VGroup()
        value_labels = VGroup()

        for i in range(3):
            bar = RoundedRectangle(
                corner_radius=0.08,
                width=1.15,
                height=heights[i],
                stroke_color=colors[i],
                stroke_width=4,
            )
            bar.set_fill(colors[i], opacity=0.35)
            bar.move_to(labels[i].get_top() + UP * (heights[i] / 2 + 0.35))
            bars.add(bar)

            value = Text(values[i], font_size=24, color=WHITE, weight=BOLD)
            value.next_to(bar, UP, buff=0.15)
            value_labels.add(value)

        callout = RoundedRectangle(
            corner_radius=0.2,
            width=4.7,
            height=1.35,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        callout.set_fill(YELLOW_3B1B, opacity=0.1)
        callout.shift(RIGHT * 3.0 + UP * 0.65)
        callout_text = Text(
            "Largest contribution\n= biggest discrepancy",
            font_size=25,
            color=YELLOW_3B1B,
            weight=BOLD,
            line_spacing=0.9,
        )
        callout_text.move_to(callout.get_center())

        arrow = Arrow(
            callout.get_left() + LEFT * 0.05,
            bars[2].get_top() + RIGHT * 0.08,
            buff=0.15,
            color=YELLOW_3B1B,
            stroke_width=5,
        )

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.2)
        self.play(DrawBorderThenFill(formula_box), Write(formula_text), run_time=1.1)
        self.play(FadeIn(labels, shift=UP * 0.2), run_time=0.8)
        self.play(
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in bars],
                lag_ratio=0.18,
                run_time=2.0,
            )
        )
        self.play(FadeIn(value_labels, shift=UP * 0.1), run_time=0.8)
        self.play(DrawBorderThenFill(callout), Write(callout_text), GrowArrow(arrow), run_time=1.5)
        self.wait(1.8)

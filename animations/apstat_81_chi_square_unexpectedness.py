"""
Interpret small and large chi-square values.

Render:
manim -qm --format=mp4 animations/apstat_81_chi_square_unexpectedness.py ChiSquareUnexpectedness
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


def build_bar_panel(actual_heights, title_text, footer_text, accent_color):
    expected_heights = [1.1, 1.5, 1.3, 1.7]
    group = VGroup()
    bars = VGroup()
    outlines = VGroup()

    for exp_h, act_h in zip(expected_heights, actual_heights):
        outline = Rectangle(width=0.55, height=exp_h, stroke_color=TEAL_3B1B, stroke_width=3)
        outline.set_fill(opacity=0)
        actual = Rectangle(width=0.38, height=act_h, stroke_color=accent_color, stroke_width=2)
        actual.set_fill(accent_color, opacity=0.85)
        actual.align_to(outline, DOWN)
        pair = VGroup(outline, actual)
        outlines.add(outline)
        bars.add(actual)
        group.add(pair)

    group.arrange(RIGHT, buff=0.3, aligned_edge=DOWN)
    title = Text(title_text, font_size=24, color=accent_color, weight=BOLD)
    footer = Text(footer_text, font_size=20, color=WHITE)
    title.next_to(group, UP, buff=0.3)
    footer.next_to(group, DOWN, buff=0.25)

    return VGroup(group, title, footer), bars


class ChiSquareUnexpectedness(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("What a Larger Chi-Square Means", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "Compare how far the observed bars are from the expected pattern",
            font_size=24,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        left_panel, left_bars = build_bar_panel(
            [1.0, 1.45, 1.25, 1.75],
            "Close to expected",
            "small chi-square",
            BLUE_3B1B,
        )
        left_panel.shift(LEFT * 3.4 + DOWN * 0.45)

        right_panel, right_bars = build_bar_panel(
            [0.45, 2.05, 0.65, 2.35],
            "Far from expected",
            "large chi-square",
            PINK_3B1B,
        )
        right_panel.shift(RIGHT * 3.4 + DOWN * 0.45)

        connector = Arrow(
            left_panel.get_right() + RIGHT * 0.1,
            right_panel.get_left() + LEFT * 0.1,
            buff=0.2,
            color=YELLOW_3B1B,
            stroke_width=6,
        )

        footer_box = RoundedRectangle(
            corner_radius=0.18,
            width=10.8,
            height=1.2,
            stroke_color=GREEN_3B1B,
            stroke_width=3,
        )
        footer_box.set_fill(GREEN_3B1B, opacity=0.1)
        footer_box.to_edge(DOWN, buff=0.4)
        footer_text = Text(
            "Larger chi-square means the observed counts are less consistent with the chance model.",
            font_size=22,
            color=GREEN_3B1B,
        )
        footer_text.move_to(footer_box.get_center())

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.5)
        self.play(FadeIn(left_panel), run_time=1.3)
        self.play(LaggedStart(*[GrowFromEdge(bar, DOWN) for bar in left_bars], lag_ratio=0.12), run_time=1.4)
        self.play(FadeIn(right_panel), run_time=1.3)
        self.play(LaggedStart(*[GrowFromEdge(bar, DOWN) for bar in right_bars], lag_ratio=0.12), run_time=1.4)
        self.play(Create(connector), run_time=0.9)
        self.play(Create(footer_box), Write(footer_text), run_time=1.2)
        self.wait(2.0)

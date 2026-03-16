"""
Check the conditions for a chi-square goodness-of-fit test.

Render:
manim -qm --format=mp4 animations/apstat_82_check_conditions.py CheckGOFConditions
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


def build_check_row(label_text, accent_color):
    box = RoundedRectangle(
        corner_radius=0.16,
        width=7.2,
        height=0.95,
        stroke_color=accent_color,
        stroke_width=3,
    )
    box.set_fill(accent_color, opacity=0.08)
    label = Text(label_text, font_size=25, color=WHITE)
    label.move_to(box.get_left() + RIGHT * 2.55)
    check = Text("✓", font_size=34, color=accent_color, weight=BOLD)
    check.move_to(box.get_right() + LEFT * 0.45)
    return VGroup(box, label, check)


class CheckGOFConditions(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Check the GOF Conditions", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "Random sample, 10 percent rule, and every expected count above 5",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        row1 = build_check_row("1. Random sample or randomized experiment", BLUE_3B1B)
        row2 = build_check_row("2. Sample size is no more than 10 percent of population", TEAL_3B1B)
        row3 = build_check_row("3. All expected counts are greater than 5", GREEN_3B1B)
        checklist = VGroup(row1, row2, row3).arrange(DOWN, buff=0.22)
        checklist.move_to(UP * 0.45)

        example_box = RoundedRectangle(
            corner_radius=0.18,
            width=5.7,
            height=1.7,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        example_box.set_fill(PINK_3B1B, opacity=0.1)
        example_title = Text("Example expected counts", font_size=24, color=PINK_3B1B, weight=BOLD)
        example_title.move_to(example_box.get_top() + DOWN * 0.34)
        example_text = Text(
            "18.08   11.68   10.24",
            font_size=28,
            color=WHITE,
            weight=BOLD,
        )
        example_text.move_to(example_box.get_center() + DOWN * 0.2)
        example = VGroup(example_box, example_title, example_text)
        example.move_to(DOWN * 2.3)

        footer = Text(
            "If one expected count is 5 or less, stop and do not use the test",
            font_size=21,
            color=YELLOW_3B1B,
        )
        footer.move_to(DOWN * 3.35)

        for row in checklist:
            row[2].set_opacity(0)

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.4)
        self.play(LaggedStart(*(FadeIn(row[0], shift=RIGHT * 0.15) for row in checklist), lag_ratio=0.16), run_time=1.7)
        self.play(LaggedStart(*(Write(row[1]) for row in checklist), lag_ratio=0.16), run_time=1.8)
        self.play(FadeIn(row1[2], scale=0.8), run_time=0.6)
        self.play(FadeIn(row2[2], scale=0.8), run_time=0.6)
        self.play(DrawBorderThenFill(example_box), Write(example_title), Write(example_text), run_time=1.8)
        self.play(FadeIn(row3[2], scale=0.8), Circumscribe(example_box, color=PINK_3B1B, time_width=1.3), run_time=1.2)
        self.play(FadeIn(footer, shift=UP * 0.2), run_time=1.0)
        self.wait(2.8)

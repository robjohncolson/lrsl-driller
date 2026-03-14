"""
Check Conditions for a Difference in Two Means Interval (AP Stats Unit 7, Topic 7.6)

Run with: manim -qm --format=mp4 apstat_76_check_conditions.py MeanDiffCIConditions
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffCIConditions(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Check the Conditions", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))

        checks = [
            (
                "Independence",
                "Two independent random samples\nor a randomized experiment",
                BLUE_3B1B,
            ),
            (
                "10% Condition",
                "When sampling without replacement,\neach sample should be under 10%",
                YELLOW_3B1B,
            ),
            (
                "Nearly Normal",
                "Both n values ≥ 30\nor both groups show no strong skewness or outliers",
                TEAL_3B1B,
            ),
        ]

        panels = VGroup()
        for heading, body, color in checks:
            box = RoundedRectangle(corner_radius=0.18, width=4.1, height=2.25, stroke_color=color, fill_color=color, fill_opacity=0.12)
            head = Text(heading, font_size=26, color=color, weight=BOLD).next_to(box.get_top(), DOWN, buff=0.22)
            text = Text(body, font_size=21, color=WHITE, line_spacing=0.9).move_to(box.get_center() + DOWN * 0.15)
            panels.add(VGroup(box, head, text))

        panels.arrange(RIGHT, buff=0.3).next_to(title, DOWN, buff=0.7)
        self.play(LaggedStart(*[FadeIn(panel, shift=UP * 0.2) for panel in panels], lag_ratio=0.2))
        self.wait(1)

        checklist = VGroup()
        for color, text in [
            (GREEN_3B1B, "Check group 1"),
            (GREEN_3B1B, "Check group 2"),
            (PINK_3B1B, "Both groups must work"),
        ]:
            mark = Text("✓", font_size=34, color=color, weight=BOLD)
            label = Text(text, font_size=24, color=WHITE)
            row = VGroup(mark, label).arrange(RIGHT, buff=0.2)
            checklist.add(row)

        checklist.arrange(DOWN, aligned_edge=LEFT, buff=0.22).next_to(panels, DOWN, buff=0.7)
        self.play(LaggedStart(*[FadeIn(row, shift=RIGHT * 0.2) for row in checklist], lag_ratio=0.15))
        self.wait(2.5)

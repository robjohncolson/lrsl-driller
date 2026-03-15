"""
Use the test statistic and the alternative to find the p-value.

Render:
manim -qm --format=mp4 animations/apstat_79_find_p_value.py MeanDiffTestPValue
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffTestPValue(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("From t to p-value", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "Read the statistic, match the tail, then translate area into p",
            font_size=24,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        top_boxes = []
        top_specs = [
            ("1. Read t and df", "Example: t = 2.13, df = 22", BLUE_3B1B),
            ("2. Use Hₐ", "Right, left, or both tails", TEAL_3B1B),
            ("3. Report p", "Tail area becomes the p-value", GREEN_3B1B),
        ]
        for heading, line, color in top_specs:
            box = RoundedRectangle(corner_radius=0.18, width=3.2, height=2.0, stroke_color=color, stroke_width=4)
            box.set_fill(color, opacity=0.12)
            text = VGroup(
                Text(heading, font_size=24, color=color, weight=BOLD),
                Text(line, font_size=20),
            ).arrange(DOWN, buff=0.18).move_to(box.get_center())
            top_boxes.append(VGroup(box, text))

        top_group = VGroup(*top_boxes).arrange(RIGHT, buff=0.35)
        top_group.shift(UP * 0.8)

        arrows = VGroup(
            Arrow(top_group[0].get_bottom(), top_group[0].get_bottom() + DOWN * 1.0, color=YELLOW_3B1B, stroke_width=6),
            Arrow(top_group[1].get_bottom(), top_group[1].get_bottom() + DOWN * 1.0, color=YELLOW_3B1B, stroke_width=6),
            Arrow(top_group[2].get_bottom(), top_group[2].get_bottom() + DOWN * 1.0, color=YELLOW_3B1B, stroke_width=6),
        )

        left_branch = RoundedRectangle(corner_radius=0.18, width=4.8, height=2.0, stroke_color=BLUE_3B1B, stroke_width=4)
        left_branch.set_fill(BLUE_3B1B, opacity=0.12)
        left_branch.shift(LEFT * 2.8 + DOWN * 1.9)
        left_text = VGroup(
            Text("One-sided test", font_size=24, color=BLUE_3B1B, weight=BOLD),
            Text("Use one tail only", font_size=26, weight=BOLD),
        ).arrange(DOWN, buff=0.18).move_to(left_branch.get_center())

        right_branch = RoundedRectangle(corner_radius=0.18, width=4.8, height=2.0, stroke_color=PINK_3B1B, stroke_width=4)
        right_branch.set_fill(PINK_3B1B, opacity=0.12)
        right_branch.shift(RIGHT * 2.8 + DOWN * 1.9)
        right_text = VGroup(
            Text("Two-sided test", font_size=24, color=PINK_3B1B, weight=BOLD),
            Text("Double the one-tail area", font_size=24, weight=BOLD),
        ).arrange(DOWN, buff=0.18).move_to(right_branch.get_center())

        summary_box = RoundedRectangle(
            corner_radius=0.18,
            width=10.8,
            height=1.25,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        summary_box.set_fill(GREEN_3B1B, opacity=0.12)
        summary_box.to_edge(DOWN, buff=0.38)
        summary = Text(
            "The p-value is the tail area that agrees with Hₐ.",
            font_size=25,
            color=GREEN_3B1B,
            weight=BOLD,
        )
        summary.move_to(summary_box.get_center())

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(0.6)
        self.play(LaggedStart(*[FadeIn(group[0], shift=UP * 0.2) for group in top_group], lag_ratio=0.16))
        self.play(LaggedStart(*[Write(group[1]) for group in top_group], lag_ratio=0.15))
        self.wait(0.6)
        self.play(LaggedStart(*[GrowArrow(arrow) for arrow in arrows], lag_ratio=0.15))
        self.play(FadeIn(left_branch, shift=UP * 0.2), Write(left_text))
        self.wait(0.6)
        self.play(FadeIn(right_branch, shift=UP * 0.2), Write(right_text))
        self.wait(0.8)
        self.play(FadeIn(summary_box, shift=UP * 0.2), Write(summary))
        self.wait(2)

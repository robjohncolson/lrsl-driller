"""
Construct a Difference in Two Means Interval (AP Stats Unit 7, Topic 7.6)

Run with: manim -qm --format=mp4 apstat_76_construct_interval.py MeanDiffCIConstructInterval
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffCIConstructInterval(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Build the Interval", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))

        point = RoundedRectangle(corner_radius=0.18, width=3.2, height=1.25, stroke_color=BLUE_3B1B, fill_color=BLUE_3B1B, fill_opacity=0.12)
        point_label = Text("x̄₁ − x̄₂", font_size=34, color=WHITE, weight=BOLD).move_to(point.get_center())
        point_group = VGroup(point, point_label)

        pm = Text("±", font_size=42, color=WHITE, weight=BOLD)

        me = RoundedRectangle(corner_radius=0.18, width=3.6, height=1.25, stroke_color=YELLOW_3B1B, fill_color=YELLOW_3B1B, fill_opacity=0.12)
        me_label = Text("margin of error", font_size=26, color=WHITE).move_to(me.get_center())
        me_group = VGroup(me, me_label)

        formula = VGroup(point_group, pm, me_group).arrange(RIGHT, buff=0.35).next_to(title, DOWN, buff=0.9)
        self.play(LaggedStart(FadeIn(point_group), Write(pm), FadeIn(me_group), lag_ratio=0.15))
        self.wait(0.8)

        line = Line(LEFT * 4.2, RIGHT * 4.2, color=GREY_B, stroke_width=4)
        center = Dot(color=BLUE_3B1B).move_to(line.get_center())
        left = Dot(color=GREEN_3B1B).move_to(line.point_from_proportion(0.28))
        right = Dot(color=GREEN_3B1B).move_to(line.point_from_proportion(0.72))

        lower_label = Text("lower", font_size=22, color=GREEN_3B1B).next_to(left, DOWN, buff=0.2)
        center_label = Text("x̄₁ − x̄₂", font_size=22, color=BLUE_3B1B).next_to(center, DOWN, buff=0.2)
        upper_label = Text("upper", font_size=22, color=GREEN_3B1B).next_to(right, DOWN, buff=0.2)

        line_group = VGroup(line, left, center, right, lower_label, center_label, upper_label).next_to(formula, DOWN, buff=1.0)
        self.play(Create(line), FadeIn(left), FadeIn(center), FadeIn(right), run_time=0.8)
        self.play(Write(lower_label), Write(center_label), Write(upper_label), run_time=0.7)
        self.wait(0.8)

        summary = Text(
            "Interval = point estimate ± margin of error",
            font_size=28,
            color=TEAL_3B1B,
            weight=BOLD,
        ).next_to(line_group, DOWN, buff=0.55)
        self.play(Write(summary), run_time=0.7)
        self.wait(2)

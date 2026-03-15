"""
Choose a one-sided or two-sided alternative before testing.

Render:
manim -qm --format=mp4 animations/apstat_78_alternative_type.py MeanDiffTestAlternativeType
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffTestAlternativeType(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text(
            "One-Sided or Two-Sided?",
            font_size=36,
            weight=BOLD,
        )
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "The wording of the research question decides the type",
            font_size=24,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        center_line = Line(LEFT * 4.6, RIGHT * 4.6, color=WHITE, stroke_width=4)
        center_line.shift(UP * 0.3)
        zero_tick = Line(UP * 0.25, DOWN * 0.25, color=WHITE, stroke_width=4)
        zero_tick.move_to(center_line.get_center())
        zero_label = Text("0", font_size=24, color=WHITE, weight=BOLD)
        zero_label.next_to(zero_tick, DOWN, buff=0.15)

        two_sided_box = RoundedRectangle(
            corner_radius=0.2,
            width=5.3,
            height=2.2,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        two_sided_box.set_fill(BLUE_3B1B, opacity=0.12)
        two_sided_box.shift(LEFT * 3.4 + DOWN * 2.0)
        two_sided_text = VGroup(
            Text("Two-sided", font_size=26, color=BLUE_3B1B, weight=BOLD),
            Text("Question: any difference?", font_size=22),
            Text("Ha: mu1 - mu2 != 0", font_size=24, weight=BOLD),
        ).arrange(DOWN, buff=0.18).move_to(two_sided_box.get_center())

        one_sided_box = RoundedRectangle(
            corner_radius=0.2,
            width=5.3,
            height=2.2,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        one_sided_box.set_fill(GREEN_3B1B, opacity=0.12)
        one_sided_box.shift(RIGHT * 3.4 + DOWN * 2.0)
        one_sided_text = VGroup(
            Text("One-sided", font_size=26, color=GREEN_3B1B, weight=BOLD),
            Text("Question: specifically greater?", font_size=22),
            Text("Ha: mu1 - mu2 > 0", font_size=24, weight=BOLD),
        ).arrange(DOWN, buff=0.18).move_to(one_sided_box.get_center())

        left_arrow = Arrow(
            start=center_line.get_center() + LEFT * 0.1,
            end=center_line.get_left() + RIGHT * 0.35,
            color=BLUE_3B1B,
            buff=0,
            stroke_width=7,
        )
        right_arrow = Arrow(
            start=center_line.get_center() + RIGHT * 0.1,
            end=center_line.get_right() + LEFT * 0.35,
            color=BLUE_3B1B,
            buff=0,
            stroke_width=7,
        )
        one_way_arrow = Arrow(
            start=center_line.get_center() + RIGHT * 0.1,
            end=center_line.get_right() + LEFT * 0.35,
            color=GREEN_3B1B,
            buff=0,
            stroke_width=7,
        )

        choose_note = Text(
            "Choose the direction before you look at the sample result",
            font_size=24,
            color=PINK_3B1B,
            weight=BOLD,
        )
        choose_note.to_edge(DOWN, buff=0.45)

        self.play(Write(title), run_time=1.0)
        self.play(FadeIn(subtitle, shift=UP * 0.2), run_time=0.8)
        self.wait(0.8)

        self.play(Create(center_line), Create(zero_tick), Write(zero_label), run_time=1.0)
        self.wait(0.7)

        self.play(GrowArrow(left_arrow), GrowArrow(right_arrow), run_time=1.1)
        self.wait(0.9)

        self.play(Create(two_sided_box), Write(two_sided_text), run_time=1.1)
        self.wait(1.0)

        self.play(FadeOut(left_arrow), FadeOut(right_arrow), run_time=0.8)
        self.play(GrowArrow(one_way_arrow), run_time=0.9)
        self.wait(0.8)

        self.play(Create(one_sided_box), Write(one_sided_text), run_time=1.1)
        self.wait(1.0)

        self.play(Write(choose_note), run_time=0.9)
        self.wait(4.0)

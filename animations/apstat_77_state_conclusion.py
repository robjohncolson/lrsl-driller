"""
State the Conclusion Carefully (AP Stats Unit 7, Topic 7.7)

Run with: manim -qm --format=mp4 apstat_77_state_conclusion.py MeanDiffCIStateConclusion
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffCIStateConclusion(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("State the Conclusion Carefully", font_size=40, weight=BOLD)
        subtitle = Text("Support or do not support", font_size=26, color=TEAL_3B1B)
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(0.5)

        interval_box = RoundedRectangle(
            corner_radius=0.18,
            width=9.8,
            height=1.3,
            stroke_color=YELLOW_3B1B,
            fill_color=YELLOW_3B1B,
            fill_opacity=0.1,
        ).shift(UP * 1.9)
        interval_text = Text("95% CI: (-2.37, 0.37)", font_size=30, color=WHITE, weight=BOLD).move_to(interval_box.get_center())
        self.play(FadeIn(interval_box, shift=UP * 0.2), Write(interval_text), run_time=0.9)
        self.wait(0.6)

        left_box = RoundedRectangle(
            corner_radius=0.18,
            width=5.4,
            height=2.6,
            stroke_color=GREEN_3B1B,
            fill_color=GREEN_3B1B,
            fill_opacity=0.12,
        ).shift(LEFT * 3.2 + DOWN * 0.9)
        left_title = Text("Say This", font_size=28, color=GREEN_3B1B, weight=BOLD)
        left_body = Text("The interval does not support\nthe claim of a difference.", font_size=24, color=WHITE)
        left_group = VGroup(left_title, left_body).arrange(DOWN, buff=0.18).move_to(left_box.get_center())

        right_box = RoundedRectangle(
            corner_radius=0.18,
            width=5.4,
            height=2.6,
            stroke_color=PINK_3B1B,
            fill_color=PINK_3B1B,
            fill_opacity=0.12,
        ).shift(RIGHT * 3.2 + DOWN * 0.9)
        right_title = Text("Not This", font_size=28, color=PINK_3B1B, weight=BOLD)
        right_body = Text("The claim is wrong.\nThe opposite is proved.", font_size=24, color=WHITE)
        right_group = VGroup(right_title, right_body).arrange(DOWN, buff=0.18).move_to(right_box.get_center())

        self.play(FadeIn(left_box, shift=RIGHT * 0.2), FadeIn(right_box, shift=LEFT * 0.2), run_time=0.9)
        self.play(Write(left_group), Write(right_group), run_time=1.0)
        self.wait(0.8)

        footer = Text("A confidence interval gives statistical support, not certainty", font_size=24, color=BLUE_3B1B)
        footer.shift(DOWN * 2.9)
        self.play(Write(footer), run_time=0.8)
        self.wait(2.6)

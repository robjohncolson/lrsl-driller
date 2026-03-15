"""
Compare the p-value with alpha and state the conclusion.

Render:
manim -qm --format=mp4 animations/apstat_79_state_conclusion.py MeanDiffTestConclusion
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffTestConclusion(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Finish the Hypothesis Test", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "Compare p with α, then use reject or fail to reject",
            font_size=24,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        compare_box = RoundedRectangle(
            corner_radius=0.18,
            width=4.2,
            height=1.2,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        compare_box.set_fill(YELLOW_3B1B, opacity=0.12)
        compare_box.shift(UP * 1.2)
        compare_text = Text("Compare p to α", font_size=26, color=YELLOW_3B1B, weight=BOLD)
        compare_text.move_to(compare_box.get_center())

        left_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.9,
            height=3.1,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        left_box.set_fill(GREEN_3B1B, opacity=0.12)
        left_box.shift(LEFT * 3.05 + DOWN * 1.0)
        left_text = VGroup(
            Text("p ≤ α", font_size=30, color=GREEN_3B1B, weight=BOLD),
            Text("Reject H₀", font_size=28, weight=BOLD),
            Text("There is convincing", font_size=22),
            Text("statistical evidence for Hₐ", font_size=22),
        ).arrange(DOWN, buff=0.15).move_to(left_box.get_center())

        right_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.9,
            height=3.1,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        right_box.set_fill(BLUE_3B1B, opacity=0.12)
        right_box.shift(RIGHT * 3.05 + DOWN * 1.0)
        right_text = VGroup(
            Text("p > α", font_size=30, color=BLUE_3B1B, weight=BOLD),
            Text("Fail to reject H₀", font_size=26, weight=BOLD),
            Text("There is not convincing", font_size=22),
            Text("statistical evidence for Hₐ", font_size=22),
        ).arrange(DOWN, buff=0.15).move_to(right_box.get_center())

        left_arrow = Arrow(compare_box.get_bottom(), left_box.get_top(), color=GREEN_3B1B, stroke_width=6)
        right_arrow = Arrow(compare_box.get_bottom(), right_box.get_top(), color=BLUE_3B1B, stroke_width=6)

        caution_box = RoundedRectangle(
            corner_radius=0.18,
            width=10.8,
            height=1.2,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        caution_box.set_fill(PINK_3B1B, opacity=0.12)
        caution_box.to_edge(DOWN, buff=0.35)
        caution = Text(
            "Do not say prove. Hypothesis tests give evidence, not certainty.",
            font_size=24,
            color=PINK_3B1B,
            weight=BOLD,
        )
        caution.move_to(caution_box.get_center())

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(0.6)
        self.play(DrawBorderThenFill(compare_box), Write(compare_text))
        self.wait(0.6)
        self.play(GrowArrow(left_arrow), GrowArrow(right_arrow))
        self.play(FadeIn(left_box, shift=UP * 0.2), Write(left_text))
        self.wait(0.6)
        self.play(FadeIn(right_box, shift=UP * 0.2), Write(right_text))
        self.wait(0.8)
        self.play(FadeIn(caution_box, shift=UP * 0.2), Write(caution))
        self.wait(2)

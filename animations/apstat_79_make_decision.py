"""
Make the formal hypothesis-test decision for a two-sample test.

Render:
manim -qm --format=mp4 animations/apstat_79_make_decision.py MeanDiffTestDecision
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"

H0 = "H\u2080"
HA = "H\u2090"
ALPHA = "\u03b1"
LEQ = "\u2264"


class MeanDiffTestDecision(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Make the Formal Decision", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            f"The decision is about {H0}, not about proof",
            font_size=24,
            color=YELLOW_3B1B,
            weight=BOLD,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        center_box = RoundedRectangle(
            corner_radius=0.18,
            width=4.3,
            height=1.1,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        center_box.set_fill(TEAL_3B1B, opacity=0.12)
        center_box.shift(UP * 1.35)
        center_text = Text("Use p and alpha", font_size=28, color=TEAL_3B1B, weight=BOLD)
        center_text.move_to(center_box.get_center())

        reject_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.9,
            height=3.0,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        reject_box.set_fill(GREEN_3B1B, opacity=0.12)
        reject_box.shift(LEFT * 3.05 + DOWN * 1.0)
        reject_text = VGroup(
            Text(f"p {LEQ} {ALPHA}", font_size=28, color=GREEN_3B1B, weight=BOLD),
            Text(f"Reject {H0}", font_size=28, weight=BOLD),
            Text(f"support {HA}", font_size=25),
            Text("statistically convincing evidence", font_size=20),
        ).arrange(DOWN, buff=0.14).move_to(reject_box.get_center())

        fail_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.9,
            height=3.0,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        fail_box.set_fill(BLUE_3B1B, opacity=0.12)
        fail_box.shift(RIGHT * 3.05 + DOWN * 1.0)
        fail_text = VGroup(
            Text(f"p > {ALPHA}", font_size=28, color=BLUE_3B1B, weight=BOLD),
            Text(f"Fail to reject {H0}", font_size=24, weight=BOLD),
            Text("do not support the claim", font_size=22),
            Text("with convincing evidence", font_size=20),
        ).arrange(DOWN, buff=0.14).move_to(fail_box.get_center())

        left_arrow = Arrow(center_box.get_bottom(), reject_box.get_top(), color=GREEN_3B1B, stroke_width=6)
        right_arrow = Arrow(center_box.get_bottom(), fail_box.get_top(), color=BLUE_3B1B, stroke_width=6)

        caution_box = RoundedRectangle(
            corner_radius=0.18,
            width=10.8,
            height=1.1,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        caution_box.set_fill(PINK_3B1B, opacity=0.12)
        caution_box.to_edge(DOWN, buff=0.35)
        caution = Text(
            f"Do not say accept {H0}. The formal choice is reject or fail to reject.",
            font_size=22,
            color=PINK_3B1B,
            weight=BOLD,
        )
        caution.move_to(caution_box.get_center())

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.4)
        self.wait(0.8)
        self.play(DrawBorderThenFill(center_box), Write(center_text), run_time=1.1)
        self.wait(0.9)
        self.play(GrowArrow(left_arrow), GrowArrow(right_arrow), run_time=1.0)
        self.play(FadeIn(reject_box, shift=UP * 0.2), Write(reject_text), run_time=1.3)
        self.wait(1.0)
        self.play(FadeIn(fail_box, shift=UP * 0.2), Write(fail_text), run_time=1.3)
        self.wait(1.2)
        self.play(FadeIn(caution_box, shift=UP * 0.2), Write(caution), run_time=1.2)
        self.wait(4.0)

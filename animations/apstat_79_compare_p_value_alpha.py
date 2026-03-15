"""
Compare the p-value to alpha for a two-sample test.

Render:
manim -qm --format=mp4 animations/apstat_79_compare_p_value_alpha.py MeanDiffTestComparePValueAlpha
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"

H0 = "H\u2080"
ALPHA = "\u03b1"
LEQ = "\u2264"


class MeanDiffTestComparePValueAlpha(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Compare p-value to alpha", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "This decides which branch of the hypothesis test you use",
            font_size=23,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        p_box = RoundedRectangle(
            corner_radius=0.18,
            width=4.0,
            height=1.5,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        p_box.set_fill(TEAL_3B1B, opacity=0.12)
        p_box.shift(LEFT * 3.1 + UP * 1.0)
        p_text = VGroup(
            Text("p-value", font_size=24, color=TEAL_3B1B, weight=BOLD),
            Text("sample evidence", font_size=22),
        ).arrange(DOWN, buff=0.12).move_to(p_box.get_center())

        alpha_box = RoundedRectangle(
            corner_radius=0.18,
            width=4.0,
            height=1.5,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        alpha_box.set_fill(YELLOW_3B1B, opacity=0.12)
        alpha_box.shift(RIGHT * 3.1 + UP * 1.0)
        alpha_text = VGroup(
            Text(ALPHA, font_size=34, color=YELLOW_3B1B, weight=BOLD),
            Text("significance level", font_size=22),
        ).arrange(DOWN, buff=0.12).move_to(alpha_box.get_center())

        compare_text = Text("Compare them directly", font_size=28, weight=BOLD)
        compare_text.shift(UP * 0.1)

        left_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.8,
            height=2.6,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        left_box.set_fill(GREEN_3B1B, opacity=0.12)
        left_box.shift(LEFT * 3.0 + DOWN * 2.0)
        left_text = VGroup(
            Text(f"p-value {LEQ} {ALPHA}", font_size=28, color=GREEN_3B1B, weight=BOLD),
            Text(f"Reject {H0}", font_size=28, weight=BOLD),
            Text("evidence is strong enough", font_size=21),
        ).arrange(DOWN, buff=0.14).move_to(left_box.get_center())

        right_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.8,
            height=2.6,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        right_box.set_fill(BLUE_3B1B, opacity=0.12)
        right_box.shift(RIGHT * 3.0 + DOWN * 2.0)
        right_text = VGroup(
            Text(f"p-value > {ALPHA}", font_size=28, color=BLUE_3B1B, weight=BOLD),
            Text(f"Fail to reject {H0}", font_size=24, weight=BOLD),
            Text("evidence is not strong enough", font_size=21),
        ).arrange(DOWN, buff=0.14).move_to(right_box.get_center())

        left_arrow = Arrow(compare_text.get_bottom() + LEFT * 0.9, left_box.get_top(), color=GREEN_3B1B, stroke_width=6)
        right_arrow = Arrow(compare_text.get_bottom() + RIGHT * 0.9, right_box.get_top(), color=BLUE_3B1B, stroke_width=6)

        footer_box = RoundedRectangle(
            corner_radius=0.18,
            width=10.6,
            height=1.0,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        footer_box.set_fill(PINK_3B1B, opacity=0.12)
        footer_box.to_edge(DOWN, buff=0.35)
        footer = Text(
            "Use the number comparison first, then choose the wording.",
            font_size=24,
            color=PINK_3B1B,
            weight=BOLD,
        )
        footer.move_to(footer_box.get_center())

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.4)
        self.wait(0.9)
        self.play(DrawBorderThenFill(p_box), Write(p_text), run_time=1.2)
        self.play(DrawBorderThenFill(alpha_box), Write(alpha_text), run_time=1.2)
        self.wait(1.0)
        self.play(Write(compare_text), run_time=1.0)
        self.wait(0.8)
        self.play(GrowArrow(left_arrow), GrowArrow(right_arrow), run_time=1.1)
        self.play(FadeIn(left_box, shift=UP * 0.2), Write(left_text), run_time=1.3)
        self.wait(1.0)
        self.play(FadeIn(right_box, shift=UP * 0.2), Write(right_text), run_time=1.3)
        self.wait(1.2)
        self.play(FadeIn(footer_box, shift=UP * 0.2), Write(footer), run_time=1.2)
        self.wait(2.3)

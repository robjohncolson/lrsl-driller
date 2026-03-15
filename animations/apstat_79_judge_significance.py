"""
Judge statistical significance for a two-sample test.

Render:
manim -qm --format=mp4 animations/apstat_79_judge_significance.py MeanDiffTestSignificance
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"

ALPHA = "\u03b1"
LEQ = "\u2264"


class MeanDiffTestSignificance(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Judge Statistical Significance", font_size=35, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            f"Small p relative to {ALPHA} means statistically significant",
            font_size=23,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        definition_box = RoundedRectangle(
            corner_radius=0.18,
            width=10.4,
            height=1.3,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        definition_box.set_fill(TEAL_3B1B, opacity=0.12)
        definition_box.shift(UP * 1.15)
        definition_text = VGroup(
            Text("Statistical significance is a p-value decision", font_size=26, color=TEAL_3B1B, weight=BOLD),
            Text(f"Compare p to {ALPHA}, not to 0 and not to certainty", font_size=21),
        ).arrange(DOWN, buff=0.12).move_to(definition_box.get_center())

        left_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.9,
            height=2.7,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        left_box.set_fill(GREEN_3B1B, opacity=0.12)
        left_box.shift(LEFT * 3.0 + DOWN * 1.15)
        left_text = VGroup(
            Text(f"p {LEQ} {ALPHA}", font_size=28, color=GREEN_3B1B, weight=BOLD),
            Text("Statistically significant", font_size=24, weight=BOLD),
            Text("unlikely under the null model", font_size=20),
        ).arrange(DOWN, buff=0.14).move_to(left_box.get_center())

        right_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.9,
            height=2.7,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        right_box.set_fill(BLUE_3B1B, opacity=0.12)
        right_box.shift(RIGHT * 3.0 + DOWN * 1.15)
        right_text = VGroup(
            Text(f"p > {ALPHA}", font_size=28, color=BLUE_3B1B, weight=BOLD),
            Text("Not statistically significant", font_size=22, weight=BOLD),
            Text("not enough evidence against H0", font_size=20),
        ).arrange(DOWN, buff=0.14).move_to(right_box.get_center())

        footer_box = RoundedRectangle(
            corner_radius=0.18,
            width=10.7,
            height=1.05,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        footer_box.set_fill(PINK_3B1B, opacity=0.12)
        footer_box.to_edge(DOWN, buff=0.35)
        footer = Text(
            "Significant does not mean proven. It means the result is hard to explain by chance alone.",
            font_size=21,
            color=PINK_3B1B,
            weight=BOLD,
        )
        footer.move_to(footer_box.get_center())

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.4)
        self.wait(0.8)
        self.play(DrawBorderThenFill(definition_box), Write(definition_text), run_time=1.3)
        self.wait(1.0)
        self.play(FadeIn(left_box, shift=UP * 0.2), Write(left_text), run_time=1.3)
        self.wait(1.0)
        self.play(FadeIn(right_box, shift=UP * 0.2), Write(right_text), run_time=1.3)
        self.wait(1.1)
        self.play(FadeIn(footer_box, shift=UP * 0.2), Write(footer), run_time=1.2)
        self.wait(4.8)

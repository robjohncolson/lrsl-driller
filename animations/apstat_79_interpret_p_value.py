"""
Interpret the p-value in context for a two-sample test.

Render:
manim -qm --format=mp4 animations/apstat_79_interpret_p_value.py MeanDiffTestInterpretPValue
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffTestInterpretPValue(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("How to Interpret a p-value", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "Start by assuming H₀ is true",
            font_size=25,
            color=YELLOW_3B1B,
            weight=BOLD,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        correct_box = RoundedRectangle(
            corner_radius=0.2,
            width=10.6,
            height=2.7,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        correct_box.set_fill(GREEN_3B1B, opacity=0.12)
        correct_box.shift(UP * 0.45)
        correct_text = VGroup(
            Text("Correct template", font_size=25, color=GREEN_3B1B, weight=BOLD),
            Text("Assuming H₀ is true ...", font_size=28, weight=BOLD),
            Text("chance of a sample result this extreme or more extreme", font_size=22),
            Text("from random sampling or random assignment alone", font_size=22),
        ).arrange(DOWN, buff=0.14).move_to(correct_box.get_center())

        wrong_left = RoundedRectangle(
            corner_radius=0.2,
            width=4.9,
            height=2.0,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        wrong_left.set_fill(PINK_3B1B, opacity=0.12)
        wrong_left.shift(LEFT * 3.0 + DOWN * 2.0)
        wrong_left_text = VGroup(
            Text("Wrong shortcut", font_size=22, color=PINK_3B1B, weight=BOLD),
            Text("Not the probability", font_size=22),
            Text("that H₀ is true", font_size=22),
        ).arrange(DOWN, buff=0.12).move_to(wrong_left.get_center())

        wrong_right = RoundedRectangle(
            corner_radius=0.2,
            width=4.9,
            height=2.0,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        wrong_right.set_fill(BLUE_3B1B, opacity=0.12)
        wrong_right.shift(RIGHT * 3.0 + DOWN * 2.0)
        wrong_right_text = VGroup(
            Text("Wrong shortcut", font_size=22, color=BLUE_3B1B, weight=BOLD),
            Text("Not the probability", font_size=22),
            Text("that Hₐ is true", font_size=22),
        ).arrange(DOWN, buff=0.12).move_to(wrong_right.get_center())

        x_left = Text("✕", font_size=46, color=PINK_3B1B, weight=BOLD)
        x_left.move_to(wrong_left.get_top() + DOWN * 0.28 + LEFT * 1.95)
        x_right = Text("✕", font_size=46, color=BLUE_3B1B, weight=BOLD)
        x_right.move_to(wrong_right.get_top() + DOWN * 0.28 + LEFT * 1.95)

        footer_box = RoundedRectangle(
            corner_radius=0.18,
            width=10.8,
            height=1.15,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        footer_box.set_fill(YELLOW_3B1B, opacity=0.12)
        footer_box.to_edge(DOWN, buff=0.35)
        footer = Text(
            "Interpret the sample result under H₀, not the truth of a claim.",
            font_size=24,
            color=YELLOW_3B1B,
            weight=BOLD,
        )
        footer.move_to(footer_box.get_center())

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(0.6)
        self.play(DrawBorderThenFill(correct_box), Write(correct_text))
        self.wait(0.8)
        self.play(FadeIn(wrong_left, shift=UP * 0.2), Write(wrong_left_text), FadeIn(x_left))
        self.wait(0.6)
        self.play(FadeIn(wrong_right, shift=UP * 0.2), Write(wrong_right_text), FadeIn(x_right))
        self.wait(0.8)
        self.play(FadeIn(footer_box, shift=UP * 0.2), Write(footer))
        self.wait(2)

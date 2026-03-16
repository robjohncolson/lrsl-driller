"""
Show how to state the alternative hypothesis in words.

Render:
manim -qm --format=mp4 animations/apstat_82_state_alternative_hypothesis.py AlternativeHypothesisWords
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


def build_panel(width, height, color, title_text, body_text):
    frame = RoundedRectangle(
        corner_radius=0.18,
        width=width,
        height=height,
        stroke_color=color,
        stroke_width=4,
    )
    frame.set_fill(color, opacity=0.1)
    title = Text(title_text, font_size=24, color=color, weight=BOLD)
    body = Text(body_text, font_size=22, color=WHITE, line_spacing=0.9)
    title.move_to(frame.get_top() + DOWN * 0.38)
    body.move_to(frame.get_center() + DOWN * 0.1)
    return VGroup(frame, title, body)


class AlternativeHypothesisWords(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Write Hₐ in Words", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "Say the distribution is not as specified, or that at least one proportion differs",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        correct = build_panel(
            4.8,
            3.4,
            GREEN_3B1B,
            "Correct Idea",
            "At least one\nproportion is not\nas specified.",
        )
        correct.move_to(DOWN * 0.25)

        wrong_left = build_panel(
            3.0,
            2.1,
            PINK_3B1B,
            "Not This",
            "All are\ndifferent",
        )
        wrong_left.move_to(LEFT * 4.0 + DOWN * 1.45)

        wrong_right = build_panel(
            3.0,
            2.1,
            TEAL_3B1B,
            "Not This",
            "p₁ > 0.25",
        )
        wrong_right.move_to(RIGHT * 4.0 + DOWN * 1.45)

        cross_left = Cross(wrong_left[0], stroke_color=PINK_3B1B, stroke_width=8)
        cross_right = Cross(wrong_right[0], stroke_color=PINK_3B1B, stroke_width=8)

        footer = Text(
            "Goodness-of-fit alternatives are not directional",
            font_size=22,
            color=BLUE_3B1B,
        )
        footer.move_to(DOWN * 3.15)

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.4)
        self.play(DrawBorderThenFill(correct[0]), Write(correct[1]), Write(correct[2]), run_time=2.0)
        self.wait(0.5)
        self.play(FadeIn(wrong_left, shift=RIGHT * 0.2), FadeIn(wrong_right, shift=LEFT * 0.2), run_time=1.4)
        self.play(Create(cross_left), Create(cross_right), run_time=1.0)
        self.wait(0.4)
        self.play(
            Circumscribe(correct[0], color=GREEN_3B1B, time_width=1.3),
            correct[0].animate.set_fill(GREEN_3B1B, opacity=0.18),
            run_time=1.6,
        )
        self.play(FadeIn(footer, shift=UP * 0.2), run_time=1.0)
        self.wait(2.8)

"""
Run with:
manim -qm --format=mp4 a14_spot_the_error.py SpotTheError
"""
from manim import *
from common import BG, INK, NEG, POS, setup_scene


class SpotTheError(Scene):
    def construct(self):
        setup_scene(self, "Spot the Error")

        left_panel = RoundedRectangle(width=5.2, height=3.4, corner_radius=0.16, color=NEG).set_fill(BG, opacity=1)
        right_panel = RoundedRectangle(width=5.2, height=3.4, corner_radius=0.16, color=POS).set_fill(BG, opacity=1)
        left_panel.shift(LEFT * 3.2 + DOWN * 0.2)
        right_panel.shift(RIGHT * 3.2 + DOWN * 0.2)

        wrong_title = Text("Student Work", font_size=24, color=NEG).next_to(left_panel, UP, buff=0.15)
        right_title = Text("Corrected Work", font_size=24, color=POS).next_to(right_panel, UP, buff=0.15)

        wrong = MathTex(r"(2+3i)^2=4+9i^2=-5", font_size=30, color=INK).move_to(left_panel)
        correct = MathTex(r"(2+3i)^2=4+12i+9i^2=-5+12i", font_size=28, color=INK).move_to(right_panel)
        note = Text("The middle term 12i was missing.", font_size=22, color=INK).shift(DOWN * 2.2)

        self.play(Create(left_panel), Create(right_panel), FadeIn(wrong_title), FadeIn(right_title))
        self.play(Write(wrong))
        self.play(Create(Cross(wrong, stroke_color=NEG, stroke_width=6)))
        self.play(Write(correct))
        self.play(FadeIn(note))
        self.wait(2)

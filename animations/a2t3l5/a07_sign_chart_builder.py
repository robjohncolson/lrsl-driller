"""
Run with:
manim -qm --format=mp4 a07_sign_chart_builder.py SignChartBuilder
"""
from manim import *
from common import ACCENT, INK, NEG, POS, setup_scene


class SignChartBuilder(Scene):
    def construct(self):
        setup_scene(self, "Sign Chart Builder")

        expr = MathTex(r"x(x-4)(x+3)", font_size=42, color=INK).shift(UP * 1.8)
        number_line = NumberLine(x_range=[-4, 5, 1], length=8, color=INK, include_numbers=True)
        number_line.shift(UP * 0.5)
        zeros = VGroup(
            Dot(number_line.n2p(-3), color=ACCENT),
            Dot(number_line.n2p(0), color=ACCENT),
            Dot(number_line.n2p(4), color=ACCENT)
        )
        interval_labels = VGroup(
            Text("-", font_size=30, color=NEG).next_to(number_line.n2p(-3.6), DOWN, buff=0.45),
            Text("+", font_size=30, color=POS).next_to(number_line.n2p(-1.5), DOWN, buff=0.45),
            Text("-", font_size=30, color=NEG).next_to(number_line.n2p(2), DOWN, buff=0.45),
            Text("+", font_size=30, color=POS).next_to(number_line.n2p(4.5), DOWN, buff=0.45)
        )
        solution = MathTex(r"f(x)>0:\;(-3,0)\cup(4,\infty)", font_size=34, color=POS).shift(DOWN * 1.9)

        self.play(Write(expr))
        self.play(Create(number_line), FadeIn(zeros))
        self.play(LaggedStart(*[FadeIn(label) for label in interval_labels], lag_ratio=0.15))
        self.play(Write(solution))
        self.wait(2)

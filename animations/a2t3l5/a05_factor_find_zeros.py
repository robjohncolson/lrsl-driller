"""
Run with:
manim -qm --format=mp4 a05_factor_find_zeros.py FactorFindZeros
"""
from manim import *
from common import ACCENT, INK, POS, setup_scene


class FactorFindZeros(Scene):
    def construct(self):
        setup_scene(self, "Factor to Find Every Zero")

        steps = VGroup(
            MathTex(r"x^3 + 2x^2 - 3x", font_size=40, color=INK),
            MathTex(r"= x(x^2 + 2x - 3)", font_size=38, color=ACCENT),
            MathTex(r"= x(x+3)(x-1)", font_size=38, color=POS),
            MathTex(r"x=0,\;x=-3,\;x=1", font_size=38, color=INK)
        ).arrange(DOWN, buff=0.4)
        steps.shift(UP * 0.2)

        for line in steps:
            self.play(Write(line), run_time=0.8)

        number_line = NumberLine(x_range=[-4, 2, 1], length=7, color=INK, include_numbers=True)
        number_line.shift(DOWN * 2.4)
        dots = VGroup(
            Dot(number_line.n2p(-3), color=ACCENT),
            Dot(number_line.n2p(0), color=POS),
            Dot(number_line.n2p(1), color=ACCENT)
        )
        self.play(Create(number_line), FadeIn(dots))
        self.wait(2)

"""
Run with:
manim -qm --format=mp4 a02_factor_to_zero.py FactorToZero
"""
from manim import *
from common import ACCENT, BG, INK, POS, setup_scene


class FactorToZero(Scene):
    def construct(self):
        setup_scene(self, "Factor to Zero")

        factors = VGroup(
            MathTex(r"(x+3)=0 \Rightarrow x=-3", font_size=34, color=INK),
            MathTex(r"(x-1)=0 \Rightarrow x=1", font_size=34, color=INK),
            MathTex(r"x=0 \Rightarrow x=0", font_size=34, color=INK)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.45)
        factors.shift(UP * 0.2)

        for line in factors:
            self.play(Write(line), run_time=0.7)
            self.play(Indicate(line[0], color=ACCENT), run_time=0.5)

        number_line = NumberLine(x_range=[-4, 2, 1], length=7, color=INK, include_numbers=True)
        number_line.shift(DOWN * 2.2)
        dots = VGroup(
            Dot(number_line.n2p(-3), color=ACCENT),
            Dot(number_line.n2p(0), color=POS),
            Dot(number_line.n2p(1), color=ACCENT)
        )
        self.play(Create(number_line), FadeIn(dots))
        self.wait(2)

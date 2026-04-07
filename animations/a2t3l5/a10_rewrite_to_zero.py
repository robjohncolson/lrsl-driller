"""
Run with:
manim -qm --format=mp4 a10_rewrite_to_zero.py RewriteToZero
"""
from manim import *
from common import ACCENT, INK, POS, setup_scene


class RewriteToZero(Scene):
    def construct(self):
        setup_scene(self, "Rewrite the Equation to Zero")

        lines = VGroup(
            MathTex(r"x^3+5x^2-x-7=x^2+6x+3", font_size=36, color=INK),
            MathTex(r"x^3+4x^2-7x-10=0", font_size=36, color=ACCENT),
            MathTex(r"(x+5)(x+1)(x-2)=0", font_size=36, color=POS),
            MathTex(r"x=-5,\;-1,\;2", font_size=36, color=INK)
        ).arrange(DOWN, buff=0.45)
        lines.shift(UP * 0.3)

        self.play(LaggedStart(*[Write(line) for line in lines], lag_ratio=0.2))
        self.wait(2)

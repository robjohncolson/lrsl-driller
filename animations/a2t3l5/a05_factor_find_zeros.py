"""
Run with:
manim -qm --format=mp4 a05_factor_find_zeros.py FactorFindZeros
"""
from manim import *
from common import ACCENT, INK, NEG, POS, SOFT, setup_scene


class FactorFindZeros(Scene):
    def construct(self):
        setup_scene(self, "Factor to Find Every Zero")

        poly = MathTex(r"x^3 + 2x^2 - 3x", font_size=40, color=INK).shift(UP * 2.2)
        gcf = MathTex(r"x^3 + 2x^2 - 3x = x(x^2 + 2x - 3)", font_size=34, color=ACCENT).shift(UP * 1.35)
        gcf_note = Text("Every term has x, so factor out the GCF first.", font_size=22, color=ACCENT).next_to(gcf, DOWN, buff=0.15)

        need = Text("Need two numbers that multiply to -3 and add to +2.", font_size=22, color=INK).shift(UP * 0.45)
        try_one = MathTex(r"(1,-3):\;1\cdot(-3)=-3,\;1+(-3)=-2", font_size=30, color=NEG).shift(DOWN * 0.2)
        try_two = MathTex(r"(3,-1):\;3\cdot(-1)=-3,\;3+(-1)=2", font_size=30, color=POS).shift(DOWN * 0.8)
        factored = MathTex(r"x(x^2 + 2x - 3)=x(x+3)(x-1)", font_size=34, color=POS).shift(DOWN * 1.55)
        solve = VGroup(
            MathTex(r"x=0", font_size=30, color=ACCENT),
            MathTex(r"x+3=0\Rightarrow x=-3", font_size=30, color=SOFT),
            MathTex(r"x-1=0\Rightarrow x=1", font_size=30, color=POS)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.16).shift(DOWN * 2.55 + LEFT * 2.6)

        self.play(Write(poly))
        self.play(Write(gcf), FadeIn(gcf_note, shift=UP * 0.1))
        self.play(FadeIn(need, shift=UP * 0.1))
        self.play(Write(try_one))
        self.play(Write(try_two))
        self.play(Write(factored))
        self.play(LaggedStart(*[Write(line) for line in solve], lag_ratio=0.2))

        number_line = NumberLine(x_range=[-4, 2, 1], length=5.6, color=INK, include_numbers=True)
        number_line.shift(DOWN * 2.55 + RIGHT * 2.5)
        dots = VGroup(
            Dot(number_line.n2p(-3), color=SOFT),
            Dot(number_line.n2p(0), color=ACCENT),
            Dot(number_line.n2p(1), color=POS)
        )
        labels = VGroup(
            MathTex(r"-3", font_size=24, color=SOFT).next_to(dots[0], UP, buff=0.12),
            MathTex(r"0", font_size=24, color=ACCENT).next_to(dots[1], UP, buff=0.12),
            MathTex(r"1", font_size=24, color=POS).next_to(dots[2], UP, buff=0.12)
        )
        self.play(Create(number_line), FadeIn(dots), FadeIn(labels))
        self.wait(2)

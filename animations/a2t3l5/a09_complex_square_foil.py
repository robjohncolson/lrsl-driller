"""
Run with:
manim -qm --format=mp4 a09_complex_square_foil.py ComplexSquareFOIL
"""
from manim import *
from common import ACCENT, BG, INK, POS, SOFT, setup_scene


class ComplexSquareFOIL(Scene):
    def construct(self):
        setup_scene(self, "Square a Complex Binomial")

        expr = MathTex(r"(3+5i)(3+5i)", font_size=42, color=INK).shift(UP * 2.2)
        foil_rows = VGroup(
            MathTex(r"F:\;3\cdot 3=9", font_size=30, color=ACCENT),
            MathTex(r"O:\;3\cdot 5i=15i", font_size=30, color=SOFT),
            MathTex(r"I:\;5i\cdot 3=15i", font_size=30, color=SOFT),
            MathTex(r"L:\;5i\cdot 5i=25i^2", font_size=30, color=POS),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.22).shift(UP * 0.6)
        sum_line = MathTex(r"9+15i+15i+25i^2", font_size=34, color=INK).shift(DOWN * 0.85)
        substitute = MathTex(r"i^2=-1\;\Rightarrow\;25i^2=-25", font_size=32, color=POS).shift(DOWN * 1.65)
        group_line = MathTex(r"(9-25)+(15i+15i)=-16+30i", font_size=34, color=ACCENT).shift(DOWN * 2.45)
        result = MathTex(r"(3+5i)^2=-16+30i", font_size=36, color=INK).shift(DOWN * 3.2)

        self.play(Write(expr))
        self.play(LaggedStart(*[FadeIn(row, shift=RIGHT * 0.12) for row in foil_rows], lag_ratio=0.18))
        self.play(Write(sum_line))
        self.play(Write(substitute))
        self.play(Write(group_line))
        self.play(Indicate(group_line, color=ACCENT), Write(result))
        self.wait(2)

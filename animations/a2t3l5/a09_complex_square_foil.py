"""
Run with:
manim -qm --format=mp4 a09_complex_square_foil.py ComplexSquareFOIL
"""
from manim import *
from common import ACCENT, BG, INK, POS, SOFT, setup_scene


class ComplexSquareFOIL(Scene):
    def construct(self):
        setup_scene(self, "Square a Complex Binomial")

        expr = MathTex(r"(3+5i)^2", font_size=44, color=INK).shift(UP * 2.0)
        self.play(Write(expr))

        grid = Square(side_length=2.8, color=INK)
        h = Line(grid.get_top() + DOWN * 1.4, grid.get_bottom() + UP * 1.4, color=INK)
        v = Line(grid.get_left() + RIGHT * 1.4, grid.get_right() + LEFT * 1.4, color=INK)
        table = VGroup(grid, h, v).shift(DOWN * 0.1)
        self.play(Create(table))

        entries = VGroup(
            MathTex("9", font_size=30, color=ACCENT).move_to(table.get_center() + UL * 0.7),
            MathTex("15i", font_size=30, color=SOFT).move_to(table.get_center() + UR * 0.7),
            MathTex("15i", font_size=30, color=SOFT).move_to(table.get_center() + DL * 0.7),
            MathTex("25i^2", font_size=30, color=POS).move_to(table.get_center() + DR * 0.7)
        )
        self.play(LaggedStart(*[Write(entry) for entry in entries], lag_ratio=0.15))

        rewrite = MathTex(r"25i^2=-25", font_size=32, color=POS).shift(DOWN * 2.3)
        result = MathTex(r"(3+5i)^2=-16+30i", font_size=36, color=INK).shift(DOWN * 3.0)
        self.play(Write(rewrite))
        self.play(Write(result))
        self.wait(2)

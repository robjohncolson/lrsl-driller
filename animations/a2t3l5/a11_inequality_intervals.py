"""
Run with:
manim -qm --format=mp4 a11_inequality_intervals.py InequalityIntervals
"""
from manim import *
from common import ACCENT, INK, POS, setup_scene


class InequalityIntervals(Scene):
    def construct(self):
        setup_scene(self, "Solve the Inequality")

        prompt = MathTex(r"x(x-2)(x+2)>0", font_size=40, color=INK).shift(UP * 1.8)
        number_line = NumberLine(x_range=[-3, 3, 1], length=8, color=INK, include_numbers=True)
        number_line.shift(UP * 0.2)
        open_dots = VGroup(
            Circle(radius=0.1, color=ACCENT).move_to(number_line.n2p(-2)),
            Circle(radius=0.1, color=ACCENT).move_to(number_line.n2p(0)),
            Circle(radius=0.1, color=ACCENT).move_to(number_line.n2p(2))
        )
        shading = VGroup(
            Line(number_line.n2p(-2) + RIGHT * 0.14, number_line.n2p(0) + LEFT * 0.14, color=POS, stroke_width=7),
            Line(number_line.n2p(2) + RIGHT * 0.14, number_line.n2p(3), color=POS, stroke_width=7)
        )
        solution = MathTex(r"(-2,0)\cup(2,\infty)", font_size=34, color=POS).shift(DOWN * 1.8)

        self.play(Write(prompt))
        self.play(Create(number_line), FadeIn(open_dots))
        self.play(Create(shading))
        self.play(Write(solution))
        self.wait(2)

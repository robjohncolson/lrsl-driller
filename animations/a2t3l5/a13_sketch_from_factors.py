"""
Run with:
manim -qm --format=mp4 a13_sketch_from_factors.py SketchFromFactors
"""
from manim import *
from common import ACCENT, INK, NEG, POS, setup_scene, simple_axes


class SketchFromFactors(Scene):
    def construct(self):
        setup_scene(self, "Sketch from Factors")

        expr = MathTex(r"f(x)=(x+1)^3(x-6)", font_size=40, color=INK).shift(UP * 2.0)
        axes = simple_axes(x_range=[-3, 7, 1], y_range=[-8, 8, 2], length=7.4)
        axes.shift(DOWN * 0.15)
        graph = axes.plot(lambda x: 0.04 * (x + 1) ** 3 * (x - 6), color=POS, x_range=[-2.4, 6.5])
        zeros = VGroup(
            Dot(axes.c2p(-1, 0), color=ACCENT),
            Dot(axes.c2p(6, 0), color=ACCENT)
        )
        labels = VGroup(
            Text("cross", font_size=20, color=NEG).next_to(zeros[0], UP, buff=0.2),
            Text("cross", font_size=20, color=NEG).next_to(zeros[1], UP, buff=0.2),
            Text("below", font_size=20, color=NEG).next_to(axes.c2p(2.5, -2.0), DOWN, buff=0.15),
            Text("above", font_size=20, color=POS).next_to(axes.c2p(-2.0, 2.0), UP, buff=0.15)
        )

        self.play(Write(expr))
        self.play(Create(axes), FadeIn(zeros))
        self.play(Create(graph))
        self.play(LaggedStart(*[FadeIn(label) for label in labels], lag_ratio=0.15))
        self.wait(2)

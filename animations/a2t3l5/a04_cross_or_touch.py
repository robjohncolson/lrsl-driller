"""
Run with:
manim -qm --format=mp4 a04_cross_or_touch.py CrossOrTouch
"""
from manim import *
from common import ACCENT, INK, NEG, POS, SOFT, setup_scene, simple_axes


class CrossOrTouch(Scene):
    def construct(self):
        setup_scene(self, "Odd Crosses, Even Touches")

        axes = simple_axes(x_range=[-1, 3, 1], y_range=[-2, 3, 1], length=7)
        axes.shift(DOWN * 0.2)
        odd_graph = axes.plot(lambda x: (x - 1) ** 3, color=POS, x_range=[-0.5, 2.4])
        even_graph = axes.plot(lambda x: (x - 1) ** 2, color=NEG, x_range=[-0.5, 2.4])
        point = Dot(axes.c2p(1, 0), color=ACCENT)

        odd_label = MathTex(r"(x-a)^3 \rightarrow \text{crosses}", font_size=30, color=POS).to_edge(LEFT).shift(UP * 1.4)
        even_label = MathTex(r"(x-a)^2 \rightarrow \text{touches}", font_size=30, color=NEG).to_edge(RIGHT).shift(UP * 1.4)

        self.play(Create(axes), FadeIn(point))
        self.play(Create(odd_graph), Write(odd_label))
        self.play(Create(even_graph), Write(even_label))
        self.play(Indicate(point, color=SOFT))
        self.wait(2)

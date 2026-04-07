"""
Run with:
manim -qm --format=mp4 a08_real_vs_complex.py RealVsComplex
"""
from manim import *
from common import ACCENT, INK, NEG, POS, SOFT, setup_scene, simple_axes


class RealVsComplex(Scene):
    def construct(self):
        setup_scene(self, "Real vs Complex Zeros")

        axes = simple_axes(x_range=[-4, 4, 1], y_range=[-4, 10, 2], length=7)
        axes.shift(DOWN * 0.2)

        real_graph = axes.plot(lambda x: x ** 2 - 4, color=POS, x_range=[-3.2, 3.2])
        lifted_graph = axes.plot(lambda x: x ** 2 + 4, color=NEG, x_range=[-3.2, 3.2])
        real_text = MathTex(r"x^2-4=0", font_size=30, color=POS).to_edge(LEFT).shift(UP * 1.3)
        complex_text = MathTex(r"x^2+9=0 \Rightarrow x=\pm 3i", font_size=30, color=NEG).to_edge(RIGHT).shift(UP * 1.3)

        self.play(Create(axes))
        self.play(Create(real_graph), Write(real_text))
        self.play(TransformFromCopy(real_graph, lifted_graph), Write(complex_text))
        note = Text("When the parabola stays above the x-axis, there are no real zeros.", font_size=22, color=INK)
        note.to_edge(DOWN, buff=0.35)
        self.play(FadeIn(note))
        self.wait(2)

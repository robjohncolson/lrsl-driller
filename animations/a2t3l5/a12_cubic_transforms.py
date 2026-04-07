"""
Run with:
manim -qm --format=mp4 a12_cubic_transforms.py CubicTransforms
"""
from manim import *
from common import ACCENT, INK, POS, SOFT, setup_scene, simple_axes


class CubicTransforms(Scene):
    def construct(self):
        setup_scene(self, "Track the Transformations")

        axes = simple_axes(x_range=[-3, 3, 1], y_range=[-5, 5, 1], length=7)
        axes.shift(DOWN * 0.2)
        parent = axes.plot(lambda x: x ** 3 / 3, color=SOFT, x_range=[-2.1, 2.1])
        stretch = axes.plot(lambda x: 2 * x ** 3 / 3, color=ACCENT, x_range=[-1.8, 1.8])
        shifted = axes.plot(lambda x: 2 * x ** 3 / 3 - 1, color=POS, x_range=[-1.8, 1.8])

        labels = VGroup(
            MathTex(r"y=x^3", font_size=28, color=SOFT),
            MathTex(r"y=2x^3", font_size=28, color=ACCENT),
            MathTex(r"y=2x^3-1", font_size=28, color=POS)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2).to_edge(RIGHT).shift(UP * 0.8)

        self.play(Create(axes), Create(parent), Write(labels[0]))
        self.play(TransformFromCopy(parent, stretch), Write(labels[1]))
        self.play(TransformFromCopy(stretch, shifted), Write(labels[2]))
        self.wait(2)

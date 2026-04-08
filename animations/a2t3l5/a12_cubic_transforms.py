"""
Run with:
manim -qm --format=mp4 a12_cubic_transforms.py CubicTransforms
"""
from manim import *
from common import ACCENT, INK, POS, SOFT, setup_scene, simple_axes


class CubicTransforms(Scene):
    def construct(self):
        setup_scene(self, "Track the Transformations")

        axes = simple_axes(x_range=[-4, 5, 1], y_range=[-5, 5, 1], length=7)
        axes.shift(DOWN * 0.2)
        parent = axes.plot(lambda x: x ** 3 / 4, color=SOFT, x_range=[-3.1, 3.1])
        shifted = axes.plot(lambda x: (x - 3) ** 3 / 4, color=ACCENT, x_range=[-0.1, 4.9])
        reflected = axes.plot(lambda x: -(x ** 3) / 4, color=POS, x_range=[-3.1, 3.1])

        parent_label = MathTex(r"y=x^3", font_size=30, color=SOFT).to_edge(RIGHT).shift(UP * 1.3)
        shift_label = MathTex(r"y=(x-3)^3", font_size=30, color=ACCENT).next_to(parent_label, DOWN, buff=0.25, aligned_edge=LEFT)
        reflect_label = MathTex(r"y=-x^3", font_size=30, color=POS).next_to(shift_label, DOWN, buff=0.25, aligned_edge=LEFT)
        shift_arrow = Arrow(axes.c2p(0, 0), axes.c2p(3, 0), color=ACCENT, buff=0.05, stroke_width=5)
        shift_note = Text("minus inside means shift RIGHT 3", font_size=22, color=ACCENT).next_to(shift_arrow, UP, buff=0.15)
        reflect_note = Text("negative in front reflects over the x-axis", font_size=22, color=POS).next_to(reflect_label, DOWN, buff=0.2, aligned_edge=LEFT)

        self.play(Create(axes), Create(parent), Write(parent_label))
        self.play(TransformFromCopy(parent, shifted), Write(shift_label))
        self.play(GrowArrow(shift_arrow), FadeIn(shift_note, shift=UP * 0.08))
        self.play(FadeOut(shift_arrow), FadeOut(shift_note))
        self.play(TransformFromCopy(parent, reflected), Write(reflect_label))
        self.play(FadeIn(reflect_note, shift=UP * 0.08))
        self.wait(2)

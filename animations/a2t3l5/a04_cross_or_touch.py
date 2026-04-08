"""
Run with:
manim -qm --format=mp4 a04_cross_or_touch.py CrossOrTouch
"""
from manim import *
from common import ACCENT, INK, NEG, POS, SOFT, setup_scene, simple_axes


class CrossOrTouch(Scene):
    def construct(self):
        setup_scene(self, "Odd Crosses, Even Touches")

        left_axes = simple_axes(x_range=[-1, 3, 1], y_range=[-3, 3, 1], length=4.3)
        right_axes = simple_axes(x_range=[-1, 3, 1], y_range=[-2, 3, 1], length=4.3)
        left_axes.shift(LEFT * 3.3 + DOWN * 0.4)
        right_axes.shift(RIGHT * 3.3 + DOWN * 0.4)

        odd_graph = left_axes.plot(lambda x: (x - 1) ** 3, color=POS, x_range=[-0.4, 2.3])
        even_graph = right_axes.plot(lambda x: (x - 1) ** 2, color=NEG, x_range=[-0.4, 2.3])
        odd_dot = Dot(left_axes.c2p(1, 0), color=ACCENT)
        even_dot = Dot(right_axes.c2p(1, 0), color=ACCENT)

        odd_label = MathTex(r"(x-1)^3 \rightarrow \text{crosses}", font_size=28, color=POS).next_to(left_axes, UP, buff=0.2)
        even_label = MathTex(r"(x-1)^2 \rightarrow \text{touches}", font_size=28, color=NEG).next_to(right_axes, UP, buff=0.2)

        odd_signs = VGroup(
            MathTex(r"x<1:\;(-)^3=-", font_size=26, color=NEG),
            MathTex(r"x>1:\;(+ )^3=+", font_size=26, color=POS)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.14).next_to(left_axes, DOWN, buff=0.25)

        even_signs = VGroup(
            MathTex(r"x<1:\;(-)^2=+", font_size=26, color=POS),
            MathTex(r"x>1:\;(+ )^2=+", font_size=26, color=POS)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.14).next_to(right_axes, DOWN, buff=0.25)

        self.play(Create(left_axes), Create(right_axes), FadeIn(odd_dot), FadeIn(even_dot))
        self.play(Create(odd_graph), Write(odd_label))
        self.play(Create(even_graph), Write(even_label))
        self.play(FadeIn(odd_signs, shift=UP * 0.1), FadeIn(even_signs, shift=UP * 0.1))
        self.play(Indicate(odd_signs[0], color=NEG), Indicate(odd_signs[1], color=POS), run_time=0.5)
        self.play(Indicate(even_signs[0], color=POS), Indicate(even_signs[1], color=POS), run_time=0.5)
        self.wait(2)

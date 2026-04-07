"""
Run with:
manim -qm --format=mp4 a01_zero_mult_vocab.py ZeroMultVocab
"""
from manim import *
from common import ACCENT, BG, INK, POS, SOFT, footer_note, setup_scene, simple_axes


class ZeroMultVocab(Scene):
    def construct(self):
        setup_scene(self, "Zeros and Multiplicity")

        zero_card = RoundedRectangle(width=2.8, height=1.1, corner_radius=0.18, color=ACCENT).set_fill(BG, opacity=1)
        zero_text = Text("Zero", font_size=28, color=INK)
        zero_group = VGroup(zero_card, zero_text).shift(LEFT * 3 + UP * 1.1)

        mult_card = RoundedRectangle(width=3.2, height=1.1, corner_radius=0.18, color=SOFT).set_fill(BG, opacity=1)
        mult_text = Text("Multiplicity", font_size=28, color=INK)
        mult_group = VGroup(mult_card, mult_text).shift(RIGHT * 2.8 + UP * 1.1)

        self.play(FadeIn(zero_group), FadeIn(mult_group))

        axes = simple_axes()
        axes.shift(DOWN * 0.7)
        graph = axes.plot(lambda x: 0.25 * (x - 1) ** 2 * (x + 2), color=POS, x_range=[-3.5, 3.2])
        intercept = Dot(axes.c2p(-2, 0), color=ACCENT)
        touch = Dot(axes.c2p(1, 0), color=SOFT)
        self.play(Create(axes), Create(graph))
        self.play(FadeIn(intercept), FadeIn(touch))

        zero_def = MathTex(r"f(x)=0", font_size=34, color=ACCENT).next_to(zero_group, DOWN, buff=0.35)
        mult_def = MathTex(r"(x-a)^k", font_size=34, color=SOFT).next_to(mult_group, DOWN, buff=0.35)
        self.play(Write(zero_def), Write(mult_def))

        intercept_label = Text("x-intercept", font_size=22, color=ACCENT).next_to(intercept, DOWN, buff=0.2)
        exponent_label = Text("repeated factor exponent", font_size=20, color=SOFT).next_to(mult_def, DOWN, buff=0.2)
        self.play(FadeIn(intercept_label), FadeIn(exponent_label))

        self.play(Indicate(mult_def[0][-1], color=SOFT), Indicate(touch, color=SOFT))
        self.add(footer_note("Zero means an x-value where the graph meets the x-axis."))
        self.wait(2)

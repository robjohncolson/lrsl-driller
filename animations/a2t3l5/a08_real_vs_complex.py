"""
L08 — Real or Complex Zeros?
The level asks students to determine whether a quadratic factor like x²+9
produces real or complex zeros by checking the discriminant.
This animation shows a parabola y=x²-4 (real zeros at ±2) shifting up
to y=x²+9 (no real zeros, complex), with discriminant annotations.

Run with:
manim -qm --format=mp4 a08_real_vs_complex.py RealVsComplex
"""
from manim import *
from common import ACCENT, INK, MUTED, NEG, POS, SOFT, footer_note, setup_scene, simple_axes


class RealVsComplex(Scene):
    def construct(self):
        setup_scene(self, "Real vs Complex Zeros")

        axes = simple_axes(x_range=[-4, 4, 1], y_range=[-5, 12, 2], length=7)
        axes.shift(DOWN * 0.3)

        # Phase 1: x² - 4  (has real zeros)
        real_graph = axes.plot(lambda x: x ** 2 - 4, color=POS, x_range=[-3.4, 3.4])
        real_label = MathTex(r"x^2 - 4", font_size=32, color=POS).next_to(
            axes.c2p(2.5, 2.5), RIGHT, buff=0.15
        )
        dot_neg2 = Dot(axes.c2p(-2, 0), color=ACCENT)
        dot_pos2 = Dot(axes.c2p(2, 0), color=ACCENT)
        real_tag = Text("Real zeros at x = ±2", font_size=22, color=POS).shift(UP * 1.0 + LEFT * 2.5)
        disc_real = MathTex(r"b^2-4ac = 0-4(1)(-4) = 16 > 0", font_size=24, color=POS)
        disc_real.to_edge(LEFT).shift(DOWN * 2.8)

        self.play(Create(axes))
        self.play(Create(real_graph), Write(real_label))
        self.play(FadeIn(dot_neg2), FadeIn(dot_pos2), FadeIn(real_tag))
        self.play(Write(disc_real))
        self.wait(1)

        # Phase 2: animate the shift upward to x² + 9
        shifted_graph = axes.plot(lambda x: x ** 2 + 9, color=NEG, x_range=[-1.6, 1.6])
        shifted_label = MathTex(r"x^2 + 9", font_size=32, color=NEG).next_to(
            axes.c2p(1.5, 11), RIGHT, buff=0.15
        )
        complex_tag = Text("No real zeros", font_size=22, color=NEG).shift(UP * 1.0 + RIGHT * 2.5)
        disc_complex = MathTex(r"b^2-4ac = 0-4(1)(9) = -36 < 0", font_size=24, color=NEG)
        disc_complex.to_edge(RIGHT).shift(DOWN * 2.8)

        # Fade out real annotations, transform graph upward
        self.play(
            FadeOut(real_tag), FadeOut(dot_neg2), FadeOut(dot_pos2),
            FadeOut(real_label),
            Transform(real_graph, shifted_graph),
            run_time=1.2
        )
        self.play(Write(shifted_label), FadeIn(complex_tag))
        self.play(Write(disc_complex))

        # Solution note
        solution = MathTex(r"x^2+9=0 \;\Rightarrow\; x=\pm 3i", font_size=28, color=NEG)
        solution.shift(DOWN * 1.6)
        self.play(Write(solution))

        self.add(footer_note("Check the discriminant: negative means complex zeros."))
        self.wait(2)

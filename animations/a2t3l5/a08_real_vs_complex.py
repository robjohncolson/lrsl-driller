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
from common import ACCENT, BG, INK, MUTED, NEG, POS, SOFT, footer_note, setup_scene, simple_axes


class RealVsComplex(Scene):
    def construct(self):
        setup_scene(self, "Real vs Complex Zeros")

        axes = simple_axes(x_range=[-4, 4, 1], y_range=[-5, 12, 2], length=7)
        axes.shift(DOWN * 0.3)

        real_graph = axes.plot(lambda x: x ** 2 - 4, color=POS, x_range=[-3.4, 3.4])
        real_label = MathTex(r"x^2-4", font_size=32, color=POS).next_to(
            axes.c2p(2.5, 2.5), RIGHT, buff=0.15
        )
        dot_neg2 = Dot(axes.c2p(-2, 0), color=ACCENT)
        dot_pos2 = Dot(axes.c2p(2, 0), color=ACCENT)
        real_tag = Text("Real zeros at x = ±2", font_size=22, color=POS).shift(UP * 1.05 + LEFT * 2.5)
        real_coeffs = VGroup(
            Text("a = 1", font_size=22, color=POS),
            Text("b = 0", font_size=22, color=POS),
            Text("c = -4", font_size=22, color=POS),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.08).to_edge(LEFT).shift(UP * 0.2)
        disc_real = MathTex(r"\Delta = b^2-4ac=0-4(1)(-4)=16>0", font_size=24, color=POS).to_edge(LEFT).shift(DOWN * 2.8)

        shifted_graph = axes.plot(lambda x: x ** 2 + 9, color=NEG, x_range=[-1.6, 1.6])
        shifted_label = MathTex(r"x^2+9", font_size=32, color=NEG).next_to(
            axes.c2p(1.5, 11), RIGHT, buff=0.15
        )
        complex_tag = Text("No real zeros", font_size=22, color=NEG).shift(UP * 1.0 + RIGHT * 2.5)
        complex_coeffs = VGroup(
            Text("a = 1", font_size=22, color=NEG),
            Text("b = 0", font_size=22, color=NEG),
            Text("c = 9", font_size=22, color=NEG),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.08).to_edge(RIGHT).shift(UP * 0.2)
        disc_complex = MathTex(r"\Delta = b^2-4ac=0-4(1)(9)=-36<0", font_size=24, color=NEG).to_edge(RIGHT).shift(DOWN * 2.8)

        boundary = RoundedRectangle(width=5.6, height=1.35, corner_radius=0.14, color=SOFT)
        boundary.set_fill(BG, opacity=1).shift(DOWN * 3.0)
        boundary_text = VGroup(
            Text("Boundary case: Δ = 0", font_size=22, color=SOFT, weight=BOLD),
            MathTex(r"x^2-6x+9=(x-3)^2", font_size=26, color=INK),
            Text("one repeated real zero", font_size=18, color=SOFT)
        ).arrange(DOWN, buff=0.06).move_to(boundary)

        self.play(Create(axes))
        self.play(Create(real_graph), Write(real_label))
        self.play(FadeIn(dot_neg2), FadeIn(dot_pos2), FadeIn(real_tag))
        self.play(FadeIn(real_coeffs, shift=RIGHT * 0.1), Write(disc_real))
        self.wait(0.6)

        self.play(
            FadeOut(real_tag),
            FadeOut(dot_neg2),
            FadeOut(dot_pos2),
            FadeOut(real_label),
            FadeOut(real_coeffs),
            Transform(real_graph, shifted_graph),
            run_time=1.2
        )
        self.play(Write(shifted_label), FadeIn(complex_tag), FadeIn(complex_coeffs, shift=LEFT * 0.1))
        self.play(Write(disc_complex))

        solution = MathTex(r"x^2+9=0 \;\Rightarrow\; x=\pm 3i", font_size=28, color=NEG)
        solution.shift(DOWN * 1.6)
        self.play(Write(solution))
        self.play(Create(boundary), FadeIn(boundary_text))

        self.add(footer_note("Identify a, b, and c first. Then use the discriminant sign."))
        self.wait(2)

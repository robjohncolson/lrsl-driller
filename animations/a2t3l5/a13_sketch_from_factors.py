"""
Run with:
manim -qm --format=mp4 a13_sketch_from_factors.py SketchFromFactors
"""
from manim import *
from common import ACCENT, INK, NEG, POS, SOFT, setup_scene, simple_axes


class SketchFromFactors(Scene):
    def construct(self):
        setup_scene(self, "Sketch from Factors")

        expr = MathTex(r"f(x)=(x+1)^3(x-6)", font_size=40, color=INK).shift(UP * 2.2)
        step1 = Text("1) Zeros: x = -1 and x = 6", font_size=24, color=ACCENT).to_edge(LEFT).shift(UP * 1.15 + RIGHT * 0.45)
        step2 = Text("2) Multiplicities: 3 and 1, so both zeros cross", font_size=24, color=SOFT).next_to(step1, DOWN, buff=0.18, aligned_edge=LEFT)
        step3 = Text("3) Degree 4 with positive leading coefficient: both ends up", font_size=24, color=POS).next_to(step2, DOWN, buff=0.18, aligned_edge=LEFT)

        number_line = NumberLine(x_range=[-3, 8, 1], length=6.8, color=INK, include_numbers=True).shift(DOWN * 0.25 + LEFT * 2.0)
        zeros = VGroup(
            Dot(number_line.n2p(-1), color=ACCENT),
            Dot(number_line.n2p(6), color=ACCENT),
        )
        sign_slots = VGroup(
            Text("?", font_size=28, color=SOFT).next_to(number_line.n2p(-2), DOWN, buff=0.34),
            Text("?", font_size=28, color=SOFT).next_to(number_line.n2p(2), DOWN, buff=0.34),
            Text("?", font_size=28, color=SOFT).next_to(number_line.n2p(7), DOWN, buff=0.34),
        )
        sign_work = VGroup(
            MathTex(r"x=-2:\;(-)^3(-)=+", font_size=26, color=POS),
            MathTex(r"x=0:\;(+ )^3(-)=-", font_size=26, color=NEG),
            MathTex(r"x=7:\;(+ )^3(+)=+", font_size=26, color=POS),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.14).next_to(number_line, DOWN, buff=0.42, aligned_edge=LEFT)
        final_signs = [
            Text("+", font_size=28, color=POS).move_to(sign_slots[0]),
            Text("-", font_size=28, color=NEG).move_to(sign_slots[1]),
            Text("+", font_size=28, color=POS).move_to(sign_slots[2]),
        ]
        conclusion = Text("4) Positive on (-∞, -1) and (6, ∞), negative on (-1, 6).", font_size=23, color=INK).next_to(sign_work, DOWN, buff=0.18, aligned_edge=LEFT)

        axes = simple_axes(x_range=[-3, 7, 1], y_range=[-8, 8, 2], length=5.5)
        axes.shift(RIGHT * 3.15 + DOWN * 1.4)
        graph = axes.plot(lambda x: 0.04 * (x + 1) ** 3 * (x - 6), color=POS, x_range=[-2.4, 6.5])
        graph_zeros = VGroup(
            Dot(axes.c2p(-1, 0), color=ACCENT),
            Dot(axes.c2p(6, 0), color=ACCENT),
        )
        graph_note = Text("5) Sketch: above, below, then above again.", font_size=22, color=POS).next_to(axes, DOWN, buff=0.18)

        self.play(Write(expr))
        self.play(FadeIn(step1, shift=RIGHT * 0.08), FadeIn(step2, shift=RIGHT * 0.08), FadeIn(step3, shift=RIGHT * 0.08))
        self.play(Create(number_line), FadeIn(zeros), LaggedStart(*[FadeIn(slot) for slot in sign_slots], lag_ratio=0.08))
        for slot, calc, final in zip(sign_slots, sign_work, final_signs):
            self.play(FadeIn(calc, shift=UP * 0.05), run_time=0.4)
            self.play(ReplacementTransform(slot, final), run_time=0.3)
        self.play(FadeIn(conclusion, shift=UP * 0.08))
        self.play(Create(axes), Create(graph), FadeIn(graph_zeros))
        self.play(FadeIn(graph_note, shift=UP * 0.08))
        self.wait(2)

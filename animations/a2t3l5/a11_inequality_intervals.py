"""
Run with:
manim -qm --format=mp4 a11_inequality_intervals.py InequalityIntervals
"""
from manim import *
from common import ACCENT, INK, NEG, POS, SOFT, setup_scene


class InequalityIntervals(Scene):
    def construct(self):
        setup_scene(self, "Solve the Inequality")

        prompt = MathTex(r"x(x-2)(x+2)>0", font_size=40, color=INK).shift(UP * 2.15)
        number_line = NumberLine(x_range=[-4, 4, 1], length=8.5, color=INK, include_numbers=True).shift(UP * 0.9)
        zeros = VGroup(
            Dot(number_line.n2p(-2), color=ACCENT),
            Dot(number_line.n2p(0), color=ACCENT),
            Dot(number_line.n2p(2), color=ACCENT),
        )
        sign_slots = VGroup(
            Text("?", font_size=28, color=SOFT).next_to(number_line.n2p(-3), DOWN, buff=0.38),
            Text("?", font_size=28, color=SOFT).next_to(number_line.n2p(-1), DOWN, buff=0.38),
            Text("?", font_size=28, color=SOFT).next_to(number_line.n2p(1), DOWN, buff=0.38),
            Text("?", font_size=28, color=SOFT).next_to(number_line.n2p(3), DOWN, buff=0.38),
        )
        evals = VGroup(
            MathTex(r"x=-3:\;(-)(-)(-)=-", font_size=28, color=NEG),
            MathTex(r"x=-1:\;(-)(-)(+)=+", font_size=28, color=POS),
            MathTex(r"x=1:\;(+)(-)(+)=-", font_size=28, color=NEG),
            MathTex(r"x=3:\;(+)(+)(+)=+", font_size=28, color=POS),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.16).shift(DOWN * 1.1)
        final_signs = [
            Text("-", font_size=28, color=NEG).move_to(sign_slots[0]),
            Text("+", font_size=28, color=POS).move_to(sign_slots[1]),
            Text("-", font_size=28, color=NEG).move_to(sign_slots[2]),
            Text("+", font_size=28, color=POS).move_to(sign_slots[3]),
        ]
        strict_note = Text("For > 0, use parentheses. The zeros are not included.", font_size=22, color=ACCENT).shift(DOWN * 2.15)
        strict_solution = MathTex(r"(-2,0)\cup(2,\infty)", font_size=34, color=POS).shift(DOWN * 2.85)

        second_title = Text("If the inequality were ≥ 0, keep the same positive intervals and include the zeros.", font_size=20, color=SOFT).shift(DOWN * 3.5)
        second_line = NumberLine(x_range=[-4, 4, 1], length=6.5, color=INK, include_numbers=False).shift(DOWN * 4.2)
        second_dots = VGroup(
            Dot(second_line.n2p(-2), color=SOFT),
            Dot(second_line.n2p(0), color=SOFT),
            Dot(second_line.n2p(2), color=SOFT),
        )
        second_segments = VGroup(
            Line(second_line.n2p(-2), second_line.n2p(0), color=SOFT, stroke_width=8),
            Line(second_line.n2p(2), second_line.n2p(4), color=SOFT, stroke_width=8),
        )
        second_solution = MathTex(r"[-2,0]\cup[2,\infty)", font_size=30, color=SOFT).next_to(second_line, DOWN, buff=0.16)

        self.play(Write(prompt))
        self.play(Create(number_line), FadeIn(zeros), LaggedStart(*[FadeIn(slot) for slot in sign_slots], lag_ratio=0.08))
        for slot, calc, final in zip(sign_slots, evals, final_signs):
            self.play(FadeIn(calc, shift=UP * 0.05), run_time=0.4)
            self.play(ReplacementTransform(slot, final), run_time=0.3)
        self.play(FadeIn(strict_note, shift=UP * 0.05), Write(strict_solution))
        self.play(FadeIn(second_title), Create(second_line), Create(second_segments), FadeIn(second_dots))
        self.play(Write(second_solution))
        self.wait(2)

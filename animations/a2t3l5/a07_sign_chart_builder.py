"""
Run with:
manim -qm --format=mp4 a07_sign_chart_builder.py SignChartBuilder
"""
from manim import *
from common import ACCENT, INK, MUTED, NEG, POS, SOFT, setup_scene


class SignChartBuilder(Scene):
    def construct(self):
        setup_scene(self, "Sign Chart Builder")

        expr = MathTex(r"f(x)=x(x-4)(x+3)>0", font_size=40, color=INK).shift(UP * 2.2)
        number_line = NumberLine(x_range=[-6, 6, 1], length=9.4, color=INK, include_numbers=True)
        number_line.shift(UP * 0.7)
        zeros = VGroup(
            Dot(number_line.n2p(-3), color=ACCENT),
            Dot(number_line.n2p(0), color=ACCENT),
            Dot(number_line.n2p(4), color=ACCENT)
        )
        zero_labels = VGroup(
            MathTex(r"-3", font_size=24, color=ACCENT).next_to(zeros[0], UP, buff=0.12),
            MathTex(r"0", font_size=24, color=ACCENT).next_to(zeros[1], UP, buff=0.12),
            MathTex(r"4", font_size=24, color=ACCENT).next_to(zeros[2], UP, buff=0.12),
        )
        sign_slots = VGroup(
            Text("?", font_size=30, color=MUTED).next_to(number_line.n2p(-4.5), DOWN, buff=0.45),
            Text("?", font_size=30, color=MUTED).next_to(number_line.n2p(-1.5), DOWN, buff=0.45),
            Text("?", font_size=30, color=MUTED).next_to(number_line.n2p(2.0), DOWN, buff=0.45),
            Text("?", font_size=30, color=MUTED).next_to(number_line.n2p(5.0), DOWN, buff=0.45),
        )
        intervals = [
            Line(number_line.n2p(-6), number_line.n2p(-3.15), color=SOFT, stroke_width=7),
            Line(number_line.n2p(-2.85), number_line.n2p(-0.15), color=SOFT, stroke_width=7),
            Line(number_line.n2p(0.15), number_line.n2p(3.85), color=SOFT, stroke_width=7),
            Line(number_line.n2p(4.15), number_line.n2p(6), color=SOFT, stroke_width=7),
        ]
        calculations = VGroup(
            MathTex(r"x=-5:\;(-5)(-9)(-2)=(-)(-)(-)=-", font_size=28, color=NEG),
            MathTex(r"x=-1:\;(-1)(-5)(2)=(-)(-)(+)=+", font_size=28, color=POS),
            MathTex(r"x=1:\;(1)(-3)(4)=(+)(-)(+)=-", font_size=28, color=NEG),
            MathTex(r"x=5:\;(5)(1)(8)=(+)(+)(+)=+", font_size=28, color=POS),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.18).shift(DOWN * 1.65)
        final_signs = [
            Text("-", font_size=30, color=NEG).move_to(sign_slots[0]),
            Text("+", font_size=30, color=POS).move_to(sign_slots[1]),
            Text("-", font_size=30, color=NEG).move_to(sign_slots[2]),
            Text("+", font_size=30, color=POS).move_to(sign_slots[3]),
        ]
        highlight_segments = VGroup(
            Line(number_line.n2p(-2.85), number_line.n2p(-0.15), color=POS, stroke_width=9),
            Line(number_line.n2p(4.15), number_line.n2p(6), color=POS, stroke_width=9),
        )
        solution = MathTex(r"(-3,0)\cup(4,\infty)", font_size=34, color=POS).shift(DOWN * 3.0)

        self.play(Write(expr))
        self.play(Create(number_line), FadeIn(zeros), FadeIn(zero_labels))
        self.play(LaggedStart(*[FadeIn(slot) for slot in sign_slots], lag_ratio=0.1))

        for interval, calc, slot, final_sign in zip(intervals, calculations, sign_slots, final_signs):
            self.play(Create(interval), FadeIn(calc, shift=UP * 0.08), run_time=0.5)
            self.play(ReplacementTransform(slot, final_sign), run_time=0.35)

        self.play(Create(highlight_segments), Write(solution))
        self.wait(2)

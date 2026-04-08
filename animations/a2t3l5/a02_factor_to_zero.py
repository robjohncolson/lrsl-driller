"""
L02 — Factor to Zero
The level gives ONE factor at a time and asks "what zero does it produce?"
This animation shows three individual factors being set = 0 and solved,
including a leading-coefficient case (2x - 4) that requires dividing.

Run with:
manim -qm --format=mp4 a02_factor_to_zero.py FactorToZero
"""
from manim import *
from common import ACCENT, BG, INK, NEG, POS, SOFT, footer_note, setup_scene


class FactorToZero(Scene):
    def construct(self):
        setup_scene(self, "Factor → Zero")

        pairs = [
            (
                MathTex(r"(x-5)=0", font_size=34, color=INK),
                MathTex(r"x=5", font_size=34, color=ACCENT),
                Text("Undo -5 by adding 5.", font_size=20, color=ACCENT)
            ),
            (
                MathTex(r"(x+3)=0", font_size=34, color=INK),
                MathTex(r"x+3=0\Rightarrow x=-3", font_size=34, color=SOFT),
                Text("The sign flips because you subtract 3.", font_size=20, color=SOFT)
            ),
            (
                VGroup(
                    MathTex(r"(2x-4)=0", font_size=34, color=INK),
                    MathTex(r"2x=4", font_size=34, color=POS),
                    MathTex(r"x=2", font_size=34, color=POS)
                ).arrange(RIGHT, buff=0.28),
                Text("First isolate 2x, then divide by 2.", font_size=20, color=POS),
                None
            ),
            (
                VGroup(
                    MathTex(r"(3x-1)=0", font_size=34, color=INK),
                    MathTex(r"3x=1", font_size=34, color=NEG),
                    MathTex(r"x=\frac{1}{3}", font_size=34, color=NEG)
                ).arrange(RIGHT, buff=0.28),
                Text("Fraction answers happen when the coefficient stays.", font_size=20, color=NEG),
                None
            ),
        ]

        rows = VGroup()
        for first, second, third in pairs:
            pieces = [first]
            if second is not None:
                pieces.append(second)
            if third is not None:
                pieces.append(third)
            row = VGroup(*pieces).arrange(DOWN, aligned_edge=LEFT, buff=0.16)
            rows.add(row)

        rows.arrange(DOWN, aligned_edge=LEFT, buff=0.42).shift(UP * 0.2)

        for row in rows:
            self.play(FadeIn(row[0], shift=RIGHT * 0.15), run_time=0.4)
            for piece in row[1:]:
                self.play(FadeIn(piece, shift=DOWN * 0.1), run_time=0.45)
            self.play(Indicate(row[0], color=ACCENT), run_time=0.3)

        divide_note = Text("If the factor starts with 2x or 3x, divide by that coefficient.", font_size=22, color=NEG)
        divide_note.next_to(rows[-1], DOWN, buff=0.28, aligned_edge=LEFT)
        self.play(FadeIn(divide_note, shift=UP * 0.1))

        self.add(footer_note("Set the factor equal to 0, undo + or -, then divide if needed."))
        self.wait(2)

"""
Run with:
manim -qm --format=mp4 a03_multiplicity_id.py MultiplicityID
"""
from manim import *
from common import ACCENT, BG, INK, SOFT, footer_note, setup_scene


class MultiplicityID(Scene):
    def construct(self):
        setup_scene(self, "Read the Exponent")

        factors = VGroup(
            MathTex(r"(x-2)^3", font_size=42, color=INK),
            MathTex(r"(x+1)^2", font_size=42, color=INK),
            MathTex(r"x", font_size=42, color=INK)
        ).arrange(RIGHT, buff=0.14).shift(UP * 1.8)
        self.play(Write(factors))

        highlights = [
            SurroundingRectangle(factors[0], color=ACCENT, buff=0.08),
            SurroundingRectangle(factors[1], color=SOFT, buff=0.08),
            SurroundingRectangle(factors[2], color=ACCENT, buff=0.08),
        ]
        for box in highlights:
            self.play(Create(box), run_time=0.4)

        rows = VGroup(
            MathTex(r"x=2 \quad\rightarrow\quad m=3", font_size=32, color=ACCENT),
            MathTex(r"x=-1 \quad\rightarrow\quad m=2", font_size=32, color=SOFT),
            MathTex(r"x=0 \quad\rightarrow\quad m=1", font_size=32, color=INK)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.35)
        rows.shift(DOWN * 0.4)
        self.play(LaggedStart(*[Write(row) for row in rows], lag_ratio=0.2))

        callout = MathTex(r"x = x^1", font_size=34, color=ACCENT).next_to(factors[2], DOWN, buff=0.35)
        note = Text("No written exponent means multiplicity 1.", font_size=22, color=ACCENT).next_to(callout, DOWN, buff=0.12)
        self.play(FadeIn(callout, shift=UP * 0.1), FadeIn(note))

        self.add(footer_note("Always treat a bare x factor as x to the first power."))
        self.wait(2)

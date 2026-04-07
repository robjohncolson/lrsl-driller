"""
Run with:
manim -qm --format=mp4 a03_multiplicity_id.py MultiplicityID
"""
from manim import *
from common import ACCENT, BG, INK, SOFT, footer_note, setup_scene


class MultiplicityID(Scene):
    def construct(self):
        setup_scene(self, "Read the Exponent")

        expr = MathTex(r"(x-2)^3(x+1)^2x", font_size=42, color=INK)
        expr.shift(UP * 1.5)
        self.play(Write(expr))

        highlights = [
            SurroundingRectangle(expr[0][4:6], color=ACCENT, buff=0.08),
            SurroundingRectangle(expr[0][11:13], color=SOFT, buff=0.08),
            SurroundingRectangle(expr[0][-1], color=ACCENT, buff=0.08)
        ]
        for box in highlights:
            self.play(Create(box), run_time=0.4)

        rows = VGroup(
            MathTex(r"x=2 \quad\rightarrow\quad m=3", font_size=32, color=ACCENT),
            MathTex(r"x=-1 \quad\rightarrow\quad m=2", font_size=32, color=SOFT),
            MathTex(r"x=0 \quad\rightarrow\quad m=1", font_size=32, color=INK)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.35)
        rows.shift(DOWN * 0.8)
        self.play(LaggedStart(*[Write(row) for row in rows], lag_ratio=0.2))

        self.add(footer_note("No written exponent means multiplicity 1."))
        self.wait(2)

"""
Run with:
manim -qm --format=mp4 a06_zero_report_table.py ZeroReportTable
"""
from manim import *
from common import ACCENT, BG, INK, POS, SOFT, setup_scene


class ZeroReportTable(Scene):
    def construct(self):
        setup_scene(self, "Build the Zero Report")

        expr = MathTex(r"x(x+4)(x-1)^4", font_size=42, color=INK).shift(UP * 2.0)
        self.play(Write(expr))

        headers = VGroup(
            Text("Zero", font_size=24, color=INK),
            Text("Multiplicity", font_size=24, color=INK),
            Text("Behavior", font_size=24, color=INK)
        ).arrange(RIGHT, buff=1.2).shift(UP * 0.8)

        rows = VGroup(
            Text("-4", font_size=24, color=ACCENT),
            Text("1", font_size=24, color=ACCENT),
            Text("cross", font_size=24, color=ACCENT),
            Text("0", font_size=24, color=POS),
            Text("1", font_size=24, color=POS),
            Text("cross", font_size=24, color=POS),
            Text("1", font_size=24, color=SOFT),
            Text("4", font_size=24, color=SOFT),
            Text("touch", font_size=24, color=SOFT)
        )
        rows.arrange_in_grid(rows=3, cols=3, buff=(0.45, 1.35)).shift(DOWN * 0.7)

        frame = RoundedRectangle(width=8.2, height=3.3, corner_radius=0.15, color=INK).set_fill(BG, opacity=0.2)
        frame.move_to(rows)

        self.play(FadeIn(headers), Create(frame))
        self.play(LaggedStart(*[FadeIn(item, shift=UP * 0.15) for item in rows], lag_ratio=0.08))
        self.wait(2)

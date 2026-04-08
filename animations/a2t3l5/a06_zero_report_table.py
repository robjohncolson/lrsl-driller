"""
Run with:
manim -qm --format=mp4 a06_zero_report_table.py ZeroReportTable
"""
from manim import *
from common import ACCENT, BG, INK, POS, SOFT, footer_note, setup_scene


class ZeroReportTable(Scene):
    def construct(self):
        setup_scene(self, "Build the Zero Report")

        factors = VGroup(
            MathTex(r"x", font_size=42, color=INK),
            MathTex(r"(x+4)", font_size=42, color=INK),
            MathTex(r"(x-1)^4", font_size=42, color=INK)
        ).arrange(RIGHT, buff=0.18).shift(UP * 2.0)
        self.play(Write(factors))

        format_note = Text(
            "Fill one row per factor: (zero, multiplicity, cross/touch)",
            font_size=22,
            color=ACCENT
        ).next_to(factors, DOWN, buff=0.18)
        self.play(FadeIn(format_note, shift=UP * 0.1))

        headers = VGroup(
            Text("Zero", font_size=24, color=INK),
            Text("Multiplicity", font_size=24, color=INK),
            Text("Behavior", font_size=24, color=INK)
        ).arrange(RIGHT, buff=1.35).shift(RIGHT * 2.25 + UP * 0.75)

        frame = RoundedRectangle(width=7.5, height=3.35, corner_radius=0.15, color=INK).set_fill(BG, opacity=0.2)
        frame.move_to(RIGHT * 2.25 + DOWN * 0.2)
        verticals = VGroup(
            Line(frame.get_top() + LEFT * 1.15, frame.get_bottom() + LEFT * 1.15, color=INK, stroke_width=1.5),
            Line(frame.get_top() + RIGHT * 1.35, frame.get_bottom() + RIGHT * 1.35, color=INK, stroke_width=1.5),
        )
        horizontals = VGroup(
            Line(frame.get_left() + UP * 0.45, frame.get_right() + UP * 0.45, color=INK, stroke_width=1.5),
            Line(frame.get_left() + DOWN * 0.35, frame.get_right() + DOWN * 0.35, color=INK, stroke_width=1.5),
            Line(frame.get_left() + DOWN * 1.15, frame.get_right() + DOWN * 1.15, color=INK, stroke_width=1.5),
        )

        row_y = [0.8, 0.0, -0.8]
        row_entries = [
            VGroup(
                Text("0", font_size=24, color=ACCENT),
                Text("1", font_size=24, color=ACCENT),
                Text("cross", font_size=24, color=ACCENT)
            ).arrange(RIGHT, buff=1.7).move_to(frame.get_center() + UP * row_y[0]),
            VGroup(
                Text("-4", font_size=24, color=POS),
                Text("1", font_size=24, color=POS),
                Text("cross", font_size=24, color=POS)
            ).arrange(RIGHT, buff=1.55).move_to(frame.get_center() + UP * row_y[1]),
            VGroup(
                Text("1", font_size=24, color=SOFT),
                Text("4", font_size=24, color=SOFT),
                Text("touch", font_size=24, color=SOFT)
            ).arrange(RIGHT, buff=1.65).move_to(frame.get_center() + UP * row_y[2]),
        ]

        explanations = VGroup(
            Text("x  → zero 0, mult 1, odd → cross", font_size=22, color=ACCENT),
            Text("(x+4) → zero -4, mult 1, odd → cross", font_size=22, color=POS),
            Text("(x-1)^4 → zero 1, mult 4, even → touch", font_size=22, color=SOFT),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.45).shift(LEFT * 3.2 + DOWN * 0.15)

        highlights = [
            SurroundingRectangle(factors[0], color=ACCENT, buff=0.08),
            SurroundingRectangle(factors[1], color=POS, buff=0.08),
            SurroundingRectangle(factors[2], color=SOFT, buff=0.08),
        ]

        self.play(FadeIn(headers), Create(frame), Create(verticals), Create(horizontals))

        for highlight, explanation, entry in zip(highlights, explanations, row_entries):
            self.play(Create(highlight), FadeIn(explanation, shift=RIGHT * 0.1), run_time=0.5)
            self.play(LaggedStart(*[FadeIn(item, shift=UP * 0.1) for item in entry], lag_ratio=0.08), run_time=0.5)
            self.play(FadeOut(highlight), run_time=0.2)

        self.add(footer_note("Read each factor one at a time, then write the row in the report table."))
        self.wait(2)

"""
Show degrees of freedom for a two-way chi-square test vs. goodness-of-fit.

Render:
manim -qm --format=mp4 animations/apstat_86_degrees_of_freedom_twoway.py DegreesOfFreedomTwoWay
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class DegreesOfFreedomTwoWay(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Degrees of Freedom", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "Two-way table vs. Goodness-of-Fit",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- Two-way formula ---
        tw_label = Text(
            "Homogeneity / Independence",
            font_size=26, color=BLUE_3B1B, weight=BOLD,
        )
        tw_label.shift(UP * 1.1 + LEFT * 2.5)

        tw_formula_box = RoundedRectangle(
            corner_radius=0.15, width=10.0, height=0.75,
            stroke_color=BLUE_3B1B, stroke_width=3,
        )
        tw_formula_box.set_fill(BLUE_3B1B, opacity=0.06)
        tw_formula_box.shift(UP * 0.45)

        tw_formula = Text(
            "df = (rows \u2212 1)(columns \u2212 1)",
            font_size=28,
        )
        tw_formula.move_to(tw_formula_box.get_center())

        # --- Example calculation ---
        example_box = RoundedRectangle(
            corner_radius=0.15, width=10.0, height=1.6,
            stroke_color=TEAL_3B1B, stroke_width=3,
        )
        example_box.set_fill(TEAL_3B1B, opacity=0.06)
        example_box.shift(DOWN * 0.65)

        ex_title = Text(
            "School data: 3 types \u00d7 2 years",
            font_size=24, color=TEAL_3B1B, weight=BOLD,
        )
        ex_calc = Text(
            "df = (3\u22121)(2\u22121) = (2)(1) = 2",
            font_size=28,
        )
        ex_stack = VGroup(ex_title, ex_calc).arrange(DOWN, buff=0.22)
        ex_stack.move_to(example_box.get_center())

        # --- GOF contrast ---
        gof_label = Text(
            "Goodness-of-Fit (contrast)",
            font_size=26, color=PINK_3B1B, weight=BOLD,
        )
        gof_label.shift(DOWN * 1.85 + LEFT * 2.2)

        gof_box = RoundedRectangle(
            corner_radius=0.15, width=10.0, height=0.75,
            stroke_color=PINK_3B1B, stroke_width=3,
        )
        gof_box.set_fill(PINK_3B1B, opacity=0.06)
        gof_box.shift(DOWN * 2.5)

        gof_formula = Text(
            "df = categories \u2212 1",
            font_size=28,
        )
        gof_formula.move_to(gof_box.get_center())

        gof_note = Text(
            "GOF: 3 categories \u2192 df = 2      (same number, different reason!)",
            font_size=20,
            color=GRAY_B,
        )
        gof_note.next_to(gof_box, DOWN, buff=0.15)

        # --- Animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)

        self.play(FadeIn(tw_label, shift=RIGHT * 0.15), run_time=0.5)
        self.play(
            DrawBorderThenFill(tw_formula_box), Write(tw_formula), run_time=1.2,
        )

        self.play(DrawBorderThenFill(example_box), run_time=0.6)
        self.play(Write(ex_title), run_time=0.6)
        self.play(Write(ex_calc), run_time=1.2)

        self.play(FadeIn(gof_label, shift=RIGHT * 0.15), run_time=0.5)
        self.play(
            DrawBorderThenFill(gof_box), Write(gof_formula), run_time=1.2,
        )
        self.play(FadeIn(gof_note, shift=UP * 0.1), run_time=0.6)
        self.wait(1.8)

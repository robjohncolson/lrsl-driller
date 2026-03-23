"""
Demonstrate the subtraction shortcut: once all but one expected count in a
row or column is known, the last one equals the marginal total minus the rest.

Render:
manim -qm --format=mp4 animations/apstat_84_subtraction_shortcut.py SubtractionShortcut
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class SubtractionShortcut(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Subtraction Shortcut", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "Expected counts in a column must add to the column total",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- mini table (expected counts, 2019 column only) ---
        col_w = 2.0
        row_h = 0.6
        x0 = -2.5
        y0 = 1.0

        def cell(r, c):
            return np.array([x0 + (c + 0.5) * col_w, y0 - r * row_h, 0])

        grid = VGroup()
        for r in range(5):
            y = y0 - r * row_h + row_h / 2
            grid.add(Line(np.array([x0, y, 0]), np.array([x0 + 2 * col_w, y, 0]),
                          color=GRAY_C, stroke_width=2))
        for c in range(3):
            x = x0 + c * col_w
            grid.add(Line(np.array([x, y0 + row_h / 2, 0]),
                          np.array([x, y0 - 4 * row_h + row_h / 2, 0]),
                          color=GRAY_C, stroke_width=2))

        # headers
        h1 = Text("School Type", font_size=24, color=TEAL_3B1B, weight=BOLD)
        h1.move_to(cell(0, 0))
        h2 = Text("Exp. 2019", font_size=24, color=TEAL_3B1B, weight=BOLD)
        h2.move_to(cell(0, 1))

        labels = VGroup(
            Text("Public", font_size=24, color=GRAY_B),
            Text("Private", font_size=24, color=GRAY_B),
            Text("Home", font_size=24, color=GRAY_B),
            Text("Total", font_size=24, color=YELLOW_3B1B, weight=BOLD),
        )
        for i, lbl in enumerate(labels):
            lbl.move_to(cell(i + 1, 0))

        known1 = Text("257.1", font_size=26, color=BLUE_3B1B, weight=BOLD)
        known1.move_to(cell(1, 1))
        known2 = Text("22.2", font_size=26, color=BLUE_3B1B, weight=BOLD)
        known2.move_to(cell(2, 1))

        question = Text("?", font_size=30, color=PINK_3B1B, weight=BOLD)
        question.move_to(cell(3, 1))

        col_total = Text("320", font_size=26, color=YELLOW_3B1B, weight=BOLD)
        col_total.move_to(cell(4, 1))

        # calculation on the right
        calc_box = RoundedRectangle(
            corner_radius=0.2, width=5.0, height=2.6,
            stroke_color=GREEN_3B1B, stroke_width=4,
        )
        calc_box.set_fill(GREEN_3B1B, opacity=0.08)
        calc_box.shift(RIGHT * 3.2 + DOWN * 0.3)

        step1 = Text("Column total = 320", font_size=26, color=YELLOW_3B1B)
        step2 = Text("Known expected counts:", font_size=24, color=WHITE)
        step3 = Text("257.1 + 22.2 = 279.3", font_size=26, color=BLUE_3B1B)
        step4 = Text("Home (2019) expected:", font_size=24, color=WHITE)
        step5 = Text("320 - 279.3 = 40.7", font_size=30, color=GREEN_3B1B, weight=BOLD)

        calc_steps = VGroup(step1, step2, step3, step4, step5).arrange(DOWN, buff=0.2)
        calc_steps.move_to(calc_box.get_center())

        # reveal answer in table
        answer = Text("40.7", font_size=26, color=GREEN_3B1B, weight=BOLD)
        answer.move_to(cell(3, 1))

        # bottom insight
        insight_box = RoundedRectangle(
            corner_radius=0.2, width=10.0, height=0.85,
            stroke_color=PINK_3B1B, stroke_width=4,
        )
        insight_box.set_fill(PINK_3B1B, opacity=0.08)
        insight_box.to_edge(DOWN, buff=0.35)
        insight_text = Text(
            "Only need to compute (R-1)(C-1) cells by formula — the rest subtract!",
            font_size=24, color=WHITE,
        )
        insight_text.move_to(insight_box.get_center())

        # --- animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)
        self.play(Create(grid), FadeIn(h1), FadeIn(h2), FadeIn(labels), run_time=1.0)
        self.play(FadeIn(known1, shift=UP * 0.1), FadeIn(known2, shift=UP * 0.1), run_time=0.8)
        self.play(FadeIn(question, scale=1.3), FadeIn(col_total), run_time=0.8)
        self.play(DrawBorderThenFill(calc_box), run_time=0.5)
        self.play(
            LaggedStart(
                Write(step1), Write(step2), Write(step3),
                Write(step4), Write(step5),
                lag_ratio=0.35, run_time=3.5,
            )
        )
        self.play(
            FadeOut(question),
            FadeIn(answer, scale=1.4),
            run_time=1.0,
        )
        self.play(DrawBorderThenFill(insight_box), Write(insight_text), run_time=1.3)
        self.wait(1.8)

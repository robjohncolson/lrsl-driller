"""
Build a two-way table with School Type rows and Year columns, then highlight totals.

Render:
manim -qm --format=mp4 animations/apstat_84_two_way_table_layout.py TwoWayTableLayout
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class TwoWayTableLayout(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Two-Way Table Layout", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "Rows = School Type, Columns = Year",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- table geometry ---
        col_w = 1.55
        row_h = 0.55
        cols = 4  # label, 2019, 2020, total
        rows = 5  # header, public, private, home, total

        def cell_center(r, c):
            x = -3.0 + (c + 0.5) * col_w
            y = 1.1 - r * row_h
            return np.array([x, y, 0])

        # headers
        headers = ["", "2019", "2020", "Total"]
        row_labels = ["", "Public", "Private", "Home", "Total"]
        data = [
            [266, 163, None],
            [16, 21, None],
            [38, 30, None],
        ]

        header_texts = VGroup()
        for c, h in enumerate(headers):
            t = Text(h, font_size=26, color=TEAL_3B1B, weight=BOLD)
            t.move_to(cell_center(0, c))
            header_texts.add(t)

        label_texts = VGroup()
        for r in range(1, 5):
            t = Text(row_labels[r], font_size=26, color=TEAL_3B1B, weight=BOLD)
            t.move_to(cell_center(r, 0))
            label_texts.add(t)

        # grid lines
        grid = VGroup()
        for r in range(rows + 1):
            y = 1.1 - r * row_h + row_h / 2
            grid.add(Line(
                np.array([-3.0, y, 0]),
                np.array([-3.0 + cols * col_w, y, 0]),
                color=GRAY_C, stroke_width=2,
            ))
        for c in range(cols + 1):
            x = -3.0 + c * col_w
            grid.add(Line(
                np.array([x, 1.1 + row_h / 2, 0]),
                np.array([x, 1.1 - rows * row_h + row_h / 2, 0]),
                color=GRAY_C, stroke_width=2,
            ))

        # data cells (observed)
        data_texts = VGroup()
        for r_idx, row_data in enumerate(data):
            for c_idx in range(2):
                t = Text(str(row_data[c_idx]), font_size=26, color=WHITE)
                t.move_to(cell_center(r_idx + 1, c_idx + 1))
                data_texts.add(t)

        # row totals
        row_totals = [266 + 163, 16 + 21, 38 + 30]  # 429, 37, 68
        row_total_texts = VGroup()
        for r_idx, rt in enumerate(row_totals):
            t = Text(str(rt), font_size=26, color=YELLOW_3B1B, weight=BOLD)
            t.move_to(cell_center(r_idx + 1, 3))
            row_total_texts.add(t)

        # column totals
        col_totals = [266 + 16 + 38, 163 + 21 + 30]  # 320, 214
        col_total_texts = VGroup()
        for c_idx, ct in enumerate(col_totals):
            t = Text(str(ct), font_size=26, color=YELLOW_3B1B, weight=BOLD)
            t.move_to(cell_center(4, c_idx + 1))
            col_total_texts.add(t)

        # grand total
        grand = Text("534", font_size=26, color=GREEN_3B1B, weight=BOLD)
        grand.move_to(cell_center(4, 3))

        # highlight boxes
        row_highlight = RoundedRectangle(
            corner_radius=0.08, width=cols * col_w + 0.1, height=row_h + 0.06,
            stroke_color=YELLOW_3B1B, stroke_width=3,
        )
        row_highlight.set_fill(YELLOW_3B1B, opacity=0.08)
        row_highlight.move_to(cell_center(4, 1.5))

        col_highlight = RoundedRectangle(
            corner_radius=0.08, width=col_w + 0.06, height=(rows - 1) * row_h + 0.06,
            stroke_color=YELLOW_3B1B, stroke_width=3,
        )
        col_highlight.set_fill(YELLOW_3B1B, opacity=0.08)
        col_highlight.move_to(cell_center(2.5, 3))

        grand_highlight = RoundedRectangle(
            corner_radius=0.08, width=col_w + 0.06, height=row_h + 0.06,
            stroke_color=GREEN_3B1B, stroke_width=3,
        )
        grand_highlight.set_fill(GREEN_3B1B, opacity=0.12)
        grand_highlight.move_to(cell_center(4, 3))

        # callout
        callout = RoundedRectangle(
            corner_radius=0.2, width=4.6, height=1.0,
            stroke_color=GREEN_3B1B, stroke_width=4,
        )
        callout.set_fill(GREEN_3B1B, opacity=0.08)
        callout.to_edge(DOWN, buff=0.45)
        callout_text = Text(
            "Row totals + Column totals + Grand total\nare essential for expected counts",
            font_size=24, color=WHITE, line_spacing=0.9,
        )
        callout_text.move_to(callout.get_center())

        # --- animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)
        self.play(Create(grid), run_time=0.8)
        self.play(FadeIn(header_texts), FadeIn(label_texts), run_time=0.8)
        self.play(FadeIn(data_texts, shift=UP * 0.1), run_time=1.2)
        self.play(
            FadeIn(row_total_texts, shift=LEFT * 0.15),
            FadeIn(col_highlight, scale=1.05),
            run_time=1.2,
        )
        self.play(
            FadeIn(col_total_texts, shift=UP * 0.15),
            FadeIn(row_highlight, scale=1.05),
            run_time=1.2,
        )
        self.play(
            FadeIn(grand, scale=1.3),
            FadeIn(grand_highlight, scale=1.1),
            run_time=1.0,
        )
        self.play(DrawBorderThenFill(callout), Write(callout_text), run_time=1.4)
        self.wait(1.8)

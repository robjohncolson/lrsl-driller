"""
Highlight the largest cell contribution to explain what drove the significant result.

Render:
manim -qm --format=mp4 animations/apstat_86_largest_contribution_twoway.py LargestContributionTwoWay
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class LargestContributionTwoWay(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Largest Contributions", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "Which cells drove the significant result?",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- Contribution table ---
        # Headers
        hdr_blank = Text("", font_size=24)
        hdr_2019 = Text("2019", font_size=24, color=BLUE_3B1B, weight=BOLD)
        hdr_2020 = Text("2020", font_size=24, color=TEAL_3B1B, weight=BOLD)

        hdr_row = VGroup(hdr_blank, hdr_2019, hdr_2020).arrange(RIGHT, buff=1.6)
        hdr_blank.set_width(1.8)
        hdr_row.shift(UP * 1.0)

        # Data: (label, val_2019, val_2020, highlight_index)
        # Contributions: Public 0.31/0.46, Private 2.93/4.58, Charter 0.01/0.00
        rows_data = [
            ("Public", "0.31", "0.46"),
            ("Private", "2.93", "4.58"),
            ("Charter", "0.01", "0.00"),
        ]

        table_rows = VGroup()
        all_val_mobs = []
        for i, (label, v19, v20) in enumerate(rows_data):
            lbl = Text(label, font_size=24, color=WHITE, weight=BOLD)
            lbl.set_width(1.8)
            val19 = Text(v19, font_size=26, color=WHITE)
            val20 = Text(v20, font_size=26, color=WHITE)
            row = VGroup(lbl, val19, val20).arrange(RIGHT, buff=1.6)
            table_rows.add(row)
            all_val_mobs.append((val19, val20))

        table_rows.arrange(DOWN, buff=0.32, aligned_edge=LEFT)
        table_rows.next_to(hdr_row, DOWN, buff=0.3)

        # --- Highlight boxes around largest contributors ---
        # Private/2020 = 4.58 (largest), Private/2019 = 2.93 (second)
        priv_2020_val = all_val_mobs[1][1]  # 4.58
        priv_2019_val = all_val_mobs[1][0]  # 2.93

        highlight_box_1 = SurroundingRectangle(
            priv_2020_val, color=PINK_3B1B, buff=0.12,
            corner_radius=0.1, stroke_width=3,
        )
        highlight_box_2 = SurroundingRectangle(
            priv_2019_val, color=PINK_3B1B, buff=0.12,
            corner_radius=0.1, stroke_width=3,
        )

        largest_label = Text(
            "Largest", font_size=20, color=PINK_3B1B, weight=BOLD,
        )
        largest_label.next_to(highlight_box_1, RIGHT, buff=0.15)

        # --- Interpretation ---
        interp_box = RoundedRectangle(
            corner_radius=0.15, width=12.0, height=1.5,
            stroke_color=GREEN_3B1B, stroke_width=3,
        )
        interp_box.set_fill(GREEN_3B1B, opacity=0.06)
        interp_box.to_edge(DOWN, buff=0.35)

        interp_title = Text(
            "Interpretation", font_size=24, color=GREEN_3B1B, weight=BOLD,
        )
        interp_title.move_to(interp_box.get_top() + DOWN * 0.22)

        interp_line1 = Text(
            "Private schools had more parents in 2020 than expected (23 vs 14.8)",
            font_size=22, color=WHITE,
        )
        interp_line2 = Text(
            "and fewer in 2019 than expected (14 vs 22.0) \u2014 the biggest shift.",
            font_size=22, color=WHITE,
        )
        interp_stack = VGroup(interp_line1, interp_line2).arrange(
            DOWN, buff=0.12, aligned_edge=LEFT,
        )
        interp_stack.next_to(interp_title, DOWN, buff=0.18)

        # --- Animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)

        self.play(
            FadeIn(hdr_row, shift=DOWN * 0.1), run_time=0.5,
        )
        self.play(
            LaggedStart(
                *[FadeIn(r, shift=RIGHT * 0.15) for r in table_rows],
                lag_ratio=0.3, run_time=2.0,
            )
        )

        # Highlight largest
        self.play(
            Create(highlight_box_1), FadeIn(largest_label), run_time=0.8,
        )
        self.play(Create(highlight_box_2), run_time=0.6)

        # Color the private row values
        self.play(
            priv_2020_val.animate.set_color(PINK_3B1B),
            priv_2019_val.animate.set_color(PINK_3B1B),
            run_time=0.5,
        )

        # Interpretation
        self.play(DrawBorderThenFill(interp_box), Write(interp_title), run_time=0.8)
        self.play(
            FadeIn(interp_line1, shift=RIGHT * 0.1),
            run_time=0.8,
        )
        self.play(
            FadeIn(interp_line2, shift=RIGHT * 0.1),
            run_time=0.8,
        )
        self.wait(1.8)

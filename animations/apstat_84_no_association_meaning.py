"""
Explain what "no association" means: every row's proportion should match the
overall proportion in each column.

Render:
manim -qm --format=mp4 animations/apstat_84_no_association_meaning.py NoAssociationMeaning
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class NoAssociationMeaning(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("What Does 'No Association' Mean?", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "If school type and year are unrelated, every row keeps the same split",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- overall proportion ---
        prop_box = RoundedRectangle(
            corner_radius=0.2, width=7.5, height=1.1,
            stroke_color=BLUE_3B1B, stroke_width=4,
        )
        prop_box.set_fill(BLUE_3B1B, opacity=0.08)
        prop_box.shift(UP * 0.85)

        prop_line1 = Text(
            "Public students: 429 out of 534 total",
            font_size=26, color=WHITE,
        )
        prop_line2 = Text(
            "429 / 534 = 80.3%",
            font_size=28, color=YELLOW_3B1B, weight=BOLD,
        )
        prop_stack = VGroup(prop_line1, prop_line2).arrange(DOWN, buff=0.12)
        prop_stack.move_to(prop_box.get_center())

        # --- two columns showing equal proportion ---
        bar_width = 2.2
        bar_height = 2.2
        bar_y = -1.2

        def make_bar_group(label_str, total, public_pct, x_offset):
            outline = RoundedRectangle(
                corner_radius=0.1, width=bar_width, height=bar_height,
                stroke_color=GRAY_C, stroke_width=2,
            )
            outline.move_to(np.array([x_offset, bar_y, 0]))

            filled_h = bar_height * public_pct
            filled = RoundedRectangle(
                corner_radius=0.08, width=bar_width - 0.06, height=filled_h,
                stroke_color=TEAL_3B1B, stroke_width=0,
            )
            filled.set_fill(TEAL_3B1B, opacity=0.4)
            filled.align_to(outline, DOWN).shift(UP * 0.03)

            pct_text = Text(
                f"80.3%", font_size=26, color=TEAL_3B1B, weight=BOLD,
            )
            pct_text.move_to(filled.get_center())

            col_label = Text(label_str, font_size=26, color=GRAY_B, weight=BOLD)
            col_label.next_to(outline, UP, buff=0.18)

            total_label = Text(f"n = {total}", font_size=22, color=GRAY_C)
            total_label.next_to(outline, DOWN, buff=0.15)

            return VGroup(outline, filled, pct_text, col_label, total_label)

        bar_2019 = make_bar_group("2019", 320, 0.803, -2.5)
        bar_2020 = make_bar_group("2020", 214, 0.803, 2.5)

        equals_sign = Text("=", font_size=44, color=GREEN_3B1B, weight=BOLD)
        equals_sign.move_to(np.array([0, bar_y, 0]))

        # expected counts annotation
        exp_2019 = Text("Exp = 257.1", font_size=22, color=WHITE)
        exp_2019.next_to(bar_2019[1], RIGHT, buff=0.15).shift(DOWN * 0.1)
        exp_2020 = Text("Exp = 171.9", font_size=22, color=WHITE)
        exp_2020.next_to(bar_2020[1], LEFT, buff=0.15).shift(DOWN * 0.1)

        # bottom callout
        callout = RoundedRectangle(
            corner_radius=0.2, width=10.5, height=0.85,
            stroke_color=GREEN_3B1B, stroke_width=4,
        )
        callout.set_fill(GREEN_3B1B, opacity=0.08)
        callout.to_edge(DOWN, buff=0.3)
        callout_text = Text(
            "Same proportion in every column = no relationship between the variables",
            font_size=24, color=WHITE,
        )
        callout_text.move_to(callout.get_center())

        # --- animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)
        self.play(DrawBorderThenFill(prop_box), Write(prop_line1), run_time=1.0)
        self.play(Write(prop_line2), run_time=0.8)
        self.play(
            FadeIn(bar_2019[0]), FadeIn(bar_2019[3]), FadeIn(bar_2019[4]),
            FadeIn(bar_2020[0]), FadeIn(bar_2020[3]), FadeIn(bar_2020[4]),
            run_time=0.8,
        )
        self.play(
            GrowFromEdge(bar_2019[1], DOWN),
            GrowFromEdge(bar_2020[1], DOWN),
            run_time=1.4,
        )
        self.play(
            FadeIn(bar_2019[2], scale=1.2),
            FadeIn(bar_2020[2], scale=1.2),
            Write(equals_sign),
            run_time=1.0,
        )
        self.play(
            FadeIn(exp_2019, shift=LEFT * 0.15),
            FadeIn(exp_2020, shift=RIGHT * 0.15),
            run_time=1.0,
        )
        self.play(DrawBorderThenFill(callout), Write(callout_text), run_time=1.4)
        self.wait(1.8)

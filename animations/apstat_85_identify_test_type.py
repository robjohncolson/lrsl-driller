"""
Decision flowchart to identify whether to use a homogeneity or independence test.

Render:
manim -qm --format=mp4 animations/apstat_85_identify_test_type.py IdentifyTestType
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class IdentifyTestType(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Which Test Do I Use?", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "A decision flowchart for chi-square tests",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- Top question node ---
        q_box = RoundedRectangle(
            corner_radius=0.2, width=7.0, height=0.9,
            stroke_color=YELLOW_3B1B, stroke_width=4,
        )
        q_box.set_fill(YELLOW_3B1B, opacity=0.08)
        q_box.shift(UP * 1.1)

        q_text = Text(
            "How was the data collected?",
            font_size=26, color=YELLOW_3B1B, weight=BOLD,
        )
        q_text.move_to(q_box.get_center())

        # --- Left branch: Homogeneity ---
        left_desc_box = RoundedRectangle(
            corner_radius=0.15, width=5.2, height=1.1,
            stroke_color=GRAY_C, stroke_width=2,
        )
        left_desc_box.set_fill(WHITE, opacity=0.04)
        left_desc_box.shift(LEFT * 3.5 + DOWN * 0.55)

        left_desc = Text(
            "Separate random samples\nfrom different populations",
            font_size=22, color=WHITE, line_spacing=0.85,
        )
        left_desc.move_to(left_desc_box.get_center())

        left_result_box = RoundedRectangle(
            corner_radius=0.2, width=5.2, height=0.85,
            stroke_color=BLUE_3B1B, stroke_width=4,
        )
        left_result_box.set_fill(BLUE_3B1B, opacity=0.1)
        left_result_box.shift(LEFT * 3.5 + DOWN * 2.0)

        left_result = Text(
            "Homogeneity Test",
            font_size=28, color=BLUE_3B1B, weight=BOLD,
        )
        left_result.move_to(left_result_box.get_center())

        # --- Right branch: Independence ---
        right_desc_box = RoundedRectangle(
            corner_radius=0.15, width=5.2, height=1.1,
            stroke_color=GRAY_C, stroke_width=2,
        )
        right_desc_box.set_fill(WHITE, opacity=0.04)
        right_desc_box.shift(RIGHT * 3.5 + DOWN * 0.55)

        right_desc = Text(
            "Single random sample,\ntwo variables recorded",
            font_size=22, color=WHITE, line_spacing=0.85,
        )
        right_desc.move_to(right_desc_box.get_center())

        right_result_box = RoundedRectangle(
            corner_radius=0.2, width=5.2, height=0.85,
            stroke_color=GREEN_3B1B, stroke_width=4,
        )
        right_result_box.set_fill(GREEN_3B1B, opacity=0.1)
        right_result_box.shift(RIGHT * 3.5 + DOWN * 2.0)

        right_result = Text(
            "Independence Test",
            font_size=28, color=GREEN_3B1B, weight=BOLD,
        )
        right_result.move_to(right_result_box.get_center())

        # --- Arrows ---
        left_arrow_1 = Arrow(
            q_box.get_bottom() + LEFT * 1.5,
            left_desc_box.get_top(),
            buff=0.1, color=GRAY_B, stroke_width=3,
        )
        left_arrow_2 = Arrow(
            left_desc_box.get_bottom(),
            left_result_box.get_top(),
            buff=0.1, color=BLUE_3B1B, stroke_width=3,
        )
        right_arrow_1 = Arrow(
            q_box.get_bottom() + RIGHT * 1.5,
            right_desc_box.get_top(),
            buff=0.1, color=GRAY_B, stroke_width=3,
        )
        right_arrow_2 = Arrow(
            right_desc_box.get_bottom(),
            right_result_box.get_top(),
            buff=0.1, color=GREEN_3B1B, stroke_width=3,
        )

        # --- Bottom callout ---
        callout = RoundedRectangle(
            corner_radius=0.2, width=10.5, height=0.85,
            stroke_color=PINK_3B1B, stroke_width=4,
        )
        callout.set_fill(PINK_3B1B, opacity=0.08)
        callout.to_edge(DOWN, buff=0.35)
        callout_text = Text(
            "Both use the same chi-square statistic and expected count formula!",
            font_size=24, color=WHITE,
        )
        callout_text.move_to(callout.get_center())

        # --- animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)
        self.play(
            DrawBorderThenFill(q_box), Write(q_text),
            run_time=1.2,
        )

        # Branch out
        self.play(
            GrowArrow(left_arrow_1), GrowArrow(right_arrow_1),
            run_time=0.8,
        )
        self.play(
            DrawBorderThenFill(left_desc_box), Write(left_desc),
            DrawBorderThenFill(right_desc_box), Write(right_desc),
            run_time=1.4,
        )

        # Flow down to results
        self.play(
            GrowArrow(left_arrow_2), GrowArrow(right_arrow_2),
            run_time=0.8,
        )
        self.play(
            DrawBorderThenFill(left_result_box),
            FadeIn(left_result, scale=1.1),
            run_time=1.0,
        )
        self.play(
            DrawBorderThenFill(right_result_box),
            FadeIn(right_result, scale=1.1),
            run_time=1.0,
        )

        # Callout
        self.play(DrawBorderThenFill(callout), Write(callout_text), run_time=1.3)
        self.wait(1.8)

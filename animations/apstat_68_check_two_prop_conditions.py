"""
Show the conditions for a two-sample z-interval for two proportions.

Run with: manim -qm --format=mp4 animations/apstat_68_check_two_prop_conditions.py CheckTwoPropConditions
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class CheckTwoPropConditions(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Check the 6.8 Conditions", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        left_panel = RoundedRectangle(corner_radius=0.18, width=5.4, height=3.0, stroke_color=BLUE_3B1B, stroke_width=4)
        left_panel.set_fill(BLUE_3B1B, opacity=0.10)
        left_panel.shift(LEFT * 3.2 + UP * 0.2)

        right_panel = RoundedRectangle(corner_radius=0.18, width=5.4, height=3.0, stroke_color=TEAL_3B1B, stroke_width=4)
        right_panel.set_fill(TEAL_3B1B, opacity=0.10)
        right_panel.shift(RIGHT * 3.2 + UP * 0.2)

        left_title = Text("Independence", font_size=28, color=BLUE_3B1B, weight=BOLD).move_to(left_panel.get_top() + DOWN * 0.45)
        right_title = Text("Approx. Normal Shape", font_size=28, color=TEAL_3B1B, weight=BOLD).move_to(right_panel.get_top() + DOWN * 0.45)

        independence_items = VGroup(
            Text("1. Two random samples", font_size=24),
            Text("or random assignment", font_size=24),
            Text("2. If sampling:", font_size=24),
            Text("n1 and n2 are each <= 10%", font_size=24),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.16)
        independence_items.next_to(left_title, DOWN, buff=0.35).align_to(left_panel, LEFT).shift(RIGHT * 0.35)

        shape_text = Text("Check all four counts", font_size=26, color=TEAL_3B1B, weight=BOLD)
        shape_text.next_to(right_title, DOWN, buff=0.35)

        counts = [("36", GREEN_3B1B), ("204", GREEN_3B1B), ("25", GREEN_3B1B), ("175", GREEN_3B1B)]
        count_boxes = VGroup()
        count_texts = VGroup()
        for value, color in counts:
            box = RoundedRectangle(corner_radius=0.15, width=1.3, height=0.95, stroke_color=color, stroke_width=4)
            box.set_fill(color, opacity=0.14)
            txt = Text(value, font_size=28, color=color, weight=BOLD)
            txt.move_to(box.get_center())
            count_boxes.add(box)
            count_texts.add(txt)
        count_boxes.arrange_in_grid(rows=2, cols=2, buff=0.28)
        count_boxes.next_to(shape_text, DOWN, buff=0.35)
        for txt, box in zip(count_texts, count_boxes):
            txt.move_to(box.get_center())

        threshold = Text("Each count must be at least 10", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        threshold.next_to(count_boxes, DOWN, buff=0.3)

        summary = RoundedRectangle(corner_radius=0.18, width=10.0, height=0.95, stroke_color=PINK_3B1B, stroke_width=4)
        summary.set_fill(PINK_3B1B, opacity=0.10)
        summary.shift(DOWN * 2.7)
        summary_text = Text("If all checks pass, the two-sample z-interval is appropriate", font_size=24, color=PINK_3B1B, weight=BOLD)
        summary_text.move_to(summary.get_center())

        self.play(Write(title))
        self.wait(0.3)
        self.play(Create(left_panel), Create(right_panel), Write(left_title), Write(right_title), run_time=0.8)
        self.play(LaggedStart(*[FadeIn(item, shift=RIGHT * 0.15) for item in independence_items], lag_ratio=0.18), run_time=1.0)
        self.wait(0.5)
        self.play(Write(shape_text), run_time=0.5)
        self.play(LaggedStart(*[Create(box) for box in count_boxes], lag_ratio=0.12), run_time=0.8)
        self.play(LaggedStart(*[Write(txt) for txt in count_texts], lag_ratio=0.12), FadeIn(threshold, shift=UP * 0.1), run_time=0.8)
        self.wait(0.8)
        self.play(Create(summary), Write(summary_text), run_time=0.8)
        self.wait(2.3)

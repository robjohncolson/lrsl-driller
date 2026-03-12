"""
Visualize checking conditions for a two-sample z test for p1 - p2 using the pooled proportion.

Run with: manim -qm --format=mp4 animations/apstat_610_check_conditions.py CheckConditions610
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class CheckConditions610(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("6.10 — Check Conditions for the Test", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        # Two condition panels
        left_panel = RoundedRectangle(
            corner_radius=0.18, width=5.4, height=3.4,
            stroke_color=BLUE_3B1B, stroke_width=4,
        )
        left_panel.set_fill(BLUE_3B1B, opacity=0.10)
        left_panel.shift(LEFT * 3.2 + DOWN * 0.05)

        right_panel = RoundedRectangle(
            corner_radius=0.18, width=5.4, height=3.4,
            stroke_color=TEAL_3B1B, stroke_width=4,
        )
        right_panel.set_fill(TEAL_3B1B, opacity=0.10)
        right_panel.shift(RIGHT * 3.2 + DOWN * 0.05)

        left_title = Text("Independence", font_size=28, color=BLUE_3B1B, weight=BOLD)
        left_title.move_to(left_panel.get_top() + DOWN * 0.45)

        right_title = Text("Large Counts (Pooled)", font_size=26, color=TEAL_3B1B, weight=BOLD)
        right_title.move_to(right_panel.get_top() + DOWN * 0.45)

        independence_items = VGroup(
            Text("1. Random samples or", font_size=22),
            Text("   random assignment", font_size=22),
            Text("2. If sampling without", font_size=22),
            Text("   replacement:", font_size=22),
            Text("   n1 \u2264 10% of pop. 1", font_size=22, color=YELLOW_3B1B),
            Text("   n2 \u2264 10% of pop. 2", font_size=22, color=YELLOW_3B1B),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.12)
        independence_items.next_to(left_title, DOWN, buff=0.3)
        independence_items.align_to(left_panel, LEFT).shift(RIGHT * 0.35)

        # Key difference: use POOLED p-hat for expected counts
        pooled_note = Text("Use p\u0302c (pooled) here!", font_size=22, color=PINK_3B1B, weight=BOLD)
        pooled_note.next_to(right_title, DOWN, buff=0.3)

        counts_labels = VGroup(
            Text("n1 \u00b7 p\u0302c", font_size=20, color=TEAL_3B1B),
            Text("n1 \u00b7 (1 - p\u0302c)", font_size=20, color=TEAL_3B1B),
            Text("n2 \u00b7 p\u0302c", font_size=20, color=TEAL_3B1B),
            Text("n2 \u00b7 (1 - p\u0302c)", font_size=20, color=TEAL_3B1B),
        )

        count_boxes = VGroup()
        for i, label in enumerate(counts_labels):
            box = RoundedRectangle(
                corner_radius=0.12, width=2.2, height=0.75,
                stroke_color=GREEN_3B1B, stroke_width=3,
            )
            box.set_fill(GREEN_3B1B, opacity=0.12)
            label.move_to(box.get_center())
            count_boxes.add(VGroup(box, label))

        count_boxes.arrange_in_grid(rows=2, cols=2, buff=0.2)
        count_boxes.next_to(pooled_note, DOWN, buff=0.3)

        threshold = Text("Each must be \u2265 10", font_size=22, color=YELLOW_3B1B, weight=BOLD)
        threshold.next_to(count_boxes, DOWN, buff=0.25)

        # Summary bar
        summary = RoundedRectangle(
            corner_radius=0.18, width=11.0, height=0.85,
            stroke_color=PINK_3B1B, stroke_width=4,
        )
        summary.set_fill(PINK_3B1B, opacity=0.10)
        summary.shift(DOWN * 3.05)
        summary_text = Text(
            "Key difference from 6.8: use pooled p\u0302c instead of individual p\u0302 values",
            font_size=20, color=PINK_3B1B, weight=BOLD,
        )
        summary_text.move_to(summary.get_center())

        # Animate
        self.play(Write(title), run_time=0.8)
        self.play(Create(left_panel), Create(right_panel), run_time=0.7)
        self.play(Write(left_title), Write(right_title), run_time=0.6)
        self.play(
            LaggedStart(
                *[FadeIn(item, shift=RIGHT * 0.15) for item in independence_items],
                lag_ratio=0.12,
            ),
            run_time=1.0,
        )
        self.wait(0.5)
        self.play(Write(pooled_note), run_time=0.5)
        self.play(
            LaggedStart(
                *[FadeIn(cb, shift=UP * 0.1) for cb in count_boxes],
                lag_ratio=0.15,
            ),
            run_time=0.9,
        )
        self.play(FadeIn(threshold, shift=UP * 0.1), run_time=0.5)
        self.wait(0.5)
        self.play(Create(summary), Write(summary_text), run_time=0.8)
        self.wait(2.5)

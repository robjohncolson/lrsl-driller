"""
Test Direction: One-Sided vs Two-Sided (AP Stats Unit 6, Topic 6.5)

Illustrates how the direction of the alternative hypothesis determines
which tail(s) of the normal curve to shade for the p-value calculation.
Shows all three cases side by side with clear Ha labels.

Run with: manim -qm --format=mp4 apstat_65_test_direction.py TestDirection
"""
from manim import *
import numpy as np

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class TestDirection(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("One-Sided vs Two-Sided Tests", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Which tail(s) give the p-value?",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== KEY RULE ==========
        rule = Text(
            "The direction of H\u2090 determines where to shade",
            font_size=24, color=YELLOW_3B1B,
        )
        rule.next_to(title, DOWN, buff=0.25)
        self.play(Write(rule), run_time=0.4)
        self.wait(0.3)

        # ========== THREE CASES SIDE BY SIDE ==========
        cases_data = [
            ("H\u2090: p > p\u2080", "Right tail", ORANGE_3B1B, "right"),
            ("H\u2090: p < p\u2080", "Left tail", PINK_3B1B, "left"),
            ("H\u2090: p \u2260 p\u2080", "Both tails", GREEN_3B1B, "both"),
        ]

        case_groups = []
        for ha_text, tail_text, color, direction in cases_data:
            # Small axes
            ax = Axes(
                x_range=[-3, 3, 1],
                y_range=[0, 0.45, 0.1],
                x_length=3.2, y_length=1.6,
                axis_config={"include_tip": False, "color": GREY_B, "stroke_width": 1},
            )

            curve = ax.plot(
                lambda x: (1 / np.sqrt(2 * np.pi)) * np.exp(-0.5 * x**2),
                x_range=[-3, 3],
                color=ManimColor(BLUE_3B1B),
                stroke_width=2,
            )

            z_example = 1.5

            if direction == "right":
                shaded = ax.get_area(
                    curve, x_range=[z_example, 3], color=color, opacity=0.5,
                )
                z_line = ax.get_vertical_line(
                    ax.i2gp(z_example, curve),
                    line_config={"color": YELLOW_3B1B, "stroke_width": 2},
                )
                area_group = VGroup(shaded, z_line)
            elif direction == "left":
                shaded = ax.get_area(
                    curve, x_range=[-3, -z_example], color=color, opacity=0.5,
                )
                z_line = ax.get_vertical_line(
                    ax.i2gp(-z_example, curve),
                    line_config={"color": YELLOW_3B1B, "stroke_width": 2},
                )
                area_group = VGroup(shaded, z_line)
            else:  # both
                shaded_l = ax.get_area(
                    curve, x_range=[-3, -z_example], color=color, opacity=0.5,
                )
                shaded_r = ax.get_area(
                    curve, x_range=[z_example, 3], color=color, opacity=0.5,
                )
                z_line_l = ax.get_vertical_line(
                    ax.i2gp(-z_example, curve),
                    line_config={"color": YELLOW_3B1B, "stroke_width": 2},
                )
                z_line_r = ax.get_vertical_line(
                    ax.i2gp(z_example, curve),
                    line_config={"color": YELLOW_3B1B, "stroke_width": 2},
                )
                area_group = VGroup(shaded_l, shaded_r, z_line_l, z_line_r)

            ha_label = Text(ha_text, font_size=20, color=color, weight=BOLD)
            tail_label = Text(tail_text, font_size=16, color=GREY_B)

            graph_group = VGroup(ax, curve, area_group)
            labels = VGroup(ha_label, tail_label).arrange(DOWN, buff=0.05)
            full = VGroup(labels, graph_group).arrange(DOWN, buff=0.1)

            case_groups.append(full)

        all_cases = VGroup(*case_groups).arrange(RIGHT, buff=0.3)
        all_cases.next_to(rule, DOWN, buff=0.3)

        if all_cases.width > 12:
            all_cases.scale_to_fit_width(12)

        for i, case in enumerate(case_groups):
            self.play(FadeIn(case, shift=UP * 0.3), run_time=0.5)
            self.wait(0.3)

        self.wait(0.5)

        # ========== TWO-SIDED EMPHASIS ==========
        two_sided_note = Text(
            "Two-sided: p-value = 2 \u00d7 (one tail area)",
            font_size=22, color=GREEN_3B1B, weight=BOLD,
        )
        two_sided_note.next_to(all_cases, DOWN, buff=0.3)
        two_sided_box = SurroundingRectangle(
            two_sided_note, color=GREEN_3B1B, buff=0.12, corner_radius=0.1,
        )
        self.play(Write(two_sided_note), Create(two_sided_box), run_time=0.5)
        self.wait(0.5)

        # ========== MATCHING GUIDE ==========
        self.play(
            FadeOut(VGroup(rule, all_cases, two_sided_note, two_sided_box)),
            run_time=0.4,
        )

        guide_label = Text("Quick Guide:", font_size=28, color=WHITE, weight=BOLD)
        guide_label.next_to(title, DOWN, buff=0.3)
        self.play(Write(guide_label), run_time=0.3)

        guide_items = [
            ('"greater than" / "more" / "higher"', "p > p\u2080  \u2192  RIGHT tail", ORANGE_3B1B),
            ('"less than" / "fewer" / "lower"', "p < p\u2080  \u2192  LEFT tail", PINK_3B1B),
            ('"different from" / "differs" / "changed"', "p \u2260 p\u2080  \u2192  BOTH tails", GREEN_3B1B),
        ]

        guide_groups = []
        for keywords, direction, color in guide_items:
            kw = Text(keywords, font_size=18, color=GREY_B)
            dr = Text(direction, font_size=22, color=color, weight=BOLD)
            row = VGroup(kw, dr).arrange(RIGHT, buff=0.3)
            guide_groups.append(row)

        all_guide = VGroup(*guide_groups).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        all_guide.next_to(guide_label, DOWN, buff=0.3)

        for row in guide_groups:
            self.play(FadeIn(row, shift=RIGHT * 0.3), run_time=0.4)
            self.wait(0.2)

        self.wait(0.5)

        # ========== CLOSING ==========
        closing = Text(
            "Match the tail to H\u2090!",
            font_size=24, color=TEAL_3B1B, weight=BOLD,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(
            closing, color=TEAL_3B1B, buff=0.12, corner_radius=0.1,
        )
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)

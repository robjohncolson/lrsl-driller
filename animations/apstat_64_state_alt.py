"""
State the Alternative Hypothesis (AP Stats Unit 6, Topic 6.4)

Shows three forms of the alternative hypothesis branching from the null
distribution: Ha: p > p0 (right tail), Ha: p < p0 (left tail),
Ha: p != p0 (two tails). Labels one-sided vs two-sided and connects
keywords to the correct direction.

Run with: manim -qm --format=mp4 apstat_64_state_alt.py StateAltHypothesis
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


def normal_pdf(x, mu, sigma):
    return (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(
        -0.5 * ((x - mu) / sigma) ** 2
    )


class StateAltHypothesis(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("The Alternative Hypothesis", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "The claim we hope to support with data",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== NULL DISTRIBUTION ==========
        p0 = 0.5
        sd = 0.06

        axes = Axes(
            x_range=[0.2, 0.8, 0.05],
            y_range=[0, 8, 2],
            x_length=10,
            y_length=2.5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.3)

        curve = axes.plot(
            lambda x: normal_pdf(x, p0, sd),
            x_range=[0.25, 0.75],
            color=GREY_B,
            stroke_width=2,
        )

        p0_line = DashedLine(
            axes.c2p(p0, 0), axes.c2p(p0, normal_pdf(p0, p0, sd)),
            color=YELLOW_3B1B, stroke_width=2,
        )
        p0_label = Text("p\u2080", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        p0_label.next_to(axes.c2p(p0, 0), DOWN, buff=0.15)

        self.play(
            FadeOut(subtitle),
            Create(axes), Create(curve), Create(p0_line), Write(p0_label),
            run_time=0.8,
        )
        self.wait(0.3)

        # ========== ALTERNATIVE 1: p > p0 (right tail) ==========
        alt1_title = Text(
            "One-sided (right):", font_size=22, color=BLUE_3B1B, weight=BOLD,
        )
        alt1_title.move_to(LEFT * 4.5 + UP * 0.5)

        alt1_eq = Text(
            "H\u2090: p > p\u2080", font_size=36, color=BLUE_3B1B, weight=BOLD,
        )
        alt1_eq.next_to(alt1_title, DOWN, buff=0.1, aligned_edge=LEFT)

        right_area = axes.get_area(
            curve, x_range=[p0 + 1.5 * sd, 0.75],
            color=BLUE_3B1B, opacity=0.4,
        )

        right_arrow = Arrow(
            axes.c2p(p0 + 0.5 * sd, normal_pdf(p0, p0, sd) * 0.3),
            axes.c2p(p0 + 3 * sd, normal_pdf(p0, p0, sd) * 0.3),
            color=BLUE_3B1B, stroke_width=3,
        )

        keywords1 = Text(
            '"more than"  "greater"  "higher"  "increased"',
            font_size=16, color=BLUE_3B1B,
        )
        keywords1.next_to(alt1_eq, DOWN, buff=0.1, aligned_edge=LEFT)

        self.play(Write(alt1_title), Write(alt1_eq), run_time=0.5)
        self.play(FadeIn(right_area), Create(right_arrow), run_time=0.5)
        self.play(Write(keywords1), run_time=0.4)
        self.wait(0.6)

        self.play(
            FadeOut(VGroup(right_area, right_arrow, alt1_title, alt1_eq, keywords1)),
            run_time=0.4,
        )

        # ========== ALTERNATIVE 2: p < p0 (left tail) ==========
        alt2_title = Text(
            "One-sided (left):", font_size=22, color=PINK_3B1B, weight=BOLD,
        )
        alt2_title.move_to(LEFT * 4.5 + UP * 0.5)

        alt2_eq = Text(
            "H\u2090: p < p\u2080", font_size=36, color=PINK_3B1B, weight=BOLD,
        )
        alt2_eq.next_to(alt2_title, DOWN, buff=0.1, aligned_edge=LEFT)

        left_area = axes.get_area(
            curve, x_range=[0.25, p0 - 1.5 * sd],
            color=PINK_3B1B, opacity=0.4,
        )

        left_arrow = Arrow(
            axes.c2p(p0 - 0.5 * sd, normal_pdf(p0, p0, sd) * 0.3),
            axes.c2p(p0 - 3 * sd, normal_pdf(p0, p0, sd) * 0.3),
            color=PINK_3B1B, stroke_width=3,
        )

        keywords2 = Text(
            '"less than"  "fewer"  "lower"  "decreased"',
            font_size=16, color=PINK_3B1B,
        )
        keywords2.next_to(alt2_eq, DOWN, buff=0.1, aligned_edge=LEFT)

        self.play(Write(alt2_title), Write(alt2_eq), run_time=0.5)
        self.play(FadeIn(left_area), Create(left_arrow), run_time=0.5)
        self.play(Write(keywords2), run_time=0.4)
        self.wait(0.6)

        self.play(
            FadeOut(VGroup(left_area, left_arrow, alt2_title, alt2_eq, keywords2)),
            run_time=0.4,
        )

        # ========== ALTERNATIVE 3: p != p0 (two-sided) ==========
        alt3_title = Text(
            "Two-sided:", font_size=22, color=ORANGE_3B1B, weight=BOLD,
        )
        alt3_title.move_to(LEFT * 4.5 + UP * 0.5)

        alt3_eq = Text(
            "H\u2090: p \u2260 p\u2080", font_size=36, color=ORANGE_3B1B, weight=BOLD,
        )
        alt3_eq.next_to(alt3_title, DOWN, buff=0.1, aligned_edge=LEFT)

        both_right = axes.get_area(
            curve, x_range=[p0 + 1.5 * sd, 0.75],
            color=ORANGE_3B1B, opacity=0.4,
        )
        both_left = axes.get_area(
            curve, x_range=[0.25, p0 - 1.5 * sd],
            color=ORANGE_3B1B, opacity=0.4,
        )

        keywords3 = Text(
            '"different from"  "differs"  "changed"  "not equal"',
            font_size=16, color=ORANGE_3B1B,
        )
        keywords3.next_to(alt3_eq, DOWN, buff=0.1, aligned_edge=LEFT)

        self.play(Write(alt3_title), Write(alt3_eq), run_time=0.5)
        self.play(FadeIn(both_left), FadeIn(both_right), run_time=0.5)
        self.play(Write(keywords3), run_time=0.4)
        self.wait(0.6)

        # ========== SUMMARY ==========
        self.play(
            FadeOut(VGroup(
                axes, curve, p0_line, p0_label,
                both_left, both_right,
                alt3_title, alt3_eq, keywords3,
            )),
            run_time=0.5,
        )

        summary_title = Text("Summary", font_size=32, weight=BOLD)
        summary_title.next_to(title, DOWN, buff=0.4)
        self.play(Write(summary_title), run_time=0.3)

        s1 = Text("H\u2090: p > p\u2080", font_size=32, color=BLUE_3B1B, weight=BOLD)
        s1_label = Text("  one-sided (right)", font_size=20, color=GREY_B)
        row1 = VGroup(s1, s1_label).arrange(RIGHT, buff=0.3)

        s2 = Text("H\u2090: p < p\u2080", font_size=32, color=PINK_3B1B, weight=BOLD)
        s2_label = Text("  one-sided (left)", font_size=20, color=GREY_B)
        row2 = VGroup(s2, s2_label).arrange(RIGHT, buff=0.3)

        s3 = Text("H\u2090: p \u2260 p\u2080", font_size=32, color=ORANGE_3B1B, weight=BOLD)
        s3_label = Text("  two-sided", font_size=20, color=GREY_B)
        row3 = VGroup(s3, s3_label).arrange(RIGHT, buff=0.3)

        summary_rows = VGroup(row1, row2, row3).arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        summary_rows.next_to(summary_title, DOWN, buff=0.3)

        self.play(Write(row1), run_time=0.4)
        self.play(Write(row2), run_time=0.4)
        self.play(Write(row3), run_time=0.4)
        self.wait(0.5)

        insight = Text(
            "The direction comes from the research question,\nNOT from the data.",
            font_size=22, color=GREEN_3B1B,
        )
        insight.to_edge(DOWN, buff=0.5)
        insight_box = SurroundingRectangle(
            insight, color=GREEN_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Write(insight), Create(insight_box), run_time=0.6)
        self.wait(1.5)

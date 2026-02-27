"""
Interpreting the Parameters of the Sampling Distribution of x-bar1 - x-bar2
(AP Stats Unit 5, Topic 5.8)

Teaches students how to correctly interpret mu_{x-bar1 - x-bar2} and
sigma_{x-bar1 - x-bar2} using a concrete lemon-vs-orange scenario.
Shows computed parameters, contrasts wrong vs correct interpretations for
both the mean and standard deviation, highlights key words ("all possible
pairs of samples", "typically"), and ends with a 3-rule checklist.

Run: manim -qm --format=mp4 apstat_58_interpret_diff_mean.py DiffMeanInterpret
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class DiffMeanInterpret(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ================================================================
        # TITLE
        # ================================================================
        title = VGroup(
            Text("Interpreting ", font_size=38, weight=BOLD),
            MathTex(
                r"\mu_{\bar{x}_1 - \bar{x}_2}",
                font_size=44, color=BLUE_3B1B,
            ),
            Text(" and ", font_size=38, weight=BOLD),
            MathTex(
                r"\sigma_{\bar{x}_1 - \bar{x}_2}",
                font_size=44, color=YELLOW_3B1B,
            ),
        ).arrange(RIGHT, buff=0.12)
        title.to_edge(UP, buff=0.3)

        self.play(Write(title), run_time=1.0)
        self.wait(0.3)

        # ================================================================
        # SCENARIO: Lemons vs Oranges
        # ================================================================
        scenario_line1 = Text(
            "Comparing fruit weights from two groves:",
            font_size=26,
        )

        lemon_params = VGroup(
            Text("Lemons: ", font_size=24, color=TEAL_3B1B, weight=BOLD),
            MathTex(r"\mu_1 = 4", font_size=28, color=BLUE_3B1B),
            Text(" oz, ", font_size=24),
            MathTex(r"\sigma_1 = 0.5", font_size=28, color=YELLOW_3B1B),
            Text(" oz, ", font_size=24),
            MathTex(r"n_1 = 6", font_size=28, color=TEAL_3B1B),
        ).arrange(RIGHT, buff=0.06)

        orange_params = VGroup(
            Text("Oranges: ", font_size=24, color=PINK_3B1B, weight=BOLD),
            MathTex(r"\mu_2 = 3", font_size=28, color=BLUE_3B1B),
            Text(" oz, ", font_size=24),
            MathTex(r"\sigma_2 = 0.4", font_size=28, color=YELLOW_3B1B),
            Text(" oz, ", font_size=24),
            MathTex(r"n_2 = 6", font_size=28, color=TEAL_3B1B),
        ).arrange(RIGHT, buff=0.06)

        scenario = VGroup(scenario_line1, lemon_params, orange_params).arrange(
            DOWN, buff=0.15,
        )
        scenario.next_to(title, DOWN, buff=0.3)

        self.play(Write(scenario_line1), run_time=0.6)
        self.play(Write(lemon_params), run_time=0.7)
        self.play(Write(orange_params), run_time=0.7)
        self.wait(0.8)

        # ================================================================
        # COMPUTED PARAMETERS
        # ================================================================
        param_mean = VGroup(
            MathTex(
                r"\mu_{\bar{x}_1 - \bar{x}_2}",
                font_size=32, color=BLUE_3B1B,
            ),
            MathTex(r"= 4 - 3 = 1", font_size=32),
            Text(" oz", font_size=24),
        ).arrange(RIGHT, buff=0.08)

        param_sd = VGroup(
            MathTex(
                r"\sigma_{\bar{x}_1 - \bar{x}_2}",
                font_size=32, color=YELLOW_3B1B,
            ),
            MathTex(
                r"= \sqrt{\frac{0.5^2}{6} + \frac{0.4^2}{6}}",
                font_size=30,
            ),
            MathTex(r"\approx 0.26", font_size=32, color=YELLOW_3B1B),
            Text(" oz", font_size=24),
        ).arrange(RIGHT, buff=0.08)

        params = VGroup(param_mean, param_sd).arrange(DOWN, buff=0.2)
        params.next_to(scenario, DOWN, buff=0.3)

        self.play(Write(param_mean), run_time=0.8)
        self.play(Write(param_sd), run_time=0.8)
        self.wait(1.0)

        # Keep params visible, fade scenario
        param_line = VGroup(param_mean, param_sd)
        self.play(
            FadeOut(scenario),
            param_line.animate.next_to(title, DOWN, buff=0.25),
            run_time=0.5,
        )

        # ================================================================
        # INTERPRET mu_{x-bar1 - x-bar2} = 1
        # ================================================================
        section1_header = Text(
            "Interpreting the Mean",
            font_size=30, color=BLUE_3B1B, weight=BOLD,
        )
        section1_header.next_to(param_line, DOWN, buff=0.3)
        self.play(Write(section1_header), run_time=0.5)
        self.wait(0.3)

        # --- WRONG interpretation ---
        bad_mean_tag = VGroup(
            Text("X", font_size=28, color=RED, weight=BOLD),
            Text("  WRONG", font_size=24, color=RED, weight=BOLD),
        ).arrange(RIGHT, buff=0.08)
        bad_mean_text = Text(
            "The difference in weight\nis always 1 oz.",
            font_size=22, color=WHITE, line_spacing=1.1,
        )
        bad_mean_content = VGroup(bad_mean_tag, bad_mean_text).arrange(
            DOWN, buff=0.12, aligned_edge=LEFT,
        )
        bad_mean_box = SurroundingRectangle(
            bad_mean_content, color=RED, buff=0.2, corner_radius=0.1,
            stroke_width=3,
        )
        bad_mean_group = VGroup(bad_mean_box, bad_mean_content)
        bad_mean_group.move_to(LEFT * 3.3 + DOWN * 1.0)

        self.play(FadeIn(bad_mean_group), run_time=0.6)
        self.wait(0.8)

        # Cross it out
        cross_mean = Cross(bad_mean_group, stroke_color=RED, stroke_width=6)
        self.play(Create(cross_mean), run_time=0.5)
        self.wait(0.3)

        # --- CORRECT interpretation ---
        good_mean_tag = VGroup(
            Text("ok", font_size=20, color=GREEN_3B1B, weight=BOLD),
            Text("  CORRECT", font_size=24, color=GREEN_3B1B, weight=BOLD),
        ).arrange(RIGHT, buff=0.08)
        good_mean_text = Text(
            "Across all possible pairs of\n"
            "samples of size 6 from lemons\n"
            "and size 6 from oranges, the\n"
            "average difference in sample\n"
            "mean weights equals 1 oz.",
            font_size=20, color=WHITE, line_spacing=1.1,
        )
        good_mean_content = VGroup(good_mean_tag, good_mean_text).arrange(
            DOWN, buff=0.12, aligned_edge=LEFT,
        )
        good_mean_box = SurroundingRectangle(
            good_mean_content, color=GREEN_3B1B, buff=0.2, corner_radius=0.1,
            stroke_width=3,
        )
        good_mean_group = VGroup(good_mean_box, good_mean_content)
        good_mean_group.move_to(RIGHT * 3.3 + DOWN * 1.0)

        self.play(FadeIn(good_mean_group), run_time=0.6)
        self.wait(0.5)

        # Glow the correct box
        good_mean_glow = SurroundingRectangle(
            good_mean_content, color=GREEN_3B1B, buff=0.25, corner_radius=0.12,
            stroke_width=6,
        )
        self.play(Create(good_mean_glow), run_time=0.4)
        self.wait(0.5)

        # --- Highlight key elements ---
        key_elements = VGroup(
            Text("Key elements:", font_size=22, color=TEAL_3B1B, weight=BOLD),
            Text(
                '"all possible pairs of samples"',
                font_size=20, color=TEAL_3B1B,
            ),
            Text(
                "specific sizes (n\u2081 = 6, n\u2082 = 6)",
                font_size=20, color=TEAL_3B1B,
            ),
            Text(
                "context + units (lemons/oranges, oz)",
                font_size=20, color=TEAL_3B1B,
            ),
        ).arrange(DOWN, buff=0.08, aligned_edge=LEFT)
        key_elements.to_edge(DOWN, buff=0.3)

        self.play(
            LaggedStart(
                *[FadeIn(el, shift=RIGHT * 0.2) for el in key_elements],
                lag_ratio=0.25,
            ),
            run_time=1.2,
        )
        self.wait(1.0)

        # Clear mean interpretation section
        mean_section = VGroup(
            section1_header,
            bad_mean_group, cross_mean,
            good_mean_group, good_mean_glow,
            key_elements,
        )
        self.play(FadeOut(mean_section), run_time=0.5)

        # ================================================================
        # INTERPRET sigma_{x-bar1 - x-bar2} = 0.26
        # ================================================================
        section2_header = Text(
            "Interpreting the Standard Deviation",
            font_size=30, color=YELLOW_3B1B, weight=BOLD,
        )
        section2_header.next_to(param_line, DOWN, buff=0.3)
        self.play(Write(section2_header), run_time=0.5)
        self.wait(0.3)

        # --- WRONG interpretation ---
        bad_sd_tag = VGroup(
            Text("X", font_size=28, color=RED, weight=BOLD),
            Text("  WRONG", font_size=24, color=RED, weight=BOLD),
        ).arrange(RIGHT, buff=0.08)
        bad_sd_text = Text(
            "The difference is always within\n0.26 oz of 1 oz.",
            font_size=22, color=WHITE, line_spacing=1.1,
        )
        bad_sd_content = VGroup(bad_sd_tag, bad_sd_text).arrange(
            DOWN, buff=0.12, aligned_edge=LEFT,
        )
        bad_sd_box = SurroundingRectangle(
            bad_sd_content, color=RED, buff=0.2, corner_radius=0.1,
            stroke_width=3,
        )
        bad_sd_group = VGroup(bad_sd_box, bad_sd_content)
        bad_sd_group.move_to(LEFT * 3.3 + DOWN * 0.8)

        self.play(FadeIn(bad_sd_group), run_time=0.6)
        self.wait(0.8)

        # Cross it out
        cross_sd = Cross(bad_sd_group, stroke_color=RED, stroke_width=6)
        self.play(Create(cross_sd), run_time=0.5)
        self.wait(0.3)

        # --- CORRECT interpretation ---
        good_sd_tag = VGroup(
            Text("ok", font_size=20, color=GREEN_3B1B, weight=BOLD),
            Text("  CORRECT", font_size=24, color=GREEN_3B1B, weight=BOLD),
        ).arrange(RIGHT, buff=0.08)
        good_sd_text = Text(
            "The difference in sample mean\n"
            "weights typically varies by\n"
            "about 0.26 oz from the true\n"
            "difference of 1 oz.",
            font_size=20, color=WHITE, line_spacing=1.1,
        )
        good_sd_content = VGroup(good_sd_tag, good_sd_text).arrange(
            DOWN, buff=0.12, aligned_edge=LEFT,
        )
        good_sd_box = SurroundingRectangle(
            good_sd_content, color=GREEN_3B1B, buff=0.2, corner_radius=0.1,
            stroke_width=3,
        )
        good_sd_group = VGroup(good_sd_box, good_sd_content)
        good_sd_group.move_to(RIGHT * 3.3 + DOWN * 0.8)

        self.play(FadeIn(good_sd_group), run_time=0.6)
        self.wait(0.5)

        # Glow the correct box
        good_sd_glow = SurroundingRectangle(
            good_sd_content, color=GREEN_3B1B, buff=0.25, corner_radius=0.12,
            stroke_width=6,
        )
        self.play(Create(good_sd_glow), run_time=0.4)
        self.wait(0.5)

        # --- HIGHLIGHT "TYPICALLY" ---
        typically_note = VGroup(
            Text("Key word:  ", font_size=24, color=YELLOW_3B1B, weight=BOLD),
            Text("TYPICALLY", font_size=28, color=YELLOW_3B1B, weight=BOLD),
            Text("  \u2014 not always, not guaranteed!", font_size=22, color=GREY_B),
        ).arrange(RIGHT, buff=0.08)
        typically_note.to_edge(DOWN, buff=0.35)

        typically_box = SurroundingRectangle(
            typically_note, color=YELLOW_3B1B, buff=0.15, corner_radius=0.1,
            stroke_width=2,
        )
        self.play(Write(typically_note), Create(typically_box), run_time=0.8)
        self.wait(1.0)

        # Units reminder
        units_note = Text(
            "Must include UNITS (ounces)!",
            font_size=22, color=PINK_3B1B, weight=BOLD,
        )
        units_note.next_to(typically_box, UP, buff=0.15)
        self.play(FadeIn(units_note, shift=UP * 0.2), run_time=0.4)
        self.wait(0.8)

        # Clear SD interpretation section
        sd_section = VGroup(
            section2_header,
            bad_sd_group, cross_sd,
            good_sd_group, good_sd_glow,
            typically_note, typically_box,
            units_note,
        )
        self.play(
            FadeOut(sd_section), FadeOut(param_line), FadeOut(title),
            run_time=0.5,
        )

        # ================================================================
        # FINAL SUMMARY: 3-rule checklist
        # ================================================================
        insight_lines = VGroup(
            Text(
                "Interpretation Checklist",
                font_size=34, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=10),  # spacer
            VGroup(
                Text("\u2713 ", font_size=26, color=GREEN_3B1B, weight=BOLD),
                Text(
                    'Reference "all possible pairs of',
                    font_size=24, color=WHITE,
                ),
            ).arrange(RIGHT, buff=0.08),
            Text(
                '     samples of size n\u2081 and n\u2082"',
                font_size=24, color=WHITE,
            ),
            Text("", font_size=8),  # spacer
            VGroup(
                Text("\u2713 ", font_size=26, color=GREEN_3B1B, weight=BOLD),
                Text(
                    "Include context and units",
                    font_size=24, color=WHITE,
                ),
            ).arrange(RIGHT, buff=0.08),
            Text(
                "     (lemons/oranges, ounces)",
                font_size=22, color=TEAL_3B1B,
            ),
            Text("", font_size=8),  # spacer
            VGroup(
                Text("\u2713 ", font_size=26, color=GREEN_3B1B, weight=BOLD),
                Text(
                    'Use "typically" for ',
                    font_size=24, color=WHITE,
                ),
                MathTex(
                    r"\sigma_{\bar{x}_1 - \bar{x}_2}",
                    font_size=28, color=YELLOW_3B1B,
                ),
            ).arrange(RIGHT, buff=0.08),
            Text(
                '     (not "always" or "exactly")',
                font_size=22, color=RED,
            ),
        ).arrange(DOWN, buff=0.1)
        insight_lines.move_to(ORIGIN)

        insight_box = SurroundingRectangle(
            insight_lines, color=YELLOW_3B1B, buff=0.35, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_lines],
                lag_ratio=0.2,
            ),
            run_time=2.5,
        )
        self.play(Create(insight_box), run_time=0.5)
        self.wait(2.5)

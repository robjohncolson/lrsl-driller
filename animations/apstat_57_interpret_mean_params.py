"""
Interpreting the Parameters of the Sampling Distribution of x-bar
(AP Stats Unit 5, Topic 5.7)

Teaches students to correctly interpret mu_x-bar and sigma_x-bar using a
concrete lemon scenario (mu = 4 oz, sigma = 0.5 oz, n = 6). Shows a dot
plot of sample means, contrasts wrong vs correct interpretations for both
parameters, and ends with a 3-rule summary box. Emphasizes "all possible
samples," context/units, and "typically" language.

Run with: manim -qm --format=mp4 apstat_57_interpret_mean_params.py InterpretMeanParams
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class InterpretMeanParams(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ================================================================
        # TITLE
        # ================================================================
        title = VGroup(
            Text("Interpreting ", font_size=44, weight=BOLD),
            MathTex(r"\mu_{\bar{x}}", font_size=48, color=BLUE_3B1B),
            Text(" and ", font_size=44, weight=BOLD),
            MathTex(r"\sigma_{\bar{x}}", font_size=48, color=YELLOW_3B1B),
        ).arrange(RIGHT, buff=0.12)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title), run_time=1.0)
        self.wait(0.3)

        # ================================================================
        # SCENARIO: lemons with mu = 4, sigma = 0.5, n = 6
        # ================================================================
        scenario_line1 = Text(
            "A lemon grove has lemons with weights:",
            font_size=26,
        )
        scenario_params = VGroup(
            MathTex(r"\mu = 4", font_size=30, color=BLUE_3B1B),
            Text(" oz,  ", font_size=26),
            MathTex(r"\sigma = 0.5", font_size=30, color=YELLOW_3B1B),
            Text(" oz", font_size=26),
        ).arrange(RIGHT, buff=0.08)
        scenario_line2 = Text(
            "We take random samples of n = 6 lemons.",
            font_size=26, color=TEAL_3B1B,
        )
        scenario = VGroup(scenario_line1, scenario_params, scenario_line2).arrange(
            DOWN, buff=0.12,
        )
        scenario.next_to(title, DOWN, buff=0.35)

        self.play(Write(scenario_line1), run_time=0.7)
        self.play(Write(scenario_params), run_time=0.7)
        self.play(Write(scenario_line2), run_time=0.7)
        self.wait(0.8)

        # ================================================================
        # SHOW mu_x-bar and sigma_x-bar values
        # ================================================================
        param_line = VGroup(
            MathTex(r"\mu_{\bar{x}}", font_size=34, color=BLUE_3B1B),
            MathTex(r"= 4", font_size=34),
            Text("      ", font_size=26),
            MathTex(r"\sigma_{\bar{x}}", font_size=34, color=YELLOW_3B1B),
            MathTex(r"= \frac{0.5}{\sqrt{6}}", font_size=32),
            MathTex(r"\approx 0.204", font_size=34, color=YELLOW_3B1B),
        ).arrange(RIGHT, buff=0.1)
        param_line.next_to(scenario, DOWN, buff=0.35)

        self.play(Write(param_line), run_time=1.0)
        self.wait(0.8)

        # Fade scenario to make room for dot plot
        self.play(
            FadeOut(scenario),
            param_line.animate.next_to(title, DOWN, buff=0.25),
            run_time=0.5,
        )

        # ================================================================
        # DOT PLOT of x-bar values centered at 4
        # ================================================================
        num_line = NumberLine(
            x_range=[3.2, 4.8, 0.2],
            length=10,
            include_numbers=True,
            numbers_to_include=[3.2, 3.4, 3.6, 3.8, 4.0, 4.2, 4.4, 4.6, 4.8],
            font_size=16,
            decimal_number_config={"num_decimal_places": 1},
            include_tip=False,
        )
        num_line.move_to(DOWN * 0.3)

        xbar_label = MathTex(r"\bar{x}", font_size=24)
        xbar_label.next_to(num_line, DOWN, buff=0.25)

        self.play(Create(num_line), Write(xbar_label), run_time=0.7)
        self.wait(0.3)

        # Mark mu = 4 with a triangle and dashed line
        mu_pos = num_line.n2p(4.0)
        mu_marker = Triangle(
            fill_color=BLUE_3B1B, fill_opacity=0.9, stroke_width=0,
        ).scale(0.15)
        mu_marker.next_to(mu_pos, DOWN, buff=0.0)
        mu_label = MathTex(r"\mu = 4", font_size=22, color=BLUE_3B1B)
        mu_label.next_to(mu_marker, DOWN, buff=0.1)
        mu_dashed = DashedLine(
            mu_pos + DOWN * 0.05, mu_pos + UP * 1.8,
            color=BLUE_3B1B, stroke_width=2, dash_length=0.08,
        )

        self.play(
            FadeIn(mu_marker), Write(mu_label), Create(mu_dashed),
            run_time=0.5,
        )
        self.wait(0.3)

        # Scatter 16 sample means around 4
        sigma_xbar = 0.5 / np.sqrt(6)  # ~0.204
        raw_means = np.random.normal(4.0, sigma_xbar, size=16)
        raw_means = np.clip(raw_means, 3.3, 4.7)

        # Stack dots at similar positions (simple dot-plot stacking)
        bin_width = 0.08
        bins = {}
        for val in raw_means:
            b = round(val / bin_width) * bin_width
            if b not in bins:
                bins[b] = 0
            bins[b] += 1

        sample_dots = VGroup()
        bin_counts = {}
        for val in raw_means:
            b = round(val / bin_width) * bin_width
            if b not in bin_counts:
                bin_counts[b] = 0
            y_offset = 0.25 + bin_counts[b] * 0.18
            bin_counts[b] += 1
            dot = Dot(
                num_line.n2p(val) + UP * y_offset,
                radius=0.07, color=TEAL_3B1B, fill_opacity=0.85,
            )
            sample_dots.add(dot)

        self.play(
            LaggedStart(
                *[FadeIn(d, shift=DOWN * 0.3) for d in sample_dots],
                lag_ratio=0.05,
            ),
            run_time=1.2,
        )
        self.wait(0.3)

        dot_note = Text(
            "Each dot = one sample mean (n = 6 lemons)",
            font_size=20, color=GREY_B,
        )
        dot_note.next_to(num_line, UP, buff=1.1)
        self.play(FadeIn(dot_note), run_time=0.4)
        self.wait(0.8)

        # ================================================================
        # TRANSITION: Clear dot plot, keep title + params
        # ================================================================
        dot_plot_stuff = VGroup(
            num_line, xbar_label, mu_marker, mu_label, mu_dashed,
            sample_dots, dot_note,
        )
        self.play(FadeOut(dot_plot_stuff), run_time=0.5)

        # ================================================================
        # INTERPRET mu_x-bar = 4
        # ================================================================
        section1_header = Text(
            "Interpreting the Mean", font_size=30, color=BLUE_3B1B, weight=BOLD,
        )
        section1_header.next_to(param_line, DOWN, buff=0.35)
        self.play(Write(section1_header), run_time=0.5)
        self.wait(0.3)

        # --- BAD interpretation ---
        bad_mean_tag = VGroup(
            Text("X", font_size=28, color=RED, weight=BOLD),
            Text("  WRONG", font_size=24, color=RED, weight=BOLD),
        ).arrange(RIGHT, buff=0.08)
        bad_mean_text = Text(
            "Every sample of 6 lemons\nwill have mean weight 4 oz.",
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
        bad_mean_group.move_to(LEFT * 3.3 + DOWN * 0.9)

        self.play(FadeIn(bad_mean_group), run_time=0.6)
        self.wait(0.8)

        # Cross it out
        cross_mean = Cross(bad_mean_group, stroke_color=RED, stroke_width=6)
        self.play(Create(cross_mean), run_time=0.5)
        self.wait(0.3)

        # --- GOOD interpretation ---
        good_mean_tag = VGroup(
            Text("ok", font_size=20, color=GREEN_3B1B, weight=BOLD),
            Text("  CORRECT", font_size=24, color=GREEN_3B1B, weight=BOLD),
        ).arrange(RIGHT, buff=0.08)
        good_mean_text = Text(
            "For all random samples of size\n"
            "n = 6 from this population, the\n"
            "sample mean weights will have\n"
            "a mean of 4 ounces.",
            font_size=22, color=WHITE, line_spacing=1.1,
        )
        good_mean_content = VGroup(good_mean_tag, good_mean_text).arrange(
            DOWN, buff=0.12, aligned_edge=LEFT,
        )
        good_mean_box = SurroundingRectangle(
            good_mean_content, color=GREEN_3B1B, buff=0.2, corner_radius=0.1,
            stroke_width=3,
        )
        good_mean_group = VGroup(good_mean_box, good_mean_content)
        good_mean_group.move_to(RIGHT * 3.3 + DOWN * 0.9)

        self.play(FadeIn(good_mean_group), run_time=0.6)
        self.wait(0.5)

        # Glow the correct box
        good_mean_glow = SurroundingRectangle(
            good_mean_content, color=GREEN_3B1B, buff=0.25, corner_radius=0.12,
            stroke_width=6,
        )
        self.play(Create(good_mean_glow), run_time=0.4)
        self.wait(0.5)

        # --- CHECKLIST ---
        check1 = Text('All possible samples', font_size=22, color=TEAL_3B1B)
        check2 = Text('In context (lemon weights)', font_size=22, color=TEAL_3B1B)
        check3 = Text('With units (ounces)', font_size=22, color=TEAL_3B1B)

        checks = VGroup(check1, check2, check3).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        checks.to_edge(DOWN, buff=0.4)

        # Add check marks
        check_marks = VGroup()
        for item in checks:
            mark = Text("\u2713 ", font_size=24, color=GREEN_3B1B, weight=BOLD)
            mark.next_to(item, LEFT, buff=0.1)
            check_marks.add(mark)

        self.play(
            LaggedStart(
                *[AnimationGroup(Write(m), Write(c)) for m, c in zip(check_marks, checks)],
                lag_ratio=0.3,
            ),
            run_time=1.5,
        )
        self.wait(1.0)

        # Clear mean interpretation section
        mean_section = VGroup(
            section1_header,
            bad_mean_group, cross_mean,
            good_mean_group, good_mean_glow,
            checks, check_marks,
        )
        self.play(FadeOut(mean_section), run_time=0.5)

        # ================================================================
        # INTERPRET sigma_x-bar = 0.204
        # ================================================================
        section2_header = Text(
            "Interpreting the Standard Deviation",
            font_size=30, color=YELLOW_3B1B, weight=BOLD,
        )
        section2_header.next_to(param_line, DOWN, buff=0.35)
        self.play(Write(section2_header), run_time=0.5)
        self.wait(0.3)

        # --- BAD interpretation ---
        bad_sd_tag = VGroup(
            Text("X", font_size=28, color=RED, weight=BOLD),
            Text("  WRONG", font_size=24, color=RED, weight=BOLD),
        ).arrange(RIGHT, buff=0.08)
        bad_sd_text = Text(
            "x-bar is always within\n0.204 of 4 oz.",
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
        bad_sd_group.move_to(LEFT * 3.3 + DOWN * 0.7)

        self.play(FadeIn(bad_sd_group), run_time=0.6)
        self.wait(0.8)

        # Cross it out
        cross_sd = Cross(bad_sd_group, stroke_color=RED, stroke_width=6)
        self.play(Create(cross_sd), run_time=0.5)
        self.wait(0.3)

        # --- GOOD interpretation ---
        good_sd_tag = VGroup(
            Text("ok", font_size=20, color=GREEN_3B1B, weight=BOLD),
            Text("  CORRECT", font_size=24, color=GREEN_3B1B, weight=BOLD),
        ).arrange(RIGHT, buff=0.08)
        good_sd_text = Text(
            "For all random samples of size 6,\n"
            "the sample mean weights will\n"
            "typically vary by about 0.204\n"
            "ounces from the population\n"
            "mean of 4 ounces.",
            font_size=22, color=WHITE, line_spacing=1.1,
        )
        good_sd_content = VGroup(good_sd_tag, good_sd_text).arrange(
            DOWN, buff=0.12, aligned_edge=LEFT,
        )
        good_sd_box = SurroundingRectangle(
            good_sd_content, color=GREEN_3B1B, buff=0.2, corner_radius=0.1,
            stroke_width=3,
        )
        good_sd_group = VGroup(good_sd_box, good_sd_content)
        good_sd_group.move_to(RIGHT * 3.3 + DOWN * 0.7)

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
            Text("  \u2014 not every single sample!", font_size=22, color=GREY_B),
        ).arrange(RIGHT, buff=0.08)
        typically_note.to_edge(DOWN, buff=0.4)

        typically_box = SurroundingRectangle(
            typically_note, color=YELLOW_3B1B, buff=0.15, corner_radius=0.1,
            stroke_width=2,
        )
        self.play(Write(typically_note), Create(typically_box), run_time=0.8)
        self.wait(1.0)

        # Clear SD interpretation section
        sd_section = VGroup(
            section2_header,
            bad_sd_group, cross_sd,
            good_sd_group, good_sd_glow,
            typically_note, typically_box,
        )
        self.play(FadeOut(sd_section), FadeOut(param_line), FadeOut(title), run_time=0.5)

        # ================================================================
        # FINAL SUMMARY BOX: 3 rules
        # ================================================================
        insight_lines = VGroup(
            Text(
                "Interpretation Checklist",
                font_size=34, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=10),  # spacer
            VGroup(
                Text("1. ", font_size=26, color=TEAL_3B1B, weight=BOLD),
                Text(
                    'Reference "all possible samples of size n"',
                    font_size=26, color=WHITE,
                ),
            ).arrange(RIGHT, buff=0.08),
            Text("", font_size=8),  # spacer
            VGroup(
                Text("2. ", font_size=26, color=TEAL_3B1B, weight=BOLD),
                Text(
                    "Use context and units",
                    font_size=26, color=WHITE,
                ),
            ).arrange(RIGHT, buff=0.08),
            Text("", font_size=8),  # spacer
            VGroup(
                Text("3. ", font_size=26, color=TEAL_3B1B, weight=BOLD),
                MathTex(r"\sigma_{\bar{x}}", font_size=30, color=YELLOW_3B1B),
                Text(
                    ':  include "typically" or "on average"',
                    font_size=26, color=WHITE,
                ),
            ).arrange(RIGHT, buff=0.08),
            Text("", font_size=10),  # spacer
            Text(
                'NEVER: "always" or "exactly"',
                font_size=24, color=RED,
            ),
        ).arrange(DOWN, buff=0.12)
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

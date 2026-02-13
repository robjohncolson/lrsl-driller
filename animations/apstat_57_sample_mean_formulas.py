"""
Sampling Distribution of x-bar: Formula Decomposition (AP Stats Unit 5, Topic 5.7a)

Builds intuition for the mean and standard deviation of the sampling distribution
of a sample mean. Starts with a population of lemon weights (mu = 4 oz,
sigma = 0.5 oz), takes repeated samples of n = 6, plots the resulting x-bar
values to form a distribution. Then decomposes the center formula (mu_xbar = mu)
and the spread formula (sigma_xbar = sigma / sqrt(n)) step by step, explaining
each component. Ends with both formulas boxed together, the 10% condition, and
a comparison to the proportions formula.

Run with: manim -qm --format=mp4 apstat_57_sample_mean_formulas.py SampleMeanFormulas
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class SampleMeanFormulas(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== TITLE ==========
        title = Text("Sampling Distribution of ", font_size=44, weight=BOLD)
        title_xbar = MathTex(r"\bar{x}", font_size=52, color=TEAL_3B1B)
        title_group = VGroup(title, title_xbar).arrange(RIGHT, buff=0.15)
        title_group.to_edge(UP, buff=0.3)
        self.play(Write(title), FadeIn(title_xbar))
        self.wait(0.5)

        # ========== PART 1: Population of lemons ==========
        mu = 4.0
        sigma = 0.5

        pop_label = Text(
            "Population: Lemon weights",
            font_size=26, color=BLUE_3B1B,
        )
        pop_label.next_to(title_group, DOWN, buff=0.35)
        self.play(Write(pop_label))

        pop_params = VGroup(
            MathTex(r"\mu = 4 \text{ oz}", font_size=30, color=YELLOW_3B1B),
            MathTex(r"\sigma = 0.5 \text{ oz}", font_size=30, color=YELLOW_3B1B),
        ).arrange(RIGHT, buff=0.6)
        pop_params.next_to(pop_label, DOWN, buff=0.2)
        self.play(Write(pop_params))
        self.wait(0.3)

        # Draw population as a bell-shaped histogram of lemon weights
        pop_size = 5000
        pop_data = np.random.normal(mu, sigma, size=pop_size)
        pop_data = np.clip(pop_data, 2.0, 6.0)

        bin_edges = np.arange(2.5, 5.6, 0.15)
        counts_pop, _ = np.histogram(pop_data, bins=bin_edges)
        max_count_pop = counts_pop.max()

        pop_bars = VGroup()
        bar_width = 0.25
        max_height = 1.8
        base_center = DOWN * 0.2

        for i, count in enumerate(counts_pop):
            height = (count / max_count_pop) * max_height
            bar = Rectangle(
                width=bar_width,
                height=max(height, 0.02),
                fill_color=BLUE_3B1B,
                fill_opacity=0.6,
                stroke_color=WHITE,
                stroke_width=0.8,
            )
            x_pos = (i - len(counts_pop) / 2 + 0.5) * (bar_width + 0.02)
            bar.move_to(base_center + RIGHT * x_pos + UP * (height / 2))
            pop_bars.add(bar)

        pop_bars.next_to(pop_params, DOWN, buff=0.25)

        # X-axis line
        pop_axis = Line(
            pop_bars.get_left() + DOWN * 0.1 + LEFT * 0.15,
            pop_bars.get_right() + DOWN * 0.1 + RIGHT * 0.15,
            color=WHITE, stroke_width=2,
        )
        pop_axis.next_to(pop_bars, DOWN, buff=0.03)

        pop_axis_label = Text("Weight (oz)", font_size=18)
        pop_axis_label.next_to(pop_axis, DOWN, buff=0.08)

        # Lemon emoji dots for flavor (small yellow dots scattered)
        lemon_dots = VGroup()
        for _ in range(20):
            lemon = Dot(
                radius=0.06,
                color=YELLOW_3B1B,
                fill_opacity=0.5,
            )
            lemon.move_to(
                pop_bars.get_center()
                + RIGHT * np.random.uniform(-2.5, 2.5)
                + UP * np.random.uniform(-0.5, 1.5)
            )
            lemon_dots.add(lemon)

        self.play(
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in pop_bars],
                lag_ratio=0.02,
            ),
            Create(pop_axis),
            Write(pop_axis_label),
            LaggedStart(
                *[FadeIn(d, scale=0.3) for d in lemon_dots],
                lag_ratio=0.02,
            ),
            run_time=1.2,
        )
        self.wait(0.5)

        # ========== PART 2: Sampling and distribution of x-bar ==========
        # Shrink population to top-left
        pop_full = VGroup(pop_label, pop_params, pop_bars, pop_axis, pop_axis_label, lemon_dots)
        self.play(
            pop_full.animate.scale(0.35).to_corner(UL, buff=0.3).shift(DOWN * 0.5),
            run_time=0.6,
        )

        sample_desc = Text(
            "Take many random samples of n = 6 lemons",
            font_size=26, color=YELLOW_3B1B,
        )
        sample_desc.next_to(title_group, DOWN, buff=0.3)
        self.play(Write(sample_desc))
        self.wait(0.3)

        sample_desc2 = Text("Record the mean weight of each sample", font_size=24)
        sample_desc2.next_to(sample_desc, DOWN, buff=0.15)
        self.play(Write(sample_desc2))
        self.wait(0.4)

        self.play(FadeOut(sample_desc), FadeOut(sample_desc2), run_time=0.4)

        # Build sampling distribution of x-bar
        n_sample = 6
        n_simulations = 500
        xbar_values = np.array([
            np.mean(np.random.normal(mu, sigma, size=n_sample))
            for _ in range(n_simulations)
        ])

        # Axes for sampling distribution
        xbar_min = 3.0
        xbar_max = 5.0
        axes = Axes(
            x_range=[xbar_min, xbar_max, 0.1],
            y_range=[0, 1, 0.2],
            x_length=10,
            y_length=2.8,
            axis_config={"include_tip": False, "include_numbers": False, "stroke_width": 1.5},
        )
        axes.shift(DOWN * 0.8)

        # X-axis labels
        x_labels = VGroup()
        for val in np.arange(3.2, 4.85, 0.2):
            lab = Text(f"{val:.1f}", font_size=14)
            lab.next_to(axes.c2p(val, 0), DOWN, buff=0.08)
            x_labels.add(lab)

        x_axis_label = MathTex(r"\bar{x}", font_size=28, color=TEAL_3B1B)
        x_axis_label.next_to(axes.x_axis, DOWN, buff=0.35)

        dist_title = Text(
            "Sampling Distribution of x-bar (n = 6, lemons)",
            font_size=22, color=TEAL_3B1B,
        )
        dist_title.next_to(axes, UP, buff=0.1)

        self.play(Create(axes), FadeIn(x_labels), Write(x_axis_label), Write(dist_title))
        self.wait(0.3)

        # Build histogram
        hist_bin_width = 0.05
        bins = np.arange(xbar_min, xbar_max + hist_bin_width, hist_bin_width)
        counts, _ = np.histogram(xbar_values, bins=bins)
        max_count = counts.max() if counts.max() > 0 else 1

        bars = VGroup()
        for i, count in enumerate(counts):
            h_norm = count / max_count
            left_edge = xbar_min + i * hist_bin_width
            center_x = left_edge + hist_bin_width / 2
            bar = Rectangle(
                width=axes.x_length * hist_bin_width / (xbar_max - xbar_min) * 0.92,
                height=max(h_norm * (axes.y_length * 0.9), 0.005),
                fill_color=GREEN_3B1B,
                fill_opacity=0.65,
                stroke_color=WHITE,
                stroke_width=0.5,
            )
            bar.move_to(axes.c2p(center_x, h_norm / 2))
            bars.add(bar)

        self.play(
            LaggedStart(
                *[FadeIn(bar, shift=UP * 0.05) for bar in bars],
                lag_ratio=0.008,
            ),
            run_time=1.2,
        )
        self.wait(0.3)

        # Mean line at mu
        mean_line = DashedLine(
            axes.c2p(mu, 0),
            axes.c2p(mu, 1.05),
            color=YELLOW_3B1B,
            stroke_width=3,
        )
        mean_label = Text("center = 4.0 oz", font_size=18, color=YELLOW_3B1B)
        mean_label.next_to(mean_line, UP, buff=0.05)
        self.play(Create(mean_line), Write(mean_label))

        # Show narrower spread than population
        spread_note = Text(
            "Narrower than the population! (less spread)",
            font_size=18, color=PINK_3B1B,
        )
        spread_note.next_to(axes, DOWN, buff=0.55)
        self.play(Write(spread_note))
        self.wait(0.8)

        # ========== PART 3: Transition to formulas ==========
        all_dist_stuff = VGroup(
            axes, x_labels, x_axis_label, dist_title, bars,
            mean_line, mean_label, spread_note,
        )
        self.play(
            FadeOut(all_dist_stuff),
            FadeOut(pop_full),
            run_time=0.6,
        )

        # ========== PART 4: CENTER formula ==========
        center_header = Text("CENTER", font_size=36, color=YELLOW_3B1B, weight=BOLD)
        center_header.move_to(UP * 2.5)
        self.play(Write(center_header))
        self.wait(0.3)

        center_explain = Text(
            "The mean of all possible x-bar values equals the population mean",
            font_size=24,
        )
        center_explain.next_to(center_header, DOWN, buff=0.3)
        self.play(Write(center_explain))
        self.wait(0.5)

        # Formula: mu_xbar = mu
        center_formula = MathTex(
            r"\mu_{\bar{x}}", r"=", r"\mu",
            font_size=48,
        )
        center_formula[0].set_color(TEAL_3B1B)
        center_formula[2].set_color(BLUE_3B1B)
        center_formula.next_to(center_explain, DOWN, buff=0.4)

        self.play(Write(center_formula), run_time=1.0)
        self.wait(0.5)

        # Numeric example
        center_numeric = MathTex(
            r"\mu_{\bar{x}} = 4 \text{ oz}",
            font_size=36, color=YELLOW_3B1B,
        )
        center_numeric.next_to(center_formula, DOWN, buff=0.25)
        self.play(Write(center_numeric))
        self.wait(0.3)

        center_note = Text(
            "Unbiased! x-bar always targets the true population mean.",
            font_size=20, color=GREEN_3B1B,
        )
        center_note.next_to(center_numeric, DOWN, buff=0.25)
        self.play(Write(center_note))
        self.wait(0.8)

        # Box the center formula
        center_box = SurroundingRectangle(
            center_formula, color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(center_box))
        self.wait(0.3)

        # Move center section to top-left
        center_section = VGroup(center_formula, center_box)
        self.play(
            FadeOut(center_header),
            FadeOut(center_explain),
            FadeOut(center_note),
            FadeOut(center_numeric),
            center_section.animate.scale(0.65).to_corner(UL, buff=0.5).shift(DOWN * 0.5),
            run_time=0.6,
        )

        # ========== PART 5: SPREAD formula decomposition ==========
        spread_header = Text("SPREAD", font_size=36, color=TEAL_3B1B, weight=BOLD)
        spread_header.move_to(UP * 2.5)
        self.play(Write(spread_header))
        self.wait(0.3)

        # Step 1: Population variance
        step1_text = Text(
            "Step 1: Start with the population variance",
            font_size=24, color=YELLOW_3B1B,
        )
        step1_text.next_to(spread_header, DOWN, buff=0.35)
        self.play(Write(step1_text))
        self.wait(0.3)

        step1_formula = MathTex(
            r"\text{Var}(\text{population})", r"=", r"\sigma^2",
            font_size=40,
        )
        step1_formula[2].set_color(BLUE_3B1B)
        step1_formula.next_to(step1_text, DOWN, buff=0.3)
        self.play(Write(step1_formula), run_time=0.8)
        self.wait(0.3)

        step1_numeric = MathTex(
            r"= (0.5)^2 = 0.25 \text{ oz}^2",
            font_size=30, color=GREY_B,
        )
        step1_numeric.next_to(step1_formula, DOWN, buff=0.2)
        self.play(Write(step1_numeric))
        self.wait(0.6)

        # Step 2: Divide by n
        self.play(FadeOut(step1_text), FadeOut(step1_numeric), run_time=0.3)

        step2_text = Text(
            "Step 2: Divide by n (averaging reduces variability)",
            font_size=24, color=YELLOW_3B1B,
        )
        step2_text.move_to(step1_text.get_center())
        self.play(Write(step2_text))
        self.wait(0.3)

        step2_formula = MathTex(
            r"\text{Var}(\bar{x})", r"=", r"\frac{\sigma^2}{n}",
            font_size=42,
        )
        step2_formula[0].set_color(TEAL_3B1B)
        step2_formula[2].set_color(BLUE_3B1B)
        step2_formula.next_to(step2_text, DOWN, buff=0.3)

        # Animate transition from step 1 to step 2
        self.play(
            TransformMatchingShapes(step1_formula, step2_formula),
            run_time=1.0,
        )
        self.wait(0.3)

        step2_numeric = MathTex(
            r"= \frac{0.25}{6} = 0.0417 \text{ oz}^2",
            font_size=30, color=GREY_B,
        )
        step2_numeric.next_to(step2_formula, DOWN, buff=0.2)
        self.play(Write(step2_numeric))
        self.wait(0.3)

        step2_note = Text(
            "More observations (larger n) = less spread",
            font_size=20, color=GREY_B,
        )
        step2_note.next_to(step2_numeric, DOWN, buff=0.15)
        self.play(Write(step2_note))
        self.wait(0.6)

        # Step 3: Take the square root
        self.play(FadeOut(step2_text), FadeOut(step2_numeric), FadeOut(step2_note), run_time=0.3)

        step3_text = Text(
            "Step 3: Take the square root for the standard deviation",
            font_size=24, color=YELLOW_3B1B,
        )
        step3_text.move_to(step2_text.get_center())
        self.play(Write(step3_text))
        self.wait(0.3)

        step3_formula = MathTex(
            r"\sigma_{\bar{x}}", r"=", r"\frac{\sigma}{\sqrt{n}}",
            font_size=48,
        )
        step3_formula[0].set_color(TEAL_3B1B)
        step3_formula[2].set_color(BLUE_3B1B)
        step3_formula.next_to(step3_text, DOWN, buff=0.35)

        self.play(
            TransformMatchingShapes(step2_formula, step3_formula),
            run_time=1.0,
        )
        self.wait(0.3)

        step3_numeric = MathTex(
            r"= \frac{0.5}{\sqrt{6}} \approx 0.204 \text{ oz}",
            font_size=30, color=GREY_B,
        )
        step3_numeric.next_to(step3_formula, DOWN, buff=0.2)
        self.play(Write(step3_numeric))
        self.wait(0.5)

        # Highlight what each piece means
        brace_sigma = Brace(step3_formula[2], DOWN, buff=0.15)
        brace_label = Text("Population spread / sample size correction", font_size=18, color=GREY_B)
        brace_label.next_to(brace_sigma, DOWN, buff=0.1)

        self.play(
            FadeOut(step3_numeric),
            GrowFromCenter(brace_sigma),
            Write(brace_label),
        )
        self.wait(0.8)

        # Box the spread formula
        spread_box = SurroundingRectangle(
            step3_formula, color=TEAL_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(
            FadeOut(brace_sigma), FadeOut(brace_label),
            Create(spread_box),
        )
        self.wait(0.5)

        # ========== PART 6: 10% condition ==========
        self.play(FadeOut(step3_text), run_time=0.3)

        condition_text = Text(
            "Requires: n < 10% of N  (population size)",
            font_size=22, color=RED,
        )
        condition_text.next_to(spread_box, DOWN, buff=0.4)

        condition_explain = Text(
            "Sampling without replacement is approximately independent",
            font_size=18, color=GREY_B,
        )
        condition_explain.next_to(condition_text, DOWN, buff=0.12)

        self.play(Write(condition_text))
        self.play(Write(condition_explain))
        self.wait(0.8)

        # ========== PART 7: Final summary box ==========
        self.play(
            FadeOut(spread_header),
            FadeOut(step3_formula), FadeOut(spread_box),
            FadeOut(condition_text), FadeOut(condition_explain),
            FadeOut(center_section),
            run_time=0.5,
        )

        # Rebuild title
        final_title = Text("Sampling Distribution of ", font_size=40, weight=BOLD)
        final_title_xbar = MathTex(r"\bar{x}", font_size=48, color=TEAL_3B1B)
        final_title_grp = VGroup(final_title, final_title_xbar).arrange(RIGHT, buff=0.12)
        final_title_grp.to_edge(UP, buff=0.3)
        self.play(
            Transform(title_group, final_title_grp),
            run_time=0.5,
        )

        # Center formula row
        final_center_label = Text("Center:", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        final_center = MathTex(
            r"\mu_{\bar{x}} = \mu",
            font_size=44,
        )
        final_center.set_color(TEAL_3B1B)
        center_row = VGroup(final_center_label, final_center).arrange(RIGHT, buff=0.3)

        # Spread formula row
        final_spread_label = Text("Spread:", font_size=28, color=TEAL_3B1B, weight=BOLD)
        final_spread = MathTex(
            r"\sigma_{\bar{x}} = \frac{\sigma}{\sqrt{n}}",
            font_size=44,
        )
        final_spread.set_color(BLUE_3B1B)
        spread_row = VGroup(final_spread_label, final_spread).arrange(RIGHT, buff=0.3)

        # 10% condition
        final_condition = Text(
            "Condition: n < 10% of N",
            font_size=24, color=RED,
        )

        # Group summary
        summary = VGroup(center_row, spread_row, final_condition).arrange(DOWN, buff=0.4)
        summary.move_to(ORIGIN + DOWN * 0.1)

        self.play(
            LaggedStart(
                Write(final_center_label),
                Write(final_center),
                lag_ratio=0.3,
            ),
            run_time=0.8,
        )
        self.wait(0.2)

        self.play(
            LaggedStart(
                Write(final_spread_label),
                Write(final_spread),
                lag_ratio=0.3,
            ),
            run_time=0.8,
        )
        self.wait(0.2)

        self.play(Write(final_condition))
        self.wait(0.3)

        # Surrounding box
        final_box = SurroundingRectangle(
            summary, color=YELLOW_3B1B, buff=0.35, corner_radius=0.15,
        )
        self.play(Create(final_box))
        self.wait(0.8)

        # ========== PART 8: Comparison to proportions ==========
        compare_header = Text(
            "Compare to proportions:",
            font_size=24, color=PINK_3B1B, weight=BOLD,
        )
        compare_header.next_to(final_box, DOWN, buff=0.4)

        compare_prop = MathTex(
            r"\text{Proportions: } \sigma_{\hat{p}} = \sqrt{\frac{p(1-p)}{n}}",
            font_size=32, color=PINK_3B1B,
        )
        compare_mean = MathTex(
            r"\text{Means: } \sigma_{\bar{x}} = \frac{\sigma}{\sqrt{n}}",
            font_size=32, color=TEAL_3B1B,
        )
        compare_group = VGroup(compare_prop, compare_mean).arrange(DOWN, buff=0.2)
        compare_group.next_to(compare_header, DOWN, buff=0.2)

        self.play(Write(compare_header))
        self.play(Write(compare_prop))
        self.play(Write(compare_mean))

        # Highlight similarity: both divide by n (or sqrt(n))
        both_note = Text(
            "Both shrink spread by the sample size!",
            font_size=20, color=GREEN_3B1B,
        )
        both_note.next_to(compare_group, DOWN, buff=0.15)
        self.play(Write(both_note))
        self.wait(2.0)

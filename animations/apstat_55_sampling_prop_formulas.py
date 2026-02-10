"""
Sampling Distribution of p-hat: Formula Decomposition (AP Stats Unit 5, Topic 5.5)

Builds intuition for the mean and standard deviation of the sampling distribution
of a sample proportion. Starts with a population where proportion p = 0.60 are
"successes," takes repeated samples of size n, plots the resulting p-hat values
on a number line to form a distribution. Then decomposes the center formula
(mu_p-hat = p) and the spread formula (sigma_p-hat = sqrt(p(1-p)/n)) step by
step, explaining each component. Ends with both formulas boxed together and the
10% condition reminder.

Run with: manim -qm --format=mp4 apstat_55_sampling_prop_formulas.py SamplingPropFormulas
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class SamplingPropFormulas(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== TITLE ==========
        title = Text("Sampling Distribution of ", font_size=44, weight=BOLD)
        title_phat = MathTex(r"\hat{p}", font_size=52, color=TEAL_3B1B)
        title_group = VGroup(title, title_phat).arrange(RIGHT, buff=0.15)
        title_group.to_edge(UP, buff=0.3)
        self.play(Write(title), FadeIn(title_phat))
        self.wait(0.5)

        # ========== PART 1: Population with proportion p ==========
        p = 0.60
        N_pop = 100  # dots to show
        n_success = int(p * N_pop)
        n_failure = N_pop - n_success

        pop_label = Text("Population: p = 0.60 are Successes", font_size=26, color=BLUE_3B1B)
        pop_label.next_to(title_group, DOWN, buff=0.35)
        self.play(Write(pop_label))

        # Draw population as a grid of dots (10x10)
        pop_dots = VGroup()
        dot_positions = []
        for row in range(10):
            for col in range(10):
                dot_positions.append((row, col))

        # Shuffle so successes are scattered, not in order
        np.random.shuffle(dot_positions)
        success_positions = set(range(n_success))

        for i, (row, col) in enumerate(dot_positions):
            is_success = i in success_positions
            color = BLUE_3B1B if is_success else "#555555"
            dot = Dot(
                point=RIGHT * (col - 4.5) * 0.32 + UP * (1.6 - row * 0.32),
                radius=0.1,
                color=color,
                fill_opacity=0.85 if is_success else 0.4,
            )
            pop_dots.add(dot)

        pop_dots.next_to(pop_label, DOWN, buff=0.25)

        self.play(
            LaggedStart(
                *[FadeIn(d, scale=0.5) for d in pop_dots],
                lag_ratio=0.005,
            ),
            run_time=1.0,
        )
        self.wait(0.3)

        # Legend
        legend_success = VGroup(
            Dot(radius=0.08, color=BLUE_3B1B),
            Text("= Success (p = 0.60)", font_size=18, color=BLUE_3B1B),
        ).arrange(RIGHT, buff=0.1)
        legend_fail = VGroup(
            Dot(radius=0.08, color="#555555", fill_opacity=0.4),
            Text("= Failure (1 - p = 0.40)", font_size=18, color=GREY_B),
        ).arrange(RIGHT, buff=0.1)
        legend = VGroup(legend_success, legend_fail).arrange(DOWN, aligned_edge=LEFT, buff=0.08)
        legend.next_to(pop_dots, RIGHT, buff=0.4)
        self.play(FadeIn(legend))
        self.wait(0.8)

        # ========== PART 2: Take samples and build distribution ==========
        # Shrink population to top-left
        pop_full = VGroup(pop_label, pop_dots, legend)
        self.play(
            pop_full.animate.scale(0.35).to_corner(UL, buff=0.3).shift(DOWN * 0.5),
            run_time=0.6,
        )

        # Sampling description
        sample_desc = Text("Take many random samples of n = 50", font_size=26, color=YELLOW_3B1B)
        sample_desc.next_to(title_group, DOWN, buff=0.3)
        self.play(Write(sample_desc))
        self.wait(0.3)

        sample_desc2 = Text("Record each sample proportion (p-hat)", font_size=24)
        sample_desc2.next_to(sample_desc, DOWN, buff=0.15)
        self.play(Write(sample_desc2))
        self.wait(0.5)

        self.play(FadeOut(sample_desc), FadeOut(sample_desc2), run_time=0.4)

        # Build sampling distribution of p-hat
        n_sample = 50
        n_simulations = 500
        phat_values = np.random.binomial(n_sample, p, size=n_simulations) / n_sample

        # Number line / axes
        phat_min = 0.30
        phat_max = 0.90
        axes = Axes(
            x_range=[phat_min, phat_max, 0.05],
            y_range=[0, 1, 0.2],
            x_length=10,
            y_length=2.8,
            axis_config={"include_tip": False, "include_numbers": False, "stroke_width": 1.5},
        )
        axes.shift(DOWN * 0.8)

        # X-axis labels
        x_labels = VGroup()
        for val in np.arange(0.35, 0.86, 0.05):
            lab = Text(f"{val:.2f}", font_size=14)
            lab.next_to(axes.c2p(val, 0), DOWN, buff=0.08)
            x_labels.add(lab)

        x_axis_label = MathTex(r"\hat{p}", font_size=28, color=TEAL_3B1B)
        x_axis_label.next_to(axes.x_axis, DOWN, buff=0.35)

        dist_title = Text(
            "Sampling Distribution of p-hat (n = 50, p = 0.60)",
            font_size=22, color=TEAL_3B1B,
        )
        dist_title.next_to(axes, UP, buff=0.1)

        self.play(Create(axes), FadeIn(x_labels), Write(x_axis_label), Write(dist_title))
        self.wait(0.3)

        # Build histogram
        bin_width = 0.02
        bins = np.arange(phat_min, phat_max + bin_width, bin_width)
        counts, _ = np.histogram(phat_values, bins=bins)
        max_count = counts.max() if counts.max() > 0 else 1

        bars = VGroup()
        for i, count in enumerate(counts):
            h_norm = count / max_count
            left_edge = phat_min + i * bin_width
            center_x = left_edge + bin_width / 2
            bar = Rectangle(
                width=axes.x_length * bin_width / (phat_max - phat_min) * 0.92,
                height=max(h_norm * (axes.y_length * 0.9), 0.005),
                fill_color=TEAL_3B1B,
                fill_opacity=0.65,
                stroke_color=WHITE,
                stroke_width=0.5,
            )
            bar.move_to(axes.c2p(center_x, h_norm / 2))
            bars.add(bar)

        self.play(
            LaggedStart(
                *[FadeIn(bar, shift=UP * 0.05) for bar in bars],
                lag_ratio=0.01,
            ),
            run_time=1.2,
        )
        self.wait(0.3)

        # Mean line at p = 0.60
        mean_line = DashedLine(
            axes.c2p(p, 0),
            axes.c2p(p, 1.05),
            color=YELLOW_3B1B,
            stroke_width=3,
        )
        mean_label = Text("center = p = 0.60", font_size=18, color=YELLOW_3B1B)
        mean_label.next_to(mean_line, UP, buff=0.05)
        self.play(Create(mean_line), Write(mean_label))
        self.wait(0.8)

        # ========== PART 3: Transition to formulas ==========
        all_dist_stuff = VGroup(
            axes, x_labels, x_axis_label, dist_title, bars, mean_line, mean_label,
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
            "The mean of all possible p-hat values equals p",
            font_size=24,
        )
        center_explain.next_to(center_header, DOWN, buff=0.3)
        self.play(Write(center_explain))
        self.wait(0.5)

        # Formula: mu_phat = p
        center_formula = MathTex(
            r"\mu_{\hat{p}}", r"=", r"p",
            font_size=48,
        )
        center_formula[0].set_color(TEAL_3B1B)
        center_formula[2].set_color(BLUE_3B1B)
        center_formula.next_to(center_explain, DOWN, buff=0.4)

        self.play(Write(center_formula), run_time=1.0)
        self.wait(0.5)

        # Annotation: "The sampling distribution is centered at the true proportion"
        center_note = Text(
            "Unbiased! The sampling distribution is centered at the true proportion.",
            font_size=20, color=GREEN_3B1B,
        )
        center_note.next_to(center_formula, DOWN, buff=0.3)
        self.play(Write(center_note))
        self.wait(1.0)

        # Box the center formula
        center_box = SurroundingRectangle(
            center_formula, color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(center_box))
        self.wait(0.5)

        # Move center section to top-left
        center_section = VGroup(center_formula, center_box)
        self.play(
            FadeOut(center_header),
            FadeOut(center_explain),
            FadeOut(center_note),
            center_section.animate.scale(0.65).to_corner(UL, buff=0.5).shift(DOWN * 0.5),
            run_time=0.6,
        )

        # ========== PART 5: SPREAD formula decomposition ==========
        spread_header = Text("SPREAD", font_size=36, color=TEAL_3B1B, weight=BOLD)
        spread_header.move_to(UP * 2.5)
        self.play(Write(spread_header))
        self.wait(0.3)

        # Step 1: Single binary trial variance
        step1_text = Text(
            "Step 1: Variance of a single binary (0/1) trial",
            font_size=24, color=YELLOW_3B1B,
        )
        step1_text.next_to(spread_header, DOWN, buff=0.35)
        self.play(Write(step1_text))
        self.wait(0.3)

        step1_formula = MathTex(
            r"\text{Var}(\text{one trial})", r"=", r"p", r"(", r"1-p", r")",
            font_size=40,
        )
        step1_formula[2].set_color(BLUE_3B1B)
        step1_formula[4].set_color(PINK_3B1B)
        step1_formula.next_to(step1_text, DOWN, buff=0.3)
        self.play(Write(step1_formula), run_time=1.0)
        self.wait(0.3)

        step1_note = Text(
            "This is largest when p = 0.5 (most uncertainty)",
            font_size=20, color=GREY_B,
        )
        step1_note.next_to(step1_formula, DOWN, buff=0.2)
        self.play(Write(step1_note))
        self.wait(0.8)

        # Step 2: Divide by n
        self.play(FadeOut(step1_text), FadeOut(step1_note), run_time=0.3)

        step2_text = Text(
            "Step 2: Divide by n (averaging reduces variability)",
            font_size=24, color=YELLOW_3B1B,
        )
        step2_text.move_to(step1_text.get_center())
        self.play(Write(step2_text))
        self.wait(0.3)

        step2_formula = MathTex(
            r"\text{Var}(\hat{p})", r"=", r"\frac{p(1-p)}{n}",
            font_size=42,
        )
        step2_formula[0].set_color(TEAL_3B1B)
        step2_formula[2].set_color(BLUE_3B1B)
        step2_formula.next_to(step2_text, DOWN, buff=0.3)

        # Animate the transition from step 1 to step 2
        self.play(
            TransformMatchingShapes(step1_formula, step2_formula),
            run_time=1.0,
        )
        self.wait(0.3)

        step2_note = Text(
            "More observations (larger n) = less spread",
            font_size=20, color=GREY_B,
        )
        step2_note.next_to(step2_formula, DOWN, buff=0.2)
        self.play(Write(step2_note))
        self.wait(0.8)

        # Step 3: Take the square root for standard deviation
        self.play(FadeOut(step2_text), FadeOut(step2_note), run_time=0.3)

        step3_text = Text(
            "Step 3: Take the square root for the standard deviation",
            font_size=24, color=YELLOW_3B1B,
        )
        step3_text.move_to(step2_text.get_center())
        self.play(Write(step3_text))
        self.wait(0.3)

        step3_formula = MathTex(
            r"\sigma_{\hat{p}}", r"=", r"\sqrt{\frac{p(1-p)}{n}}",
            font_size=48,
        )
        step3_formula[0].set_color(TEAL_3B1B)
        step3_formula[2].set_color(BLUE_3B1B)
        step3_formula.next_to(step3_text, DOWN, buff=0.35)

        self.play(
            TransformMatchingShapes(step2_formula, step3_formula),
            run_time=1.0,
        )
        self.wait(0.5)

        # Highlight what each piece means
        brace_p = Brace(step3_formula[2], DOWN, buff=0.15)
        brace_p_label = Text("Binary trial variance / sample size", font_size=18, color=GREY_B)
        brace_p_label.next_to(brace_p, DOWN, buff=0.1)

        self.play(GrowFromCenter(brace_p), Write(brace_p_label))
        self.wait(1.0)

        # Box the spread formula
        spread_box = SurroundingRectangle(
            step3_formula, color=TEAL_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(
            FadeOut(brace_p), FadeOut(brace_p_label),
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
        self.wait(1.0)

        # ========== PART 7: Final summary — both formulas boxed ==========
        self.play(
            FadeOut(spread_header),
            FadeOut(step3_formula), FadeOut(spread_box),
            FadeOut(condition_text), FadeOut(condition_explain),
            FadeOut(center_section),
            run_time=0.5,
        )

        # Rebuild title
        final_title = Text("Sampling Distribution of ", font_size=40, weight=BOLD)
        final_title_phat = MathTex(r"\hat{p}", font_size=48, color=TEAL_3B1B)
        final_title_grp = VGroup(final_title, final_title_phat).arrange(RIGHT, buff=0.12)
        final_title_grp.to_edge(UP, buff=0.3)
        self.play(
            Transform(title_group, final_title_grp),
            run_time=0.5,
        )

        # Center formula
        final_center_label = Text("Center:", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        final_center = MathTex(
            r"\mu_{\hat{p}} = p",
            font_size=44,
        )
        final_center.set_color(TEAL_3B1B)
        center_row = VGroup(final_center_label, final_center).arrange(RIGHT, buff=0.3)

        # Spread formula
        final_spread_label = Text("Spread:", font_size=28, color=TEAL_3B1B, weight=BOLD)
        final_spread = MathTex(
            r"\sigma_{\hat{p}} = \sqrt{\frac{p(1-p)}{n}}",
            font_size=44,
        )
        final_spread.set_color(BLUE_3B1B)
        spread_row = VGroup(final_spread_label, final_spread).arrange(RIGHT, buff=0.3)

        # Condition
        final_condition = Text(
            "Condition: n < 10% of N",
            font_size=24, color=RED,
        )

        # Group all
        summary = VGroup(center_row, spread_row, final_condition).arrange(DOWN, buff=0.4)
        summary.move_to(ORIGIN + DOWN * 0.2)

        self.play(
            LaggedStart(
                Write(final_center_label),
                Write(final_center),
                lag_ratio=0.3,
            ),
            run_time=1.0,
        )
        self.wait(0.3)

        self.play(
            LaggedStart(
                Write(final_spread_label),
                Write(final_spread),
                lag_ratio=0.3,
            ),
            run_time=1.0,
        )
        self.wait(0.3)

        self.play(Write(final_condition))
        self.wait(0.3)

        # Big surrounding rectangle around everything
        final_box = SurroundingRectangle(
            summary, color=YELLOW_3B1B, buff=0.35, corner_radius=0.15,
        )
        self.play(Create(final_box))
        self.wait(2.5)

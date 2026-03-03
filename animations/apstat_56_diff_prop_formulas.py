"""
Sampling Distribution of p-hat1 - p-hat2: Formula Decomposition (AP Stats Unit 5, Topic 5.6)

Builds intuition for the sampling distribution of the difference in sample
proportions. Starts with two populations (p1 = 0.60, p2 = 0.40) shown as
colored dot grids, animates taking paired random samples and plotting the
resulting differences on a number line to form a distribution. Then
decomposes the mean formula (mu = p1 - p2) and the standard deviation
formula (sigma = sqrt(p1(1-p1)/n1 + p2(1-p2)/n2)) step by step,
emphasizing that variances always ADD. Ends with both formulas boxed
together and the 10% condition reminder.

Run with: manim -qm --format=mp4 apstat_56_diff_prop_formulas.py DiffPropFormulas
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class DiffPropFormulas(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== TITLE ==========
        title = Text("Sampling Distribution of  ", font_size=40, weight=BOLD)
        title_math = MathTex(
            r"\hat{p}_1 - \hat{p}_2",
            font_size=48, color=TEAL_3B1B,
        )
        title_group = VGroup(title, title_math).arrange(RIGHT, buff=0.12)
        title_group.to_edge(UP, buff=0.3)
        self.play(Write(title), FadeIn(title_math))
        self.wait(0.4)

        # ========== PART 1: Two Population Dot Grids ==========
        # --- Population 1 (left): p1 = 0.60, blue successes ---
        p1 = 0.60
        pop1_label = Text("Population 1:  p\u2081 = 0.60", font_size=22, color=BLUE_3B1B)
        pop1_label.move_to(LEFT * 3.5 + UP * 1.6)

        n_pop = 50  # 10 x 5 grid
        n_success_1 = int(p1 * n_pop)
        indices_1 = list(range(n_pop))
        np.random.shuffle(indices_1)
        success_set_1 = set(indices_1[:n_success_1])

        pop1_dots = VGroup()
        for idx in range(n_pop):
            row = idx // 10
            col = idx % 10
            is_success = idx in success_set_1
            color = BLUE_3B1B if is_success else "#555555"
            dot = Dot(
                point=pop1_label.get_center() + DOWN * (0.5 + row * 0.28) + RIGHT * (col - 4.5) * 0.28,
                radius=0.08,
                color=color,
                fill_opacity=0.85 if is_success else 0.35,
            )
            pop1_dots.add(dot)

        # --- Population 2 (right): p2 = 0.40, teal successes ---
        p2 = 0.40
        pop2_label = Text("Population 2:  p\u2082 = 0.40", font_size=22, color=TEAL_3B1B)
        pop2_label.move_to(RIGHT * 3.5 + UP * 1.6)

        n_success_2 = int(p2 * n_pop)
        indices_2 = list(range(n_pop))
        np.random.shuffle(indices_2)
        success_set_2 = set(indices_2[:n_success_2])

        pop2_dots = VGroup()
        for idx in range(n_pop):
            row = idx // 10
            col = idx % 10
            is_success = idx in success_set_2
            color = TEAL_3B1B if is_success else "#555555"
            dot = Dot(
                point=pop2_label.get_center() + DOWN * (0.5 + row * 0.28) + RIGHT * (col - 4.5) * 0.28,
                radius=0.08,
                color=color,
                fill_opacity=0.85 if is_success else 0.35,
            )
            pop2_dots.add(dot)

        self.play(
            Write(pop1_label), Write(pop2_label),
            LaggedStart(*[FadeIn(d, scale=0.5) for d in pop1_dots], lag_ratio=0.008),
            LaggedStart(*[FadeIn(d, scale=0.5) for d in pop2_dots], lag_ratio=0.008),
            run_time=1.0,
        )
        self.wait(0.5)

        # ========== PART 2: Paired Sampling and Dotplot ==========
        # Shrink populations to top corners
        pop1_group = VGroup(pop1_label, pop1_dots)
        pop2_group = VGroup(pop2_label, pop2_dots)
        self.play(
            pop1_group.animate.scale(0.55).to_corner(UL, buff=0.15).shift(DOWN * 0.45),
            pop2_group.animate.scale(0.55).to_corner(UR, buff=0.15).shift(DOWN * 0.45),
            run_time=0.6,
        )

        sample_desc = Text(
            "Take paired samples (n\u2081 = n\u2082 = 40), compute  ",
            font_size=22, color=YELLOW_3B1B,
        )
        sample_math = MathTex(r"\hat{p}_1 - \hat{p}_2", font_size=26, color=YELLOW_3B1B)
        sample_row = VGroup(sample_desc, sample_math).arrange(RIGHT, buff=0.08)
        sample_row.next_to(title_group, DOWN, buff=0.2)
        self.play(Write(sample_desc), FadeIn(sample_math))
        self.wait(0.3)

        # Number line for the dotplot
        n1, n2 = 40, 40
        true_diff = p1 - p2  # 0.20
        nl_min, nl_max = -0.15, 0.55
        number_line = NumberLine(
            x_range=[nl_min, nl_max, 0.05],
            length=10,
            include_numbers=True,
            numbers_to_include=np.arange(-0.10, 0.55, 0.10).round(2),
            font_size=16,
            include_tip=False,
            stroke_width=2,
        )
        number_line.shift(DOWN * 1.5)
        nl_label = MathTex(r"\hat{p}_1 - \hat{p}_2", font_size=22, color=TEAL_3B1B)
        nl_label.next_to(number_line, DOWN, buff=0.25)

        self.play(Create(number_line), Write(nl_label), run_time=0.5)
        self.wait(0.2)

        # Simulate and animate 15 paired samples
        n_vis_samples = 15
        diff_values = []
        dot_stacks = {}  # binned x -> count for stacking
        bin_width_nl = 0.02
        plotted_dots = VGroup()

        for s in range(n_vis_samples):
            phat1 = np.random.binomial(n1, p1) / n1
            phat2 = np.random.binomial(n2, p2) / n2
            diff_val = phat1 - phat2
            diff_values.append(diff_val)

            # Highlight random subset of dots in each population
            highlight_1 = VGroup()
            sample_idx_1 = np.random.choice(len(pop1_dots), size=min(8, len(pop1_dots)), replace=False)
            for i in sample_idx_1:
                highlight_1.add(pop1_dots[i].copy().set_color(YELLOW_3B1B).set_opacity(1).scale(1.4))

            highlight_2 = VGroup()
            sample_idx_2 = np.random.choice(len(pop2_dots), size=min(8, len(pop2_dots)), replace=False)
            for i in sample_idx_2:
                highlight_2.add(pop2_dots[i].copy().set_color(YELLOW_3B1B).set_opacity(1).scale(1.4))

            # Bin the value for stacking
            bin_key = round(diff_val / bin_width_nl) * bin_width_nl
            if bin_key not in dot_stacks:
                dot_stacks[bin_key] = 0
            stack_level = dot_stacks[bin_key]
            dot_stacks[bin_key] += 1

            # Create dot on number line
            x_pos = number_line.n2p(diff_val)
            dot_on_nl = Dot(
                point=x_pos + UP * (0.12 + stack_level * 0.15),
                radius=0.06,
                color=TEAL_3B1B,
                fill_opacity=0.9,
            )

            if s < 3:
                # Show first 3 slowly with highlights
                self.play(
                    FadeIn(highlight_1), FadeIn(highlight_2),
                    run_time=0.25,
                )
                self.play(
                    FadeOut(highlight_1), FadeOut(highlight_2),
                    FadeIn(dot_on_nl, scale=0.5),
                    run_time=0.25,
                )
            else:
                # Fast for remaining
                self.play(FadeIn(dot_on_nl, scale=0.3), run_time=0.08)

            plotted_dots.add(dot_on_nl)

        self.wait(0.3)

        # Show center line at true difference
        center_line = DashedLine(
            number_line.n2p(true_diff) + DOWN * 0.1,
            number_line.n2p(true_diff) + UP * 1.8,
            color=YELLOW_3B1B, stroke_width=2.5,
        )
        center_label = Text(
            f"Center = p\u2081 \u2212 p\u2082 = {true_diff:.2f}",
            font_size=20, color=YELLOW_3B1B,
        )
        center_label.next_to(center_line, UP, buff=0.05)
        self.play(Create(center_line), Write(center_label))
        self.wait(0.8)

        # ========== PART 3: Transition to Formulas ==========
        all_sampling_stuff = VGroup(
            sample_row, number_line, nl_label, plotted_dots,
            center_line, center_label, pop1_group, pop2_group,
        )
        self.play(FadeOut(all_sampling_stuff), run_time=0.5)

        # ========== PART 4: MEAN Formula ==========
        center_header = Text("MEAN", font_size=36, color=YELLOW_3B1B, weight=BOLD)
        center_header.move_to(UP * 2.5)
        self.play(Write(center_header))
        self.wait(0.2)

        center_explain = Text(
            "The mean equals the difference in population proportions",
            font_size=24,
        )
        center_explain.next_to(center_header, DOWN, buff=0.3)
        self.play(Write(center_explain))
        self.wait(0.4)

        mean_formula = MathTex(
            r"\mu_{\hat{p}_1 - \hat{p}_2}",
            r"=",
            r"p_1 - p_2",
            font_size=48,
        )
        mean_formula[0].set_color(TEAL_3B1B)
        mean_formula[2].set_color(BLUE_3B1B)
        mean_formula.next_to(center_explain, DOWN, buff=0.4)
        self.play(Write(mean_formula), run_time=1.0)
        self.wait(0.4)

        center_note = Text(
            "Unbiased! Each sample proportion targets its population proportion.",
            font_size=20, color=GREEN_3B1B,
        )
        center_note.next_to(mean_formula, DOWN, buff=0.3)
        self.play(Write(center_note))
        self.wait(0.8)

        mean_box = SurroundingRectangle(
            mean_formula, color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(mean_box))
        self.wait(0.3)

        # Shrink mean section to top-left
        mean_section = VGroup(mean_formula, mean_box)
        self.play(
            FadeOut(center_header), FadeOut(center_explain), FadeOut(center_note),
            mean_section.animate.scale(0.6).to_corner(UL, buff=0.5).shift(DOWN * 0.5),
            run_time=0.6,
        )

        # ========== PART 5: SD Formula Decomposition ==========
        spread_header = Text("STANDARD DEVIATION", font_size=32, color=TEAL_3B1B, weight=BOLD)
        spread_header.move_to(UP * 2.5)
        self.play(Write(spread_header))
        self.wait(0.2)

        # Step 1: Variance of p-hat1
        step1_label = Text(
            "Step 1: Variance of  ",
            font_size=24, color=YELLOW_3B1B,
        )
        step1_math_label = MathTex(r"\hat{p}_1", font_size=30, color=BLUE_3B1B)
        step1_row = VGroup(step1_label, step1_math_label).arrange(RIGHT, buff=0.08)
        step1_row.next_to(spread_header, DOWN, buff=0.35)
        self.play(Write(step1_label), FadeIn(step1_math_label))
        self.wait(0.2)

        step1_formula = MathTex(
            r"\text{Var}(\hat{p}_1)", r"=",
            r"\frac{p_1(1 - p_1)}{n_1}",
            font_size=40,
        )
        step1_formula[0].set_color(BLUE_3B1B)
        step1_formula[2].set_color(BLUE_3B1B)
        step1_formula.next_to(step1_row, DOWN, buff=0.3)
        self.play(Write(step1_formula), run_time=0.8)
        self.wait(0.5)

        # Step 2: Variance of p-hat2
        step2_label = Text(
            "Step 2: Variance of  ",
            font_size=24, color=YELLOW_3B1B,
        )
        step2_math_label = MathTex(r"\hat{p}_2", font_size=30, color=TEAL_3B1B)
        step2_row = VGroup(step2_label, step2_math_label).arrange(RIGHT, buff=0.08)
        step2_row.next_to(step1_formula, DOWN, buff=0.35)

        step2_formula = MathTex(
            r"\text{Var}(\hat{p}_2)", r"=",
            r"\frac{p_2(1 - p_2)}{n_2}",
            font_size=40,
        )
        step2_formula[0].set_color(TEAL_3B1B)
        step2_formula[2].set_color(TEAL_3B1B)
        step2_formula.next_to(step2_row, DOWN, buff=0.3)

        self.play(
            FadeOut(step1_row),
            step1_formula.animate.scale(0.75).to_edge(LEFT, buff=1.0).shift(UP * 0.6),
            run_time=0.5,
        )
        self.play(Write(step2_label), FadeIn(step2_math_label))
        self.play(Write(step2_formula), run_time=0.8)
        self.wait(0.5)

        # Step 3: Variances ADD
        self.play(
            FadeOut(step2_row),
            step2_formula.animate.scale(0.75).next_to(step1_formula, DOWN, buff=0.25, aligned_edge=LEFT),
            run_time=0.4,
        )

        step3_label = Text(
            "Step 3: Variances ADD (even for differences!)",
            font_size=26, color=PINK_3B1B, weight=BOLD,
        )
        step3_label.next_to(spread_header, DOWN, buff=0.35)
        self.play(Write(step3_label))
        self.wait(0.3)

        add_formula = MathTex(
            r"\text{Var}(\hat{p}_1 - \hat{p}_2)",
            r"=",
            r"\frac{p_1(1-p_1)}{n_1}",
            r"+",
            r"\frac{p_2(1-p_2)}{n_2}",
            font_size=36,
        )
        add_formula[0].set_color(TEAL_3B1B)
        add_formula[2].set_color(BLUE_3B1B)
        add_formula[3].set_color(PINK_3B1B)
        add_formula[4].set_color(TEAL_3B1B)
        add_formula.move_to(DOWN * 0.3)
        self.play(
            FadeOut(step1_formula), FadeOut(step2_formula),
            Write(add_formula),
            run_time=1.0,
        )

        # Emphasize the plus sign
        plus_box = SurroundingRectangle(
            add_formula[3], color=PINK_3B1B, buff=0.12, corner_radius=0.05,
        )
        plus_note = Text(
            "Always + , never \u2212",
            font_size=20, color=PINK_3B1B, weight=BOLD,
        )
        plus_note.next_to(plus_box, DOWN, buff=0.15)
        self.play(Create(plus_box), Write(plus_note))
        self.wait(0.8)

        # Step 4: Take square root for SD
        self.play(
            FadeOut(step3_label), FadeOut(plus_box), FadeOut(plus_note),
            run_time=0.3,
        )

        step4_label = Text(
            "Step 4: Take the square root for standard deviation",
            font_size=24, color=YELLOW_3B1B,
        )
        step4_label.next_to(spread_header, DOWN, buff=0.35)
        self.play(Write(step4_label))
        self.wait(0.2)

        sd_formula = MathTex(
            r"\sigma_{\hat{p}_1 - \hat{p}_2}",
            r"=",
            r"\sqrt{\frac{p_1(1-p_1)}{n_1} + \frac{p_2(1-p_2)}{n_2}}",
            font_size=44,
        )
        sd_formula[0].set_color(TEAL_3B1B)
        sd_formula[2].set_color(BLUE_3B1B)
        sd_formula.move_to(DOWN * 0.3)

        self.play(
            TransformMatchingShapes(add_formula, sd_formula),
            run_time=1.0,
        )
        self.wait(0.5)

        sd_box = SurroundingRectangle(
            sd_formula, color=TEAL_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(sd_box))
        self.wait(0.5)

        # ========== PART 6: 10% Condition ==========
        self.play(FadeOut(step4_label), run_time=0.3)

        condition_text = Text(
            "Requires: Both  n\u2081 < 10% \u00b7 N\u2081   AND   n\u2082 < 10% \u00b7 N\u2082",
            font_size=22, color=RED,
        )
        condition_text.next_to(sd_box, DOWN, buff=0.4)

        condition_explain = Text(
            "Samples must be independent within each population",
            font_size=18, color=GREY_B,
        )
        condition_explain.next_to(condition_text, DOWN, buff=0.12)

        self.play(Write(condition_text))
        self.play(Write(condition_explain))
        self.wait(0.8)

        # ========== PART 7: Final Summary Box ==========
        self.play(
            FadeOut(spread_header), FadeOut(sd_formula), FadeOut(sd_box),
            FadeOut(condition_text), FadeOut(condition_explain),
            FadeOut(mean_section),
            run_time=0.5,
        )

        # Rebuild title
        final_title = Text("Sampling Distribution of  ", font_size=38, weight=BOLD)
        final_title_math = MathTex(
            r"\hat{p}_1 - \hat{p}_2",
            font_size=46, color=TEAL_3B1B,
        )
        final_title_grp = VGroup(final_title, final_title_math).arrange(RIGHT, buff=0.12)
        final_title_grp.to_edge(UP, buff=0.3)
        self.play(
            Transform(title_group, final_title_grp),
            run_time=0.5,
        )

        # Mean row
        final_mean_label = Text("Mean:", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        final_mean = MathTex(
            r"\mu_{\hat{p}_1 - \hat{p}_2} = p_1 - p_2",
            font_size=40,
        )
        final_mean.set_color(TEAL_3B1B)
        mean_row = VGroup(final_mean_label, final_mean).arrange(RIGHT, buff=0.3)

        # SD row
        final_sd_label = Text("SD:", font_size=28, color=TEAL_3B1B, weight=BOLD)
        final_sd = MathTex(
            r"\sigma_{\hat{p}_1 - \hat{p}_2} = \sqrt{\frac{p_1(1-p_1)}{n_1} + \frac{p_2(1-p_2)}{n_2}}",
            font_size=36,
        )
        final_sd.set_color(BLUE_3B1B)
        sd_row = VGroup(final_sd_label, final_sd).arrange(RIGHT, buff=0.3)

        # Variance note
        var_note = Text(
            "Variances ADD (even for differences!)",
            font_size=22, color=PINK_3B1B, weight=BOLD,
        )

        # 10% condition
        final_condition = Text(
            "Condition:  n\u2081 < 10% \u00b7 N\u2081  AND  n\u2082 < 10% \u00b7 N\u2082",
            font_size=22, color=RED,
        )

        summary = VGroup(mean_row, sd_row, var_note, final_condition).arrange(DOWN, buff=0.35)
        summary.move_to(ORIGIN + DOWN * 0.2)

        self.play(
            LaggedStart(
                Write(final_mean_label), Write(final_mean),
                lag_ratio=0.3,
            ),
            run_time=0.8,
        )
        self.wait(0.2)

        self.play(
            LaggedStart(
                Write(final_sd_label), Write(final_sd),
                lag_ratio=0.3,
            ),
            run_time=1.0,
        )
        self.wait(0.2)

        self.play(Write(var_note))
        self.wait(0.2)

        self.play(Write(final_condition))
        self.wait(0.2)

        # Big surrounding rectangle
        final_box = SurroundingRectangle(
            summary, color=YELLOW_3B1B, buff=0.35, corner_radius=0.15,
        )
        self.play(Create(final_box))
        self.wait(2.5)

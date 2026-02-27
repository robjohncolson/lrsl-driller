"""
Sampling Distribution of x-bar1 - x-bar2: Formula Decomposition (AP Stats Unit 5, Topic 5.8)

Builds intuition for the sampling distribution of the difference in sample
means. Starts with two populations (Pop 1: mu1=4, sigma1=0.5 and Pop 2:
mu2=3, sigma2=0.4), animates taking paired random samples of n1=6 and n2=6,
plots the resulting differences on a number line. Then decomposes the center
formula (mu = mu1 - mu2) and the spread formula
(sigma = sqrt(sigma1^2/n1 + sigma2^2/n2)) step by step, emphasizing that
variances always ADD even for differences. Ends with both formulas boxed
together, the 10% condition, a numerical example, and a comparison to the
proportions formula.

Run: manim -qm --format=mp4 apstat_58_diff_mean_formulas.py DiffMeanFormulas
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class DiffMeanFormulas(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== TITLE ==========
        title = Text("Sampling Distribution of  ", font_size=40, weight=BOLD)
        title_math = MathTex(
            r"\bar{x}_1 - \bar{x}_2",
            font_size=48, color=TEAL_3B1B,
        )
        title_group = VGroup(title, title_math).arrange(RIGHT, buff=0.12)
        title_group.to_edge(UP, buff=0.3)
        self.play(Write(title), FadeIn(title_math))
        self.wait(0.4)

        # ========== PART 1: Two Population Boxes ==========
        # --- Population 1 (left): mu1=4, sigma1=0.5 ---
        mu1, sigma1 = 4.0, 0.5
        pop1_header = Text("Population 1", font_size=22, color=BLUE_3B1B, weight=BOLD)
        pop1_params = VGroup(
            MathTex(r"\mu_1 = 4", font_size=26, color=YELLOW_3B1B),
            MathTex(r"\sigma_1 = 0.5", font_size=26, color=YELLOW_3B1B),
        ).arrange(DOWN, buff=0.1)
        pop1_content = VGroup(pop1_header, pop1_params).arrange(DOWN, buff=0.15)
        pop1_box = SurroundingRectangle(
            pop1_content, color=BLUE_3B1B, buff=0.2, corner_radius=0.1,
        )
        pop1_group = VGroup(pop1_box, pop1_content)
        pop1_group.move_to(LEFT * 3 + UP * 0.8)

        # --- Population 2 (right): mu2=3, sigma2=0.4 ---
        mu2, sigma2 = 3.0, 0.4
        pop2_header = Text("Population 2", font_size=22, color=TEAL_3B1B, weight=BOLD)
        pop2_params = VGroup(
            MathTex(r"\mu_2 = 3", font_size=26, color=YELLOW_3B1B),
            MathTex(r"\sigma_2 = 0.4", font_size=26, color=YELLOW_3B1B),
        ).arrange(DOWN, buff=0.1)
        pop2_content = VGroup(pop2_header, pop2_params).arrange(DOWN, buff=0.15)
        pop2_box = SurroundingRectangle(
            pop2_content, color=TEAL_3B1B, buff=0.2, corner_radius=0.1,
        )
        pop2_group = VGroup(pop2_box, pop2_content)
        pop2_group.move_to(RIGHT * 3 + UP * 0.8)

        self.play(
            FadeIn(pop1_group), FadeIn(pop2_group),
            run_time=0.8,
        )
        self.wait(0.4)

        # --- Arrows down to samples ---
        n1, n2 = 6, 6
        sample1_label = MathTex(r"n_1 = 6", font_size=26, color=BLUE_3B1B)
        sample1_label.next_to(pop1_group, DOWN, buff=0.6)
        arrow1 = Arrow(
            pop1_group.get_bottom(), sample1_label.get_top(),
            buff=0.1, color=BLUE_3B1B, stroke_width=3,
        )
        sample1_text = Text("Sample", font_size=18, color=BLUE_3B1B)
        sample1_text.next_to(arrow1, LEFT, buff=0.08)

        sample2_label = MathTex(r"n_2 = 6", font_size=26, color=TEAL_3B1B)
        sample2_label.next_to(pop2_group, DOWN, buff=0.6)
        arrow2 = Arrow(
            pop2_group.get_bottom(), sample2_label.get_top(),
            buff=0.1, color=TEAL_3B1B, stroke_width=3,
        )
        sample2_text = Text("Sample", font_size=18, color=TEAL_3B1B)
        sample2_text.next_to(arrow2, RIGHT, buff=0.08)

        self.play(
            GrowArrow(arrow1), Write(sample1_label), Write(sample1_text),
            GrowArrow(arrow2), Write(sample2_label), Write(sample2_text),
            run_time=0.7,
        )
        self.wait(0.3)

        # --- Arrow to difference ---
        diff_label = MathTex(
            r"\bar{x}_1 - \bar{x}_2",
            font_size=34, color=GREEN_3B1B,
        )
        diff_label.move_to(DOWN * 1.8)

        arrow_diff_1 = Arrow(
            sample1_label.get_bottom(), diff_label.get_left() + UP * 0.1,
            buff=0.15, color=GREEN_3B1B, stroke_width=2.5,
        )
        arrow_diff_2 = Arrow(
            sample2_label.get_bottom(), diff_label.get_right() + UP * 0.1,
            buff=0.15, color=GREEN_3B1B, stroke_width=2.5,
        )

        self.play(
            GrowArrow(arrow_diff_1), GrowArrow(arrow_diff_2),
            Write(diff_label),
            run_time=0.7,
        )
        self.wait(0.3)

        diff_desc = Text(
            "Compute the difference in sample means",
            font_size=20, color=GREY_B,
        )
        diff_desc.next_to(diff_label, DOWN, buff=0.2)
        self.play(Write(diff_desc))
        self.wait(0.8)

        # ========== PART 2: Transition to Formulas ==========
        all_pop_stuff = VGroup(
            pop1_group, pop2_group,
            arrow1, arrow2, sample1_label, sample2_label,
            sample1_text, sample2_text,
            arrow_diff_1, arrow_diff_2, diff_label, diff_desc,
        )
        self.play(FadeOut(all_pop_stuff), run_time=0.5)

        # ========== PART 3: CENTER Formula ==========
        center_header = Text("CENTER", font_size=36, color=YELLOW_3B1B, weight=BOLD)
        center_header.move_to(UP * 2.5)
        self.play(Write(center_header))
        self.wait(0.2)

        center_explain = Text(
            "The mean equals the difference in population means",
            font_size=24,
        )
        center_explain.next_to(center_header, DOWN, buff=0.3)
        self.play(Write(center_explain))
        self.wait(0.4)

        mean_formula = MathTex(
            r"\mu_{\bar{x}_1 - \bar{x}_2}",
            r"=",
            r"\mu_1 - \mu_2",
            font_size=48,
        )
        mean_formula[0].set_color(TEAL_3B1B)
        mean_formula[2].set_color(BLUE_3B1B)
        mean_formula.next_to(center_explain, DOWN, buff=0.4)
        self.play(Write(mean_formula), run_time=1.0)
        self.wait(0.4)

        center_note = Text(
            "Unbiased! Each sample mean targets its population mean.",
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

        # ========== PART 4: SPREAD Formula Decomposition ==========
        spread_header = Text("STANDARD DEVIATION", font_size=32, color=TEAL_3B1B, weight=BOLD)
        spread_header.move_to(UP * 2.5)
        self.play(Write(spread_header))
        self.wait(0.2)

        # Step 1: Variance of x-bar1
        step1_label = Text(
            "Step 1: Variance of  ",
            font_size=24, color=YELLOW_3B1B,
        )
        step1_math_label = MathTex(r"\bar{x}_1", font_size=30, color=BLUE_3B1B)
        step1_row = VGroup(step1_label, step1_math_label).arrange(RIGHT, buff=0.08)
        step1_row.next_to(spread_header, DOWN, buff=0.35)
        self.play(Write(step1_label), FadeIn(step1_math_label))
        self.wait(0.2)

        step1_formula = MathTex(
            r"\text{Var}(\bar{x}_1)", r"=",
            r"\frac{\sigma_1^2}{n_1}",
            font_size=40,
        )
        step1_formula[0].set_color(BLUE_3B1B)
        step1_formula[2].set_color(BLUE_3B1B)
        step1_formula.next_to(step1_row, DOWN, buff=0.3)
        self.play(Write(step1_formula), run_time=0.8)
        self.wait(0.5)

        # Step 2: Variance of x-bar2
        step2_label = Text(
            "Step 2: Variance of  ",
            font_size=24, color=YELLOW_3B1B,
        )
        step2_math_label = MathTex(r"\bar{x}_2", font_size=30, color=TEAL_3B1B)
        step2_row = VGroup(step2_label, step2_math_label).arrange(RIGHT, buff=0.08)
        step2_row.next_to(step1_formula, DOWN, buff=0.35)

        step2_formula = MathTex(
            r"\text{Var}(\bar{x}_2)", r"=",
            r"\frac{\sigma_2^2}{n_2}",
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

        # Step 3: Variances ADD (even for differences!)
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
            r"\text{Var}(\bar{x}_1 - \bar{x}_2)",
            r"=",
            r"\frac{\sigma_1^2}{n_1}",
            r"+",
            r"\frac{\sigma_2^2}{n_2}",
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
            r"\sigma_{\bar{x}_1 - \bar{x}_2}",
            r"=",
            r"\sqrt{\frac{\sigma_1^2}{n_1} + \frac{\sigma_2^2}{n_2}}",
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

        # ========== PART 5: Variance Trap Insight Box ==========
        self.play(FadeOut(step4_label), run_time=0.3)

        trap_text = Text(
            "Variances ALWAYS add \u2014 even for differences!",
            font_size=24, color=PINK_3B1B, weight=BOLD,
        )
        trap_explain = Text(
            "Each sample adds its own uncertainty to the difference",
            font_size=18, color=GREY_B,
        )
        trap_group = VGroup(trap_text, trap_explain).arrange(DOWN, buff=0.1)
        trap_group.next_to(sd_box, DOWN, buff=0.35)
        trap_box = SurroundingRectangle(
            trap_group, color=PINK_3B1B, buff=0.2, corner_radius=0.1,
        )

        self.play(Write(trap_text), Write(trap_explain), Create(trap_box))
        self.wait(1.0)

        # ========== PART 6: 10% Condition ==========
        self.play(FadeOut(trap_text), FadeOut(trap_explain), FadeOut(trap_box), run_time=0.3)

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

        # ========== PART 7: Numerical Example ==========
        self.play(
            FadeOut(spread_header), FadeOut(sd_formula), FadeOut(sd_box),
            FadeOut(condition_text), FadeOut(condition_explain),
            FadeOut(mean_section),
            run_time=0.5,
        )

        example_header = Text("Numerical Example", font_size=32, color=YELLOW_3B1B, weight=BOLD)
        example_header.move_to(UP * 2.8)
        self.play(Write(example_header))
        self.wait(0.2)

        # Parameters
        ex_params = VGroup(
            MathTex(
                r"\mu_1 = 4, \quad \sigma_1 = 0.5, \quad n_1 = 6",
                font_size=28, color=BLUE_3B1B,
            ),
            MathTex(
                r"\mu_2 = 3, \quad \sigma_2 = 0.4, \quad n_2 = 6",
                font_size=28, color=TEAL_3B1B,
            ),
        ).arrange(DOWN, buff=0.15)
        ex_params.next_to(example_header, DOWN, buff=0.3)
        self.play(Write(ex_params))
        self.wait(0.3)

        # Center calculation
        ex_center_label = Text("Center:", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        ex_center = MathTex(
            r"\mu_{\bar{x}_1 - \bar{x}_2} = 4 - 3 = 1",
            font_size=32,
        )
        ex_center.set_color(TEAL_3B1B)
        ex_center_row = VGroup(ex_center_label, ex_center).arrange(RIGHT, buff=0.2)
        ex_center_row.next_to(ex_params, DOWN, buff=0.35)
        self.play(Write(ex_center_label), Write(ex_center))
        self.wait(0.3)

        # Spread calculation (step by step)
        ex_spread_label = Text("Spread:", font_size=24, color=TEAL_3B1B, weight=BOLD)
        ex_spread_label.next_to(ex_center_row, DOWN, buff=0.3).align_to(ex_center_label, LEFT)
        self.play(Write(ex_spread_label))

        ex_var_step = MathTex(
            r"\frac{0.5^2}{6} + \frac{0.4^2}{6}",
            r"=",
            r"\frac{0.25}{6} + \frac{0.16}{6}",
            r"=",
            r"0.0417 + 0.0267",
            r"=",
            r"0.0683",
            font_size=26,
        )
        ex_var_step.next_to(ex_spread_label, DOWN, buff=0.2).shift(RIGHT * 0.5)
        self.play(Write(ex_var_step), run_time=1.2)
        self.wait(0.3)

        ex_sd_result = MathTex(
            r"\sigma_{\bar{x}_1 - \bar{x}_2} = \sqrt{0.0683} \approx 0.2615",
            font_size=30, color=GREEN_3B1B,
        )
        ex_sd_result.next_to(ex_var_step, DOWN, buff=0.25)
        self.play(Write(ex_sd_result))
        self.wait(1.0)

        # ========== PART 8: Final Summary Box ==========
        self.play(
            FadeOut(example_header), FadeOut(ex_params),
            FadeOut(ex_center_row), FadeOut(ex_spread_label),
            FadeOut(ex_var_step), FadeOut(ex_sd_result),
            run_time=0.5,
        )

        # Rebuild title
        final_title = Text("Sampling Distribution of  ", font_size=38, weight=BOLD)
        final_title_math = MathTex(
            r"\bar{x}_1 - \bar{x}_2",
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
            r"\mu_{\bar{x}_1 - \bar{x}_2} = \mu_1 - \mu_2",
            font_size=40,
        )
        final_mean.set_color(TEAL_3B1B)
        mean_row = VGroup(final_mean_label, final_mean).arrange(RIGHT, buff=0.3)

        # SD row
        final_sd_label = Text("SD:", font_size=28, color=TEAL_3B1B, weight=BOLD)
        final_sd = MathTex(
            r"\sigma_{\bar{x}_1 - \bar{x}_2} = \sqrt{\frac{\sigma_1^2}{n_1} + \frac{\sigma_2^2}{n_2}}",
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
        summary.move_to(ORIGIN + DOWN * 0.1)

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
        self.wait(0.8)

        # ========== PART 9: Comparison to Proportions ==========
        compare_header = Text(
            "Compare: same structure as proportions!",
            font_size=22, color=PINK_3B1B, weight=BOLD,
        )
        compare_header.next_to(final_box, DOWN, buff=0.35)

        compare_prop = MathTex(
            r"\sigma_{\hat{p}_1 - \hat{p}_2} = \sqrt{\frac{p_1(1-p_1)}{n_1} + \frac{p_2(1-p_2)}{n_2}}",
            font_size=28, color=PINK_3B1B,
        )
        compare_mean = MathTex(
            r"\sigma_{\bar{x}_1 - \bar{x}_2} = \sqrt{\frac{\sigma_1^2}{n_1} + \frac{\sigma_2^2}{n_2}}",
            font_size=28, color=TEAL_3B1B,
        )
        compare_group = VGroup(compare_prop, compare_mean).arrange(DOWN, buff=0.15)
        compare_group.next_to(compare_header, DOWN, buff=0.15)

        self.play(Write(compare_header))
        self.play(Write(compare_prop))
        self.play(Write(compare_mean))

        both_note = Text(
            "Add variances from each sample, then take the square root!",
            font_size=18, color=GREEN_3B1B,
        )
        both_note.next_to(compare_group, DOWN, buff=0.12)
        self.play(Write(both_note))
        self.wait(2.0)

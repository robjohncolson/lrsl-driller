"""
Topic 5.8 Capstone: Differences in Sample Means — Complete Overview
(AP Stats Unit 5, Topic 5.8)

Synthesis animation covering all 5.8 concepts: parameters of the sampling
distribution of x-bar1 - x-bar2, shape conditions (both normal or both n>=30),
interpretation rules, probability via z-scores, and a side-by-side comparison
of single means (5.7) vs difference in means (5.8). Ends with the key insight:
"Same framework, extended to two populations — variances always add!"

Run: manim -qm --format=mp4 apstat_58_diff_mean_capstone.py DiffMeanCapstone
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class DiffMeanCapstone(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ==================== HELPERS ====================
        def make_box(texts, box_color, pos, width=5.0, min_height=0.7):
            """Rounded rectangle node with centered text lines."""
            content = VGroup()
            for t_str, t_size, t_color, t_weight in texts:
                if t_str.startswith("$") and t_str.endswith("$"):
                    item = MathTex(t_str[1:-1], font_size=t_size, color=t_color)
                else:
                    item = Text(
                        t_str, font_size=t_size, color=t_color,
                        weight=t_weight if t_weight else NORMAL,
                    )
                content.add(item)
            content.arrange(DOWN, buff=0.06)

            content_height = content.get_height()
            box_height = max(min_height, content_height + 0.3)

            box = RoundedRectangle(
                corner_radius=0.15,
                width=width, height=box_height,
                stroke_color=box_color, stroke_width=2.5,
                fill_color=box_color, fill_opacity=0.1,
            )
            box.move_to(pos)
            content.move_to(box.get_center())
            return VGroup(box, content)

        # ==================== 1. TITLE ====================
        title = Text("Topic 5.8: Complete Summary", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.25)
        subtitle = Text(
            "Differences in Sample Means",
            font_size=24, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.12)

        self.play(Write(title), run_time=0.8)
        self.play(FadeIn(subtitle), run_time=0.5)
        self.wait(0.5)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ==================== 2. PARAMETERS SECTION ====================
        param_header = Text("Parameters", font_size=30, color=BLUE_3B1B, weight=BOLD)
        param_header.next_to(title, DOWN, buff=0.4)
        self.play(Write(param_header), run_time=0.5)

        formula_mean = MathTex(
            r"\mu_{\bar{x}_1 - \bar{x}_2} = \mu_1 - \mu_2",
            font_size=34, color=WHITE,
        )
        formula_sd = MathTex(
            r"\sigma_{\bar{x}_1 - \bar{x}_2} = "
            r"\sqrt{\frac{\sigma_1^2}{n_1} + \frac{\sigma_2^2}{n_2}}",
            font_size=34, color=WHITE,
        )
        formula_group = VGroup(formula_mean, formula_sd).arrange(DOWN, buff=0.25)
        formula_group.next_to(param_header, DOWN, buff=0.3)

        param_card = SurroundingRectangle(
            formula_group, color=BLUE_3B1B, buff=0.3,
            corner_radius=0.15, stroke_width=2.5,
        )

        self.play(Write(formula_mean), run_time=0.7)
        self.play(Write(formula_sd), run_time=0.8)
        self.play(Create(param_card), run_time=0.4)
        self.wait(0.4)

        # 10% condition below the card
        cond_label = Text("10% Condition:", font_size=22, color=YELLOW_3B1B, weight=BOLD)
        cond_math = MathTex(
            r"n_1 < 0.10 \cdot N_1 \;\;\text{AND}\;\; n_2 < 0.10 \cdot N_2",
            font_size=24, color=WHITE,
        )
        cond_row = VGroup(cond_label, cond_math).arrange(RIGHT, buff=0.25)
        cond_row.next_to(param_card, DOWN, buff=0.3)

        self.play(Write(cond_label), Write(cond_math), run_time=0.7)
        self.wait(0.6)

        # Clear parameters section
        params_all = VGroup(param_header, formula_mean, formula_sd, param_card,
                            cond_label, cond_math)
        self.play(FadeOut(params_all), run_time=0.4)

        # ==================== 3. SHAPE SECTION ====================
        shape_header = Text("Shape: When Is It Normal?", font_size=30,
                            color=TEAL_3B1B, weight=BOLD)
        shape_header.next_to(title, DOWN, buff=0.4)
        self.play(Write(shape_header), run_time=0.5)

        # Two columns
        col_left = make_box(
            [
                ("Both Populations Normal", 20, TEAL_3B1B, BOLD),
                ("Any sample sizes", 22, WHITE, BOLD),
            ],
            TEAL_3B1B, LEFT * 3.2 + DOWN * 0.4, width=4.5,
        )
        col_right = make_box(
            [
                ("Otherwise", 20, YELLOW_3B1B, BOLD),
                ("Need BOTH", 18, WHITE, BOLD),
                ("$n_1 \\geq 30 \\;\\text{AND}\\; n_2 \\geq 30$", 22, WHITE, None),
            ],
            YELLOW_3B1B, RIGHT * 3.2 + DOWN * 0.45, width=4.5,
        )

        # Divider line
        divider = Line(
            UP * 0.1, DOWN * 1.3,
            color=GRAY, stroke_width=1.5,
        )

        self.play(
            FadeIn(col_left), FadeIn(col_right), Create(divider),
            run_time=0.8,
        )
        self.wait(0.3)

        # Arrow labels beneath each box
        left_arrow_text = Text("Any n works", font_size=18, color=TEAL_3B1B)
        left_arrow_text.next_to(col_left, DOWN, buff=0.15)
        right_arrow_text = Text("Large n required for both", font_size=18,
                                color=YELLOW_3B1B)
        right_arrow_text.next_to(col_right, DOWN, buff=0.15)

        self.play(Write(left_arrow_text), Write(right_arrow_text), run_time=0.5)
        self.wait(0.6)

        # Clear shape section
        shape_all = VGroup(shape_header, col_left, col_right, divider,
                           left_arrow_text, right_arrow_text)
        self.play(FadeOut(shape_all), run_time=0.4)

        # ==================== 4. INTERPRETATION SECTION ====================
        interp_header = Text("Interpretation Rules", font_size=30,
                             color=GREEN_3B1B, weight=BOLD)
        interp_header.next_to(title, DOWN, buff=0.4)
        self.play(Write(interp_header), run_time=0.5)

        rule1_num = Text("1", font_size=22, color=GREEN_3B1B, weight=BOLD)
        rule1_txt = Text(
            "\"All possible pairs of samples",
            font_size=21, color=WHITE,
        )
        rule1_txt2 = Text(
            "of size n\u2081 and n\u2082\"",
            font_size=21, color=WHITE,
        )
        rule1_content = VGroup(rule1_txt, rule1_txt2).arrange(DOWN, buff=0.04,
                                                               aligned_edge=LEFT)
        rule1 = VGroup(rule1_num, rule1_content).arrange(RIGHT, buff=0.2)

        rule2_num = Text("2", font_size=22, color=GREEN_3B1B, weight=BOLD)
        rule2_txt = Text("Include context and units", font_size=22, color=WHITE)
        rule2 = VGroup(rule2_num, rule2_txt).arrange(RIGHT, buff=0.2)

        rule3_num = Text("3", font_size=22, color=GREEN_3B1B, weight=BOLD)
        rule3_txt_a = Text("Use \"typically\" for ", font_size=22, color=WHITE)
        rule3_sigma = MathTex(
            r"\sigma_{\bar{x}_1 - \bar{x}_2}",
            font_size=26, color=YELLOW_3B1B,
        )
        rule3 = VGroup(rule3_num, rule3_txt_a, rule3_sigma).arrange(RIGHT, buff=0.15)

        rules_group = VGroup(rule1, rule2, rule3).arrange(
            DOWN, aligned_edge=LEFT, buff=0.3,
        )
        rules_group.next_to(interp_header, DOWN, buff=0.35)

        for rule in [rule1, rule2, rule3]:
            self.play(Write(rule), run_time=0.6)
            self.wait(0.2)

        # Highlight box around all three rules
        rules_rect = SurroundingRectangle(
            rules_group, color=GREEN_3B1B, buff=0.25,
            corner_radius=0.12, stroke_width=2.5,
        )
        self.play(Create(rules_rect), run_time=0.4)
        self.wait(0.6)

        # Clear interpretation
        interp_all = VGroup(interp_header, rules_group, rules_rect)
        self.play(FadeOut(interp_all), run_time=0.4)

        # ==================== 5. PROBABILITY SECTION ====================
        prob_header = Text("Calculating Probability", font_size=30,
                           color=YELLOW_3B1B, weight=BOLD)
        prob_header.next_to(title, DOWN, buff=0.4)
        self.play(Write(prob_header), run_time=0.5)

        z_formula = MathTex(
            r"z = \frac{"
            r"(\bar{x}_1 - \bar{x}_2) - \mu_{\bar{x}_1 - \bar{x}_2}"
            r"}{"
            r"\sigma_{\bar{x}_1 - \bar{x}_2}"
            r"}",
            font_size=36, color=WHITE,
        )
        z_formula.next_to(prob_header, DOWN, buff=0.4)

        z_rect = SurroundingRectangle(
            z_formula, color=YELLOW_3B1B, buff=0.25,
            corner_radius=0.12, stroke_width=2.5,
        )

        self.play(Write(z_formula), run_time=0.8)
        self.play(Create(z_rect), run_time=0.4)
        self.wait(0.3)

        # Arrow pointing to next step
        arrow_down = Arrow(
            z_rect.get_bottom(), z_rect.get_bottom() + DOWN * 0.8,
            color=WHITE, buff=0.08, stroke_width=2.5,
        )
        table_text = Text("Use normalcdf / table", font_size=24,
                          color=GREEN_3B1B, weight=BOLD)
        table_text.next_to(arrow_down, DOWN, buff=0.15)

        unusual_text = Text("Unusual if P < 0.05", font_size=22,
                            color=PINK_3B1B, weight=BOLD)
        unusual_text.next_to(table_text, DOWN, buff=0.2)

        self.play(Create(arrow_down), run_time=0.3)
        self.play(Write(table_text), run_time=0.5)
        self.play(Write(unusual_text), run_time=0.5)
        self.wait(0.6)

        # Clear probability
        prob_all = VGroup(prob_header, z_formula, z_rect, arrow_down,
                          table_text, unusual_text)
        self.play(FadeOut(prob_all), run_time=0.4)

        # ==================== 6. COMPARISON TABLE: Single Mean vs Diff in Means ==========
        comp_header = Text("The Big Picture", font_size=30,
                           color=PINK_3B1B, weight=BOLD)
        comp_header.next_to(title, DOWN, buff=0.3)
        self.play(Write(comp_header), run_time=0.5)

        # Column headers
        col_single_header = Text("Single Mean (5.7)", font_size=18,
                                 color=BLUE_3B1B, weight=BOLD)
        col_diff_header = Text("Diff in Means (5.8)", font_size=18,
                               color=TEAL_3B1B, weight=BOLD)
        single_sym = MathTex(r"\bar{x}", font_size=24, color=BLUE_3B1B)
        diff_sym = MathTex(
            r"\bar{x}_1 - \bar{x}_2", font_size=24, color=TEAL_3B1B,
        )

        single_col_title = VGroup(col_single_header, single_sym).arrange(
            DOWN, buff=0.05,
        )
        diff_col_title = VGroup(col_diff_header, diff_sym).arrange(
            DOWN, buff=0.05,
        )

        # Column x-positions
        col_x = [-5.0, -1.0, 3.6]
        header_y = 0.35

        single_col_title.move_to(RIGHT * col_x[1] + UP * header_y)
        diff_col_title.move_to(RIGHT * col_x[2] + UP * header_y)

        self.play(Write(single_col_title), Write(diff_col_title), run_time=0.6)

        # Separator line below headers
        sep_line = Line(
            LEFT * 6.4 + UP * (header_y - 0.35),
            RIGHT * 6.4 + UP * (header_y - 0.35),
            color=GRAY, stroke_width=1,
        )
        self.play(Create(sep_line), run_time=0.2)

        # Table data rows
        row_y_start = header_y - 0.75
        row_spacing = 0.65

        # Row 1: Center
        r1_label = Text("Center", font_size=18, color=PINK_3B1B, weight=BOLD)
        r1_single = MathTex(r"\mu", font_size=24, color=WHITE)
        r1_diff = MathTex(r"\mu_1 - \mu_2", font_size=24, color=WHITE)

        # Row 2: Spread
        r2_label = Text("Spread", font_size=18, color=PINK_3B1B, weight=BOLD)
        r2_single = MathTex(
            r"\frac{\sigma}{\sqrt{n}}", font_size=24, color=WHITE,
        )
        r2_diff = MathTex(
            r"\sqrt{\frac{\sigma_1^2}{n_1} + \frac{\sigma_2^2}{n_2}}",
            font_size=22, color=WHITE,
        )

        # Row 3: Shape
        r3_label = Text("Shape", font_size=18, color=PINK_3B1B, weight=BOLD)
        r3_single_line1 = Text("Normal pop", font_size=15, color=GREEN_3B1B,
                               weight=BOLD)
        r3_single_line2 = Text("OR", font_size=13, color=GRAY)
        r3_single_line3 = MathTex(r"n \geq 30", font_size=20, color=WHITE)
        r3_single = VGroup(r3_single_line1, r3_single_line2,
                           r3_single_line3).arrange(DOWN, buff=0.04)

        r3_diff_line1 = Text("Both normal", font_size=15, color=TEAL_3B1B,
                             weight=BOLD)
        r3_diff_line2 = Text("OR", font_size=13, color=GRAY)
        r3_diff_line3 = Text("both", font_size=15, color=WHITE)
        r3_diff_line4 = MathTex(r"n \geq 30", font_size=20, color=WHITE)
        r3_diff_34 = VGroup(r3_diff_line3, r3_diff_line4).arrange(
            RIGHT, buff=0.12,
        )
        r3_diff = VGroup(r3_diff_line1, r3_diff_line2,
                         r3_diff_34).arrange(DOWN, buff=0.04)

        # Row 4: 10% Condition
        r4_label = Text("10%", font_size=18, color=PINK_3B1B, weight=BOLD)
        r4_single = MathTex(r"n < 0.10N", font_size=22, color=WHITE)
        r4_diff_line1 = Text("Both", font_size=15, color=WHITE)
        r4_diff_line2 = MathTex(r"n < 0.10N", font_size=22, color=WHITE)
        r4_diff = VGroup(r4_diff_line1, r4_diff_line2).arrange(
            RIGHT, buff=0.12,
        )

        rows = [
            (r1_label, r1_single, r1_diff),
            (r2_label, r2_single, r2_diff),
            (r3_label, r3_single, r3_diff),
            (r4_label, r4_single, r4_diff),
        ]

        all_table_items = []
        for r_idx, (label, single_cell, diff_cell) in enumerate(rows):
            y = row_y_start - r_idx * row_spacing
            # Adjust spacing for taller rows 3 and 4
            if r_idx >= 2:
                y = row_y_start - r_idx * row_spacing - 0.1

            label.move_to(RIGHT * col_x[0] + UP * y)
            single_cell.move_to(RIGHT * col_x[1] + UP * y)
            diff_cell.move_to(RIGHT * col_x[2] + UP * y)

            self.play(
                Write(label), Write(single_cell), Write(diff_cell),
                run_time=0.6,
            )
            all_table_items.extend([label, single_cell, diff_cell])
            self.wait(0.2)

        # Vertical separator between columns
        v_sep = Line(
            RIGHT * 1.3 + UP * (header_y - 0.35),
            RIGHT * 1.3 + DOWN * 2.6,
            color=GRAY, stroke_width=1,
        )
        self.play(Create(v_sep), run_time=0.2)
        self.wait(1.0)

        # Clear comparison table
        table_all = VGroup(
            comp_header, single_col_title, diff_col_title,
            sep_line, v_sep, *all_table_items,
        )
        self.play(FadeOut(table_all), run_time=0.5)

        # ==================== 7. FINAL INSIGHT ====================
        self.play(FadeOut(title), run_time=0.3)

        insight_title = Text(
            "Topic 5.8 Key Takeaway", font_size=32,
            color=YELLOW_3B1B, weight=BOLD,
        )

        insight_line1 = Text(
            "Same framework, extended to",
            font_size=28, color=WHITE,
        )
        insight_line2 = Text(
            "two populations!", font_size=32,
            color=TEAL_3B1B, weight=BOLD,
        )

        spacer = Text("", font_size=8)

        insight_line3 = Text(
            "Variances ALWAYS add", font_size=28,
            color=PINK_3B1B, weight=BOLD,
        )
        insight_line4 = Text(
            "even for differences!", font_size=26,
            color=PINK_3B1B,
        )

        spacer2 = Text("", font_size=8)

        # Quick formula recap
        recap_mean = MathTex(
            r"\mu_1 - \mu_2", font_size=28, color=BLUE_3B1B,
        )
        recap_sd = MathTex(
            r"\sqrt{\frac{\sigma_1^2}{n_1} + \frac{\sigma_2^2}{n_2}}",
            font_size=28, color=BLUE_3B1B,
        )
        recap_z = MathTex(
            r"z = \frac{(\bar{x}_1 - \bar{x}_2) - (\mu_1 - \mu_2)}"
            r"{\sigma_{\bar{x}_1 - \bar{x}_2}}",
            font_size=28, color=YELLOW_3B1B,
        )
        recap_formulas = VGroup(recap_mean, recap_sd, recap_z).arrange(
            RIGHT, buff=0.5,
        )

        insight_content = VGroup(
            insight_title,
            spacer,
            insight_line1, insight_line2,
            spacer2,
            insight_line3, insight_line4,
            Text("", font_size=10),
            recap_formulas,
        ).arrange(DOWN, buff=0.1)
        insight_content.move_to(ORIGIN)

        insight_rect = SurroundingRectangle(
            insight_content, color=YELLOW_3B1B, buff=0.35,
            corner_radius=0.15, stroke_width=3,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.2,
            ),
            run_time=3.0,
        )
        self.play(Create(insight_rect), run_time=0.5)
        self.wait(2.5)

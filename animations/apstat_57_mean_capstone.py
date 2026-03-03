"""
Topic 5.7 Capstone: Sample Means — Complete Overview (AP Stats Unit 5, Topic 5.7)

Synthesis animation covering all 5.7 concepts: parameters of the sampling
distribution of x-bar, shape conditions (Normal pop vs CLT n >= 30),
interpretation rules, probability via z-scores, and a side-by-side comparison
of sample proportions vs sample means. Ends with the insight that these
formulas appear on the AP formula sheet.

Run with: manim -qm --format=mp4 apstat_57_mean_capstone.py MeanCapstone
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanCapstone(Scene):
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
        title = Text("Topic 5.7: Complete Summary", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.25)
        subtitle = Text(
            "Sampling Distributions for Sample Means",
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
            r"\mu_{\bar{x}} = \mu",
            font_size=34, color=WHITE,
        )
        formula_sd = MathTex(
            r"\sigma_{\bar{x}} = \frac{\sigma}{\sqrt{n}}",
            font_size=34, color=WHITE,
        )
        formula_group = VGroup(formula_mean, formula_sd).arrange(DOWN, buff=0.25)
        formula_group.next_to(param_header, DOWN, buff=0.3)

        param_card = SurroundingRectangle(
            formula_group, color=BLUE_3B1B, buff=0.3,
            corner_radius=0.15, stroke_width=2.5,
        )

        self.play(Write(formula_mean), run_time=0.7)
        self.play(Write(formula_sd), run_time=0.7)
        self.play(Create(param_card), run_time=0.4)
        self.wait(0.4)

        # 10% condition below the card
        cond_label = Text("Condition:", font_size=22, color=YELLOW_3B1B, weight=BOLD)
        cond_math = MathTex(r"n < 0.10N", font_size=26, color=WHITE)
        cond_note = Text("(for independence)", font_size=18, color=GRAY)
        cond_row = VGroup(cond_label, cond_math, cond_note).arrange(RIGHT, buff=0.25)
        cond_row.next_to(param_card, DOWN, buff=0.3)

        self.play(Write(cond_label), Write(cond_math), Write(cond_note), run_time=0.7)
        self.wait(0.6)

        # Clear parameters section
        params_all = VGroup(param_header, formula_mean, formula_sd, param_card,
                            cond_label, cond_math, cond_note)
        self.play(FadeOut(params_all), run_time=0.4)

        # ==================== 3. SHAPE SECTION ====================
        shape_header = Text("Shape: When Is It Normal?", font_size=30,
                            color=GREEN_3B1B, weight=BOLD)
        shape_header.next_to(title, DOWN, buff=0.4)
        self.play(Write(shape_header), run_time=0.5)

        # Two columns
        col_left = make_box(
            [
                ("Normal Population", 20, GREEN_3B1B, BOLD),
                ("Any sample size n", 22, WHITE, BOLD),
            ],
            GREEN_3B1B, LEFT * 3.2 + DOWN * 0.4, width=4.5,
        )
        col_right = make_box(
            [
                ("Non-Normal Population", 20, YELLOW_3B1B, BOLD),
                ("Need n >= 30 (CLT)", 22, WHITE, BOLD),
            ],
            YELLOW_3B1B, RIGHT * 3.2 + DOWN * 0.4, width=4.5,
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
        left_arrow_text = Text("Any n works", font_size=18, color=GREEN_3B1B)
        left_arrow_text.next_to(col_left, DOWN, buff=0.15)
        right_arrow_text = Text("Large n required", font_size=18, color=YELLOW_3B1B)
        right_arrow_text.next_to(col_right, DOWN, buff=0.15)

        self.play(Write(left_arrow_text), Write(right_arrow_text), run_time=0.5)
        self.wait(0.6)

        # Clear shape section
        shape_all = VGroup(shape_header, col_left, col_right, divider,
                           left_arrow_text, right_arrow_text)
        self.play(FadeOut(shape_all), run_time=0.4)

        # ==================== 4. INTERPRETATION SECTION ====================
        interp_header = Text("Interpretation Rules", font_size=30,
                             color=TEAL_3B1B, weight=BOLD)
        interp_header.next_to(title, DOWN, buff=0.4)
        self.play(Write(interp_header), run_time=0.5)

        rule1_num = Text("1", font_size=22, color=TEAL_3B1B, weight=BOLD)
        rule1_txt = Text("\"All possible samples of size n\"", font_size=22, color=WHITE)
        rule1 = VGroup(rule1_num, rule1_txt).arrange(RIGHT, buff=0.2)

        rule2_num = Text("2", font_size=22, color=TEAL_3B1B, weight=BOLD)
        rule2_txt = Text("Include context and units", font_size=22, color=WHITE)
        rule2 = VGroup(rule2_num, rule2_txt).arrange(RIGHT, buff=0.2)

        rule3_num = Text("3", font_size=22, color=TEAL_3B1B, weight=BOLD)
        rule3_txt_a = Text("Use \"typically\" for ", font_size=22, color=WHITE)
        rule3_sigma = MathTex(r"\sigma_{\bar{x}}", font_size=26, color=YELLOW_3B1B)
        rule3 = VGroup(rule3_num, rule3_txt_a, rule3_sigma).arrange(RIGHT, buff=0.15)

        rules_group = VGroup(rule1, rule2, rule3).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        rules_group.next_to(interp_header, DOWN, buff=0.35)

        for rule in [rule1, rule2, rule3]:
            self.play(Write(rule), run_time=0.6)
            self.wait(0.2)

        # Highlight box around all three rules
        rules_rect = SurroundingRectangle(
            rules_group, color=TEAL_3B1B, buff=0.25,
            corner_radius=0.12, stroke_width=2.5,
        )
        self.play(Create(rules_rect), run_time=0.4)
        self.wait(0.6)

        # Clear interpretation
        interp_all = VGroup(interp_header, rules_group, rules_rect)
        self.play(FadeOut(interp_all), run_time=0.4)

        # ==================== 5. PROBABILITY SECTION ====================
        prob_header = Text("Calculating Probability", font_size=30,
                           color=PINK_3B1B, weight=BOLD)
        prob_header.next_to(title, DOWN, buff=0.4)
        self.play(Write(prob_header), run_time=0.5)

        z_formula = MathTex(
            r"z = \frac{\bar{x} - \mu}{\sigma / \sqrt{n}}",
            font_size=38, color=WHITE,
        )
        z_formula.next_to(prob_header, DOWN, buff=0.4)

        z_rect = SurroundingRectangle(
            z_formula, color=PINK_3B1B, buff=0.25,
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
        table_text = Text("Use normal table / normalcdf", font_size=24,
                          color=GREEN_3B1B, weight=BOLD)
        table_text.next_to(arrow_down, DOWN, buff=0.15)

        self.play(Create(arrow_down), run_time=0.3)
        self.play(Write(table_text), run_time=0.5)
        self.wait(0.6)

        # Clear probability
        prob_all = VGroup(prob_header, z_formula, z_rect, arrow_down, table_text)
        self.play(FadeOut(prob_all), run_time=0.4)

        # ==================== 6. COMPARISON TABLE: Proportions vs Means ====================
        comp_header = Text("Proportions vs. Means", font_size=30,
                           color=YELLOW_3B1B, weight=BOLD)
        comp_header.next_to(title, DOWN, buff=0.35)
        self.play(Write(comp_header), run_time=0.5)

        # Column headers
        col_label_header = Text("", font_size=18)
        col_phat_header = Text("Sample Proportion", font_size=19,
                               color=PINK_3B1B, weight=BOLD)
        col_xbar_header = Text("Sample Mean", font_size=19,
                               color=BLUE_3B1B, weight=BOLD)
        phat_sym = MathTex(r"\hat{p}", font_size=26, color=PINK_3B1B)
        xbar_sym = MathTex(r"\bar{x}", font_size=26, color=BLUE_3B1B)

        phat_col_title = VGroup(col_phat_header, phat_sym).arrange(DOWN, buff=0.05)
        xbar_col_title = VGroup(col_xbar_header, xbar_sym).arrange(DOWN, buff=0.05)

        # Column x-positions
        col_x = [-4.8, -0.8, 3.8]
        header_y = 0.5

        phat_col_title.move_to(RIGHT * col_x[1] + UP * header_y)
        xbar_col_title.move_to(RIGHT * col_x[2] + UP * header_y)

        self.play(Write(phat_col_title), Write(xbar_col_title), run_time=0.6)

        # Separator line below headers
        sep_line = Line(
            LEFT * 6.2 + UP * (header_y - 0.35),
            RIGHT * 6.2 + UP * (header_y - 0.35),
            color=GRAY, stroke_width=1,
        )
        self.play(Create(sep_line), run_time=0.2)

        # Table data: (row_label, phat_content, xbar_content)
        # Using separate Text and MathTex objects for each cell
        row_y_start = header_y - 0.8
        row_spacing = 0.65

        # Row 1: Mean
        r1_label = Text("Mean", font_size=18, color=YELLOW_3B1B, weight=BOLD)
        r1_phat = MathTex(r"\mu_{\hat{p}} = p", font_size=24, color=WHITE)
        r1_xbar = MathTex(r"\mu_{\bar{x}} = \mu", font_size=24, color=WHITE)

        # Row 2: Std Dev
        r2_label = Text("Std Dev", font_size=18, color=YELLOW_3B1B, weight=BOLD)
        r2_phat = MathTex(
            r"\sigma_{\hat{p}} = \sqrt{\frac{p(1-p)}{n}}",
            font_size=22, color=WHITE,
        )
        r2_xbar = MathTex(
            r"\sigma_{\bar{x}} = \frac{\sigma}{\sqrt{n}}",
            font_size=22, color=WHITE,
        )

        # Row 3: Normal Condition
        r3_label = Text("Normal?", font_size=18, color=YELLOW_3B1B, weight=BOLD)
        r3_phat_line1 = Text("Large Counts:", font_size=16, color=TEAL_3B1B, weight=BOLD)
        r3_phat_line2 = MathTex(r"np \geq 10", font_size=20, color=WHITE)
        r3_phat_line3 = MathTex(r"n(1-p) \geq 10", font_size=20, color=WHITE)
        r3_phat = VGroup(r3_phat_line1, r3_phat_line2, r3_phat_line3).arrange(DOWN, buff=0.04)

        r3_xbar_line1 = Text("Pop normal", font_size=16, color=GREEN_3B1B, weight=BOLD)
        r3_xbar_line2 = Text("OR", font_size=14, color=GRAY)
        r3_xbar_line3 = MathTex(r"n \geq 30", font_size=20, color=WHITE)
        r3_xbar = VGroup(r3_xbar_line1, r3_xbar_line2, r3_xbar_line3).arrange(DOWN, buff=0.04)

        # Position all rows
        rows = [
            (r1_label, r1_phat, r1_xbar),
            (r2_label, r2_phat, r2_xbar),
            (r3_label, r3_phat, r3_xbar),
        ]

        all_table_items = []
        for r_idx, (label, phat_cell, xbar_cell) in enumerate(rows):
            y = row_y_start - r_idx * row_spacing
            # Adjust spacing for taller row 3
            if r_idx == 2:
                y = row_y_start - r_idx * row_spacing - 0.15

            label.move_to(RIGHT * col_x[0] + UP * y)
            phat_cell.move_to(RIGHT * col_x[1] + UP * y)
            xbar_cell.move_to(RIGHT * col_x[2] + UP * y)

            self.play(
                Write(label), Write(phat_cell), Write(xbar_cell),
                run_time=0.6,
            )
            all_table_items.extend([label, phat_cell, xbar_cell])
            self.wait(0.2)

        # Vertical separator between columns
        v_sep = Line(
            RIGHT * 1.5 + UP * (header_y - 0.35),
            RIGHT * 1.5 + DOWN * 2.3,
            color=GRAY, stroke_width=1,
        )
        self.play(Create(v_sep), run_time=0.2)
        self.wait(0.8)

        # Clear comparison table
        table_all = VGroup(
            comp_header, phat_col_title, xbar_col_title,
            sep_line, v_sep, *all_table_items,
        )
        self.play(FadeOut(table_all), run_time=0.5)

        # ==================== 7. FINAL INSIGHT ====================
        self.play(FadeOut(title), run_time=0.3)

        insight_title = Text(
            "Topic 5.7 Key Takeaway", font_size=32,
            color=YELLOW_3B1B, weight=BOLD,
        )

        insight_line1 = Text(
            "These formulas are on the", font_size=28,
            color=WHITE,
        )
        insight_line2 = Text(
            "AP formula sheet!", font_size=32,
            color=GREEN_3B1B, weight=BOLD,
        )

        spacer = Text("", font_size=8)

        insight_line3 = Text(
            "Focus on WHEN and HOW to use them", font_size=24,
            color=TEAL_3B1B,
        )
        insight_line4 = Text(
            "not on memorizing them.", font_size=24,
            color=TEAL_3B1B,
        )

        spacer2 = Text("", font_size=8)

        # Quick formula recap
        recap_mean = MathTex(
            r"\mu_{\bar{x}} = \mu", font_size=28, color=BLUE_3B1B,
        )
        recap_sd = MathTex(
            r"\sigma_{\bar{x}} = \frac{\sigma}{\sqrt{n}}",
            font_size=28, color=BLUE_3B1B,
        )
        recap_z = MathTex(
            r"z = \frac{\bar{x} - \mu}{\sigma / \sqrt{n}}",
            font_size=28, color=PINK_3B1B,
        )
        recap_formulas = VGroup(recap_mean, recap_sd, recap_z).arrange(
            RIGHT, buff=0.6,
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

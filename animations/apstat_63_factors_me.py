"""
Factors Affecting the Margin of Error (AP Stats Unit 6, Topic 6.3)

Visualizes the two factors that affect the margin of error in a CI for a
population proportion: sample size and confidence level. Shows the ME formula,
then animates how increasing n shrinks the interval and how increasing
confidence level widens it. Includes the key insight: quadruple n to halve ME.

Run with: manim -qm --format=mp4 apstat_63_factors_me.py FactorsME
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class FactorsME(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ================================================================
        # TITLE
        # ================================================================
        title = Text("Factors Affecting Margin of Error", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ================================================================
        # THE FORMULA
        # ================================================================
        formula_label = Text("Margin of Error:", font_size=26, color=YELLOW_3B1B, weight=BOLD)
        formula_label.next_to(title, DOWN, buff=0.35)
        formula_label.to_edge(LEFT, buff=1.5)

        formula = MathTex(
            r"\text{ME}", r"=", r"z^*", r"\cdot",
            r"\sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
            font_size=42,
        )
        formula[0].set_color(YELLOW_3B1B)
        formula[2].set_color(PINK_3B1B)
        formula[4].set_color(BLUE_3B1B)
        formula.next_to(formula_label, RIGHT, buff=0.3)

        self.play(Write(formula_label), run_time=0.4)
        self.play(Write(formula), run_time=1.0)
        self.wait(0.5)

        # Highlight the two factors
        zstar_brace = Brace(formula[2], DOWN, buff=0.1, color=PINK_3B1B)
        zstar_text = Text("Confidence level", font_size=18, color=PINK_3B1B)
        zstar_text.next_to(zstar_brace, DOWN, buff=0.05)

        n_part = formula[4]
        n_brace = Brace(n_part, DOWN, buff=0.1, color=BLUE_3B1B)
        n_text = Text("Sample size (n)", font_size=18, color=BLUE_3B1B)
        n_text.next_to(n_brace, DOWN, buff=0.05)

        self.play(
            Create(zstar_brace), Write(zstar_text),
            Create(n_brace), Write(n_text),
            run_time=0.8,
        )
        self.wait(0.8)

        # ================================================================
        # TRANSITION: Clear formula, show Factor 1
        # ================================================================
        formula_group = VGroup(
            formula_label, formula, zstar_brace, zstar_text, n_brace, n_text,
        )
        self.play(FadeOut(formula_group), run_time=0.4)

        # ================================================================
        # FACTOR 1: SAMPLE SIZE
        # ================================================================
        f1_header = Text(
            "Factor 1: Sample Size (n)", font_size=28, color=BLUE_3B1B, weight=BOLD,
        )
        f1_header.next_to(title, DOWN, buff=0.35)
        self.play(Write(f1_header), run_time=0.4)

        f1_rule = Text(
            "Larger n  -->  Smaller ME  -->  Narrower CI",
            font_size=24, color=GREEN_3B1B,
        )
        f1_rule.next_to(f1_header, DOWN, buff=0.2)
        self.play(Write(f1_rule), run_time=0.5)
        self.wait(0.3)

        # Animate 3 intervals with different n values
        phat = 0.58
        z95 = 1.96
        samples = [50, 200, 800]
        colors = [PINK_3B1B, TEAL_3B1B, GREEN_3B1B]

        nl = NumberLine(
            x_range=[0.35, 0.80, 0.05],
            length=10,
            include_numbers=True,
            numbers_to_include=[0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80],
            font_size=14,
            decimal_number_config={"num_decimal_places": 2},
            include_tip=False,
        )
        nl.move_to(DOWN * 0.2)
        self.play(Create(nl), run_time=0.5)

        # p-hat marker
        phat_pos = nl.n2p(phat)
        phat_line = DashedLine(
            phat_pos + DOWN * 2.0, phat_pos + UP * 0.3,
            color=WHITE, stroke_width=1.5, dash_length=0.06,
        )
        phat_label = MathTex(r"\hat{p} = 0.58", font_size=20)
        phat_label.next_to(phat_line, UP, buff=0.05)
        self.play(Create(phat_line), Write(phat_label), run_time=0.4)

        ci_groups = VGroup()
        for i, (n_val, color) in enumerate(zip(samples, colors)):
            se = np.sqrt(phat * (1 - phat) / n_val)
            me = z95 * se
            lower = phat - me
            upper = phat + me
            y_offset = DOWN * (0.65 + i * 0.55)

            left_pt = nl.n2p(lower) + y_offset
            right_pt = nl.n2p(upper) + y_offset
            center_pt = nl.n2p(phat) + y_offset

            bar = Line(left_pt, right_pt, color=color, stroke_width=4)
            dot = Dot(center_pt, radius=0.06, color=color)
            label = Text(
                f"n = {n_val}  (ME = {me:.3f})",
                font_size=18, color=color,
            )
            label.next_to(bar, RIGHT, buff=0.2)

            grp = VGroup(bar, dot, label)
            ci_groups.add(grp)

            self.play(Create(bar), FadeIn(dot), Write(label), run_time=0.6)
            self.wait(0.3)

        self.wait(0.3)

        # Key insight
        insight1 = Text(
            "Quadruple n to HALVE the margin of error",
            font_size=22, color=YELLOW_3B1B, weight=BOLD,
        )
        insight1.to_edge(DOWN, buff=0.2)
        insight1_box = SurroundingRectangle(
            insight1, color=YELLOW_3B1B, buff=0.12, corner_radius=0.08,
        )
        self.play(Write(insight1), Create(insight1_box), run_time=0.6)
        self.wait(0.8)

        # ================================================================
        # TRANSITION: Clear Factor 1, show Factor 2
        # ================================================================
        self.play(
            FadeOut(f1_header), FadeOut(f1_rule),
            FadeOut(nl), FadeOut(phat_line), FadeOut(phat_label),
            FadeOut(ci_groups),
            FadeOut(insight1), FadeOut(insight1_box),
            run_time=0.5,
        )

        # ================================================================
        # FACTOR 2: CONFIDENCE LEVEL
        # ================================================================
        f2_header = Text(
            "Factor 2: Confidence Level", font_size=28, color=PINK_3B1B, weight=BOLD,
        )
        f2_header.next_to(title, DOWN, buff=0.35)
        self.play(Write(f2_header), run_time=0.4)

        f2_rule = Text(
            "Higher confidence  -->  Larger z*  -->  Wider CI",
            font_size=24, color=YELLOW_3B1B,
        )
        f2_rule.next_to(f2_header, DOWN, buff=0.2)
        self.play(Write(f2_rule), run_time=0.5)
        self.wait(0.3)

        # z* values table
        z_table = VGroup(
            VGroup(
                Text("Confidence", font_size=20, color=GREY_B, weight=BOLD),
                Text("z*", font_size=20, color=GREY_B, weight=BOLD),
            ).arrange(RIGHT, buff=1.2),
            VGroup(
                Text("90%", font_size=20, color=GREEN_3B1B),
                Text("1.645", font_size=20, color=GREEN_3B1B),
            ).arrange(RIGHT, buff=1.0),
            VGroup(
                Text("95%", font_size=20, color=TEAL_3B1B),
                Text("1.960", font_size=20, color=TEAL_3B1B),
            ).arrange(RIGHT, buff=1.0),
            VGroup(
                Text("99%", font_size=20, color=PINK_3B1B),
                Text("2.576", font_size=20, color=PINK_3B1B),
            ).arrange(RIGHT, buff=1.0),
        ).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        z_table.next_to(f2_rule, DOWN, buff=0.25)
        z_table.to_edge(LEFT, buff=1.5)

        self.play(Write(z_table), run_time=1.0)
        self.wait(0.3)

        # Animate 3 intervals with different confidence levels
        n_val = 200
        z_values = [(1.645, "90%", GREEN_3B1B), (1.960, "95%", TEAL_3B1B), (2.576, "99%", PINK_3B1B)]

        nl2 = NumberLine(
            x_range=[0.40, 0.76, 0.04],
            length=8,
            include_numbers=True,
            numbers_to_include=[0.40, 0.44, 0.48, 0.52, 0.56, 0.60, 0.64, 0.68, 0.72, 0.76],
            font_size=14,
            decimal_number_config={"num_decimal_places": 2},
            include_tip=False,
        )
        nl2.move_to(RIGHT * 1.0 + DOWN * 0.8)
        self.play(Create(nl2), run_time=0.5)

        ci2_groups = VGroup()
        for i, (z_val, conf_label, color) in enumerate(z_values):
            se = np.sqrt(phat * (1 - phat) / n_val)
            me = z_val * se
            lower = phat - me
            upper = phat + me
            y_offset = DOWN * (0.5 + i * 0.55)

            left_pt = nl2.n2p(lower) + y_offset
            right_pt = nl2.n2p(upper) + y_offset
            center_pt = nl2.n2p(phat) + y_offset

            bar = Line(left_pt, right_pt, color=color, stroke_width=4)
            dot = Dot(center_pt, radius=0.06, color=color)
            label = Text(f"{conf_label}", font_size=18, color=color, weight=BOLD)
            label.next_to(bar, RIGHT, buff=0.15)

            grp = VGroup(bar, dot, label)
            ci2_groups.add(grp)

            self.play(Create(bar), FadeIn(dot), Write(label), run_time=0.5)
            self.wait(0.2)

        self.wait(0.5)

        # Tradeoff note
        tradeoff = Text(
            "Tradeoff: More confidence = less precision",
            font_size=22, color=YELLOW_3B1B, weight=BOLD,
        )
        tradeoff.to_edge(DOWN, buff=0.15)
        self.play(Write(tradeoff), run_time=0.5)
        self.wait(0.8)

        # ================================================================
        # FINAL KEY INSIGHT BOX
        # ================================================================
        self.play(
            FadeOut(f2_header), FadeOut(f2_rule), FadeOut(z_table),
            FadeOut(nl2), FadeOut(ci2_groups), FadeOut(tradeoff),
            FadeOut(title),
            run_time=0.5,
        )

        final_content = VGroup(
            Text("Factors Affecting ME", font_size=34, color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=8),
            MathTex(
                r"\text{ME} = z^* \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
                font_size=38,
            ),
            Text("", font_size=6),
            Text("Larger n --> Smaller ME (narrower CI)", font_size=22, color=BLUE_3B1B),
            Text("Quadruple n to halve ME", font_size=20, color=BLUE_3B1B),
            Text("", font_size=6),
            Text("Higher confidence --> Larger z* --> Wider CI", font_size=22, color=PINK_3B1B),
            Text("More confidence = less precision", font_size=20, color=PINK_3B1B),
        ).arrange(DOWN, buff=0.1)
        final_content.move_to(ORIGIN)

        final_box = SurroundingRectangle(
            final_content, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in final_content],
                lag_ratio=0.15,
            ),
            run_time=2.5,
        )
        self.play(Create(final_box), run_time=0.5)
        self.wait(2.5)

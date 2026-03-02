"""
Margin of Error (AP Stats Unit 6, Topic 6.2)

Shows the margin of error formula ME = z* x SE(p-hat), decomposes it into
"how confident" x "how variable", then works through a full example with
p-hat = 0.42, n = 300, 95% confidence. Visualizes the interval on a number
line with p-hat at center and ME as the radius on each side. Concludes with
what makes ME smaller (larger n, lower confidence) and a key insight box.

Run with: manim -qm --format=mp4 apstat_62_margin_of_error.py MarginOfError
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MarginOfError(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Margin of Error", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== THE FORMULA ==========
        me_formula = MathTex(
            r"ME", r"=", r"z^*", r"\times", r"SE(\hat{p})",
            font_size=44,
        )
        me_formula[0].set_color(PINK_3B1B)
        me_formula[2].set_color(YELLOW_3B1B)
        me_formula[4].set_color(TEAL_3B1B)
        me_formula.next_to(title, DOWN, buff=0.4)
        self.play(Write(me_formula), run_time=1.0)
        self.wait(0.3)

        # Expanded form
        me_expanded = MathTex(
            r"= z^* \times \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
            font_size=36,
        )
        me_expanded.next_to(me_formula, DOWN, buff=0.2)
        self.play(Write(me_expanded), run_time=0.6)
        self.wait(0.5)

        # ========== DECOMPOSITION ==========
        decomp = Text(
            "ME  =  (how confident)  x  (how variable)",
            font_size=26, color=GREY_B,
        )
        decomp.next_to(me_expanded, DOWN, buff=0.3)
        self.play(Write(decomp), run_time=0.5)
        self.wait(0.3)

        # Color-coded labels under decomposition
        brace_z = Brace(me_formula[2], DOWN, buff=0.5)
        brace_z_label = Text("confidence", font_size=18, color=YELLOW_3B1B)
        brace_z_label.next_to(brace_z, DOWN, buff=0.05)

        brace_se = Brace(me_formula[4], DOWN, buff=0.5)
        brace_se_label = Text("variability", font_size=18, color=TEAL_3B1B)
        brace_se_label.next_to(brace_se, DOWN, buff=0.05)

        self.play(
            GrowFromCenter(brace_z), Write(brace_z_label),
            GrowFromCenter(brace_se), Write(brace_se_label),
            run_time=0.6,
        )
        self.wait(0.8)

        # ========== TRANSITION TO WORKED EXAMPLE ==========
        formula_section = VGroup(
            me_formula, me_expanded, decomp,
            brace_z, brace_z_label, brace_se, brace_se_label,
        )
        self.play(FadeOut(formula_section), run_time=0.4)

        # ========== WORKED EXAMPLE ==========
        ex_header = Text(
            "Worked Example", font_size=34, color=YELLOW_3B1B, weight=BOLD,
        )
        ex_header.next_to(title, DOWN, buff=0.3)
        self.play(Write(ex_header), run_time=0.5)

        given = MathTex(
            r"\hat{p} = 0.42, \quad n = 300, \quad 95\% \text{ confidence}",
            font_size=30,
        )
        given.next_to(ex_header, DOWN, buff=0.25)
        self.play(Write(given), run_time=0.5)
        self.wait(0.3)

        # Step 1: SE
        step1_label = Text("Step 1: Find SE", font_size=22, color=TEAL_3B1B)
        step1_calc = MathTex(
            r"SE = \sqrt{\frac{0.42 \times 0.58}{300}} = \sqrt{0.000812} = 0.0285",
            font_size=26,
        )
        step1 = VGroup(step1_label, step1_calc).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        step1.next_to(given, DOWN, buff=0.3).align_to(LEFT * 4.5, LEFT)

        self.play(Write(step1_label), run_time=0.3)
        self.play(Write(step1_calc), run_time=0.7)
        self.wait(0.3)

        # Step 2: z*
        step2_label = Text("Step 2: Find z*", font_size=22, color=YELLOW_3B1B)
        step2_val = MathTex(
            r"95\% \text{ confidence} \Rightarrow z^* = 1.960",
            font_size=26,
        )
        step2 = VGroup(step2_label, step2_val).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        step2.next_to(step1, DOWN, buff=0.25).align_to(step1, LEFT)

        self.play(Write(step2_label), run_time=0.3)
        self.play(Write(step2_val), run_time=0.5)
        self.wait(0.3)

        # Step 3: ME
        step3_label = Text("Step 3: Compute ME", font_size=22, color=PINK_3B1B)
        step3_calc = MathTex(
            r"ME = 1.960 \times 0.0285 = 0.0559",
            font_size=28,
        )
        step3 = VGroup(step3_label, step3_calc).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        step3.next_to(step2, DOWN, buff=0.25).align_to(step1, LEFT)

        self.play(Write(step3_label), run_time=0.3)
        self.play(Write(step3_calc), run_time=0.6)

        me_box = SurroundingRectangle(step3_calc, color=PINK_3B1B, buff=0.1, corner_radius=0.08)
        self.play(Create(me_box), run_time=0.3)
        self.wait(0.6)

        # ========== VISUAL: NUMBER LINE ==========
        calc_section = VGroup(
            ex_header, given, step1, step2, step3, me_box,
        )
        self.play(
            calc_section.animate.scale(0.55).to_corner(UL, buff=0.25).shift(DOWN * 0.4),
            run_time=0.5,
        )

        # Number line
        phat = 0.42
        me = 0.0559
        lo = phat - me   # 0.364
        hi = phat + me   # 0.476

        nl_left = 0.30
        nl_right = 0.54
        nl = NumberLine(
            x_range=[nl_left, nl_right, 0.02],
            length=10,
            include_numbers=False,
            include_tip=False,
        )
        nl.shift(DOWN * 0.5)

        # Key tick labels
        nl_labels = VGroup()
        for val, label_text, color in [
            (lo, f"{lo:.3f}", TEAL_3B1B),
            (phat, f"{phat:.2f}", YELLOW_3B1B),
            (hi, f"{hi:.3f}", TEAL_3B1B),
        ]:
            lab = Text(label_text, font_size=18, color=color)
            lab.next_to(nl.n2p(val), DOWN, buff=0.15)
            tick = Line(
                nl.n2p(val) + UP * 0.1,
                nl.n2p(val) + DOWN * 0.1,
                color=color, stroke_width=2.5,
            )
            nl_labels.add(VGroup(lab, tick))

        self.play(Create(nl), FadeIn(nl_labels), run_time=0.6)
        self.wait(0.3)

        # p-hat dot at center
        phat_dot = Dot(nl.n2p(phat), color=YELLOW_3B1B, radius=0.1)
        phat_label = MathTex(r"\hat{p}", font_size=28, color=YELLOW_3B1B)
        phat_label.next_to(phat_dot, UP, buff=0.2)
        self.play(FadeIn(phat_dot), Write(phat_label), run_time=0.4)

        # ME arrows on each side
        left_arrow = DoubleArrow(
            nl.n2p(lo), nl.n2p(phat),
            color=PINK_3B1B, stroke_width=3, buff=0,
            tip_length=0.15,
        )
        left_arrow.shift(UP * 0.5)
        left_me_label = Text("ME", font_size=18, color=PINK_3B1B, weight=BOLD)
        left_me_label.next_to(left_arrow, UP, buff=0.05)

        right_arrow = DoubleArrow(
            nl.n2p(phat), nl.n2p(hi),
            color=PINK_3B1B, stroke_width=3, buff=0,
            tip_length=0.15,
        )
        right_arrow.shift(UP * 0.5)
        right_me_label = Text("ME", font_size=18, color=PINK_3B1B, weight=BOLD)
        right_me_label.next_to(right_arrow, UP, buff=0.05)

        self.play(
            Create(left_arrow), Write(left_me_label),
            Create(right_arrow), Write(right_me_label),
            run_time=0.6,
        )
        self.wait(0.3)

        # Bracket showing the full interval
        interval_bracket = Brace(
            VGroup(
                Dot(nl.n2p(lo), radius=0.01),
                Dot(nl.n2p(hi), radius=0.01),
            ),
            DOWN, buff=0.6,
        )
        interval_label = MathTex(
            r"(0.364, \; 0.476)",
            font_size=28, color=ManimColor(GREEN_3B1B),
        )
        interval_label.next_to(interval_bracket, DOWN, buff=0.1)

        ci_text = Text(
            "95% Confidence Interval for p",
            font_size=22, color=ManimColor(GREEN_3B1B), weight=BOLD,
        )
        ci_text.next_to(interval_label, DOWN, buff=0.1)

        self.play(
            GrowFromCenter(interval_bracket),
            Write(interval_label), Write(ci_text),
            run_time=0.7,
        )
        self.wait(1.0)

        # ========== WHAT MAKES ME SMALLER? ==========
        nl_section = VGroup(
            nl, nl_labels, phat_dot, phat_label,
            left_arrow, left_me_label, right_arrow, right_me_label,
            interval_bracket, interval_label, ci_text,
        )
        self.play(
            FadeOut(nl_section),
            FadeOut(calc_section),
            run_time=0.5,
        )

        smaller_header = Text(
            "What Makes ME Smaller?",
            font_size=34, color=YELLOW_3B1B, weight=BOLD,
        )
        smaller_header.next_to(title, DOWN, buff=0.35)
        self.play(Write(smaller_header), run_time=0.5)
        self.wait(0.3)

        # Recall formula
        me_recall = MathTex(
            r"ME = z^* \times \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
            font_size=34, color=GREY_B,
        )
        me_recall.next_to(smaller_header, DOWN, buff=0.25)
        self.play(Write(me_recall), run_time=0.5)
        self.wait(0.3)

        # Factor 1: Larger n
        factor1_icon = MathTex(r"n \uparrow", font_size=36, color=BLUE_3B1B)
        factor1_arrow = MathTex(r"\Rightarrow", font_size=36)
        factor1_effect1 = Text("smaller SE", font_size=24, color=TEAL_3B1B)
        factor1_arrow2 = MathTex(r"\Rightarrow", font_size=36)
        factor1_effect2 = Text("smaller ME", font_size=24, color=PINK_3B1B, weight=BOLD)

        factor1 = VGroup(
            factor1_icon, factor1_arrow, factor1_effect1,
            factor1_arrow2, factor1_effect2,
        ).arrange(RIGHT, buff=0.2)
        factor1.next_to(me_recall, DOWN, buff=0.4)

        self.play(
            LaggedStart(
                Write(factor1_icon),
                Write(factor1_arrow),
                Write(factor1_effect1),
                Write(factor1_arrow2),
                Write(factor1_effect2),
                lag_ratio=0.15,
            ),
            run_time=1.0,
        )
        self.wait(0.5)

        # Factor 2: Lower confidence
        factor2_icon = MathTex(r"C \downarrow", font_size=36, color=YELLOW_3B1B)
        factor2_arrow = MathTex(r"\Rightarrow", font_size=36)
        factor2_effect1 = Text("smaller z*", font_size=24, color=YELLOW_3B1B)
        factor2_arrow2 = MathTex(r"\Rightarrow", font_size=36)
        factor2_effect2 = Text("smaller ME", font_size=24, color=PINK_3B1B, weight=BOLD)

        factor2 = VGroup(
            factor2_icon, factor2_arrow, factor2_effect1,
            factor2_arrow2, factor2_effect2,
        ).arrange(RIGHT, buff=0.2)
        factor2.next_to(factor1, DOWN, buff=0.3)

        self.play(
            LaggedStart(
                Write(factor2_icon),
                Write(factor2_arrow),
                Write(factor2_effect1),
                Write(factor2_arrow2),
                Write(factor2_effect2),
                lag_ratio=0.15,
            ),
            run_time=1.0,
        )
        self.wait(0.5)

        # Tradeoff note
        tradeoff = Text(
            "Tradeoff: more confidence = wider interval",
            font_size=22, color=GREY_B,
        )
        tradeoff.next_to(factor2, DOWN, buff=0.3)
        self.play(Write(tradeoff), run_time=0.5)
        self.wait(0.8)

        # ========== CLEAR FOR KEY INSIGHT ==========
        smaller_section = VGroup(
            smaller_header, me_recall, factor1, factor2, tradeoff,
        )
        self.play(
            FadeOut(smaller_section),
            FadeOut(title),
            run_time=0.5,
        )

        # ========== KEY INSIGHT BOX ==========
        insight_content = VGroup(
            Text(
                "Margin of Error",
                font_size=32, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=6),  # spacer
            MathTex(
                r"ME = z^* \times \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
                font_size=40, color=TEAL_3B1B,
            ),
            Text("", font_size=6),  # spacer
            Text(
                "The 'radius' of the confidence interval.",
                font_size=24,
            ),
            Text("", font_size=6),  # spacer
            MathTex(
                r"CI: \quad \hat{p} \pm ME",
                font_size=34, color=ManimColor(GREEN_3B1B),
            ),
            Text("", font_size=6),  # spacer
            Text(
                "Smaller ME: increase n or decrease confidence.",
                font_size=22, color=PINK_3B1B, weight=BOLD,
            ),
        ).arrange(DOWN, buff=0.1)
        insight_content.move_to(ORIGIN)

        box = SurroundingRectangle(
            insight_content, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.2,
            ),
            run_time=2.5,
        )
        self.play(Create(box))
        self.wait(2)

"""
Interpreting Probabilities: p-hat_1 - p-hat_2 (AP Stats Unit 5, Topic 5.6)

Teaches students how to correctly interpret a probability result from the
sampling distribution of the difference in sample proportions. Shows a
normal curve with shaded tail, walks through a correct interpretation with
highlighted key phrases, introduces the 5% unusual threshold on a number
line, contrasts a not-unusual result with an unusual one, and finishes
with a key insight box listing the 4 requirements for a good interpretation.

Run with:
    manim -qm --format=mp4 apstat_56_diff_prop_interpret_prob.py DiffPropInterpretProb
"""

from manim import *
import numpy as np


class DiffPropInterpretProb(Scene):
    def construct(self):
        # ---- Style constants ----
        self.camera.background_color = "#1C1C1C"

        BLUE_3B1B = "#3B82F6"
        YELLOW_3B1B = "#FACC15"
        TEAL_3B1B = "#2DD4BF"
        GREEN_3B1B = "#22C55E"
        PINK_3B1B = "#EC4899"
        GOLD = "#FFD700"

        # ---- Numerical parameters ----
        mu = 0.15
        sigma = 0.066
        observed = 0.22
        prob_value = 0.1788

        def normal_pdf(x):
            return (1.0 / (sigma * np.sqrt(2 * np.pi))) * \
                   np.exp(-0.5 * ((x - mu) / sigma) ** 2)

        # ================================================================
        #  SECTION 1: TITLE
        # ================================================================
        title_line1 = Text(
            "Interpreting Probabilities:", font_size=40, weight=BOLD,
        )
        title_math = MathTex(
            r"\hat{p}_1 - \hat{p}_2",
            font_size=46, color=TEAL_3B1B,
        )
        title_row = VGroup(title_line1, title_math).arrange(RIGHT, buff=0.15)
        title_row.to_edge(UP, buff=0.35)

        subtitle = Text(
            'What does a probability result MEAN?',
            font_size=26, color=YELLOW_3B1B,
        )
        subtitle.next_to(title_row, DOWN, buff=0.2)

        self.play(Write(title_row), run_time=0.8)
        self.play(FadeIn(subtitle, shift=UP * 0.2), run_time=0.5)
        self.wait(1.5)

        # ================================================================
        #  SECTION 2: NORMAL CURVE WITH SHADED TAIL
        # ================================================================
        self.play(FadeOut(subtitle), run_time=0.3)

        # Build axes
        x_min = mu - 4 * sigma
        x_max = mu + 4 * sigma

        axes = Axes(
            x_range=[x_min, x_max, sigma],
            y_range=[0, 7, 2],
            x_length=10,
            y_length=3.0,
            axis_config={"include_tip": False, "include_numbers": False},
        )
        axes.shift(DOWN * 0.6)

        # Tick labels
        x_labels = VGroup()
        x_ticks = VGroup()
        key_vals = [mu - 3 * sigma, mu - 2 * sigma, mu - sigma,
                    mu, mu + sigma, mu + 2 * sigma, mu + 3 * sigma]
        for val in key_vals:
            label = Text(f"{val:.3f}", font_size=13)
            label.next_to(axes.c2p(val, 0), DOWN, buff=0.15)
            x_labels.add(label)
            tick = Line(
                axes.c2p(val, -0.15), axes.c2p(val, 0.15),
                color=WHITE, stroke_width=2,
            )
            x_ticks.add(tick)

        # Draw the curve
        curve = axes.plot(
            normal_pdf,
            x_range=[x_min, x_max, 0.001],
            color=ManimColor(BLUE_3B1B),
            stroke_width=3,
        )

        # Curve label
        curve_label = Text(
            "Sampling Distribution of p\u0302\u2081 \u2212 p\u0302\u2082",
            font_size=22, color=ManimColor(BLUE_3B1B),
        )
        curve_label.next_to(axes, UP, buff=0.15).shift(LEFT * 1.5)

        self.play(Create(axes), run_time=0.5)
        self.play(
            Create(curve),
            FadeIn(x_labels), FadeIn(x_ticks),
            Write(curve_label),
            run_time=1.0,
        )
        self.wait(0.3)

        # Mark mu
        mu_label = MathTex(
            r"\mu = 0.15", font_size=24, color=ManimColor(BLUE_3B1B),
        )
        mu_label.next_to(axes.c2p(mu, 0), DOWN, buff=0.55)
        mu_arrow = Arrow(
            mu_label.get_top(),
            axes.c2p(mu, 0) + UP * 0.05,
            buff=0.05, color=ManimColor(BLUE_3B1B), stroke_width=2,
        )
        self.play(Write(mu_label), Create(mu_arrow), run_time=0.5)

        # Mark observed value
        obs_line = DashedLine(
            axes.c2p(observed, 0),
            axes.c2p(observed, normal_pdf(observed)),
            color=ManimColor(YELLOW_3B1B), stroke_width=3,
        )
        obs_dot = Dot(axes.c2p(observed, 0), color=ManimColor(YELLOW_3B1B), radius=0.07)
        obs_label = MathTex(r"0.22", font_size=24, color=ManimColor(YELLOW_3B1B))
        obs_label.next_to(obs_dot, DOWN, buff=0.2)

        self.play(
            Create(obs_line), FadeIn(obs_dot), Write(obs_label),
            run_time=0.6,
        )
        self.wait(0.2)

        # Shade the right tail
        shaded_area = axes.get_area(
            curve,
            x_range=[observed, x_max],
            color=ManimColor(PINK_3B1B),
            opacity=0.55,
        )
        self.play(FadeIn(shaded_area), run_time=0.8)

        # Probability label inside shaded area
        prob_label = Text(
            "P = 0.1788", font_size=22, color=WHITE, weight=BOLD,
        )
        prob_label.move_to(axes.c2p(observed + 1.8 * sigma, 1.5))
        self.play(Write(prob_label), run_time=0.5)
        self.wait(1.5)

        # Clear the curve section
        curve_group = VGroup(
            axes, x_labels, x_ticks, curve, curve_label,
            mu_label, mu_arrow, obs_line, obs_dot, obs_label,
            shaded_area, prob_label,
        )
        self.play(FadeOut(curve_group), FadeOut(title_row), run_time=0.5)

        # ================================================================
        #  SECTION 3: CORRECT INTERPRETATION WITH HIGHLIGHTS
        # ================================================================
        interp_header = Text(
            "Correct Interpretation", font_size=34, color=ManimColor(GREEN_3B1B),
            weight=BOLD,
        )
        interp_header.to_edge(UP, buff=0.4)
        self.play(Write(interp_header), run_time=0.5)
        self.wait(0.2)

        # Build the interpretation as separate text chunks for highlighting
        line1 = Text("Getting a difference (parents \u2212 non-parents)",
                      font_size=22)
        line2_pre = Text("in sample proportions of ", font_size=22)
        line2_val = Text("0.22 or greater", font_size=22,
                         color=ManimColor(TEAL_3B1B), weight=BOLD)
        line2 = VGroup(line2_pre, line2_val).arrange(RIGHT, buff=0.08)

        line3_pre = Text("happens in about ", font_size=22)
        line3_pct = Text("17.88%", font_size=22,
                         color=ManimColor(YELLOW_3B1B), weight=BOLD)
        line3_post = Text(" of", font_size=22)
        line3 = VGroup(line3_pre, line3_pct, line3_post).arrange(RIGHT, buff=0.08)

        line4 = Text("all possible samples of size 200 from parents",
                      font_size=22, color=ManimColor(GREEN_3B1B), weight=BOLD)
        line5 = Text("and size 250 from non-parents.",
                      font_size=22, color=ManimColor(GREEN_3B1B), weight=BOLD)

        interp_block = VGroup(line1, line2, line3, line4, line5).arrange(
            DOWN, buff=0.18, aligned_edge=LEFT,
        )
        interp_block.next_to(interp_header, DOWN, buff=0.4)

        interp_box = SurroundingRectangle(
            interp_block, color=ManimColor(GREEN_3B1B), buff=0.25,
            corner_radius=0.1, stroke_width=2.5,
        )

        # Animate line by line
        self.play(Write(line1), run_time=0.6)
        self.play(Write(line2), run_time=0.6)
        self.play(Write(line3), run_time=0.6)
        self.play(Write(line4), run_time=0.6)
        self.play(Write(line5), run_time=0.6)
        self.play(Create(interp_box), run_time=0.5)
        self.wait(0.5)

        # Highlight key phrases with surrounding rectangles
        highlight_cyan = SurroundingRectangle(
            line2_val, color=ManimColor(TEAL_3B1B), buff=0.06,
            corner_radius=0.05, stroke_width=3,
        )
        highlight_yellow = SurroundingRectangle(
            line3_pct, color=ManimColor(YELLOW_3B1B), buff=0.06,
            corner_radius=0.05, stroke_width=3,
        )
        highlight_green = SurroundingRectangle(
            VGroup(line4, line5), color=ManimColor(GREEN_3B1B), buff=0.06,
            corner_radius=0.05, stroke_width=3,
        )

        self.play(Create(highlight_cyan), run_time=0.4)
        self.wait(0.3)
        self.play(Create(highlight_yellow), run_time=0.4)
        self.wait(0.3)
        self.play(Create(highlight_green), run_time=0.4)
        self.wait(2.0)

        # Legend below
        legend = VGroup(
            VGroup(
                Square(side_length=0.15, fill_color=ManimColor(TEAL_3B1B),
                       fill_opacity=1, stroke_width=0),
                Text("= observed difference & direction", font_size=18),
            ).arrange(RIGHT, buff=0.1),
            VGroup(
                Square(side_length=0.15, fill_color=ManimColor(YELLOW_3B1B),
                       fill_opacity=1, stroke_width=0),
                Text("= probability / percentage", font_size=18),
            ).arrange(RIGHT, buff=0.1),
            VGroup(
                Square(side_length=0.15, fill_color=ManimColor(GREEN_3B1B),
                       fill_opacity=1, stroke_width=0),
                Text("= specific sample sizes & populations", font_size=18),
            ).arrange(RIGHT, buff=0.1),
        ).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        legend.next_to(interp_box, DOWN, buff=0.35)

        self.play(FadeIn(legend), run_time=0.6)
        self.wait(2.0)

        # Clear interpretation section
        self.play(
            FadeOut(interp_header), FadeOut(interp_block), FadeOut(interp_box),
            FadeOut(highlight_cyan), FadeOut(highlight_yellow),
            FadeOut(highlight_green), FadeOut(legend),
            run_time=0.5,
        )

        # ================================================================
        #  SECTION 4: "IS IT UNUSUAL?" — NOT UNUSUAL (17.88%)
        # ================================================================
        unusual_header = Text(
            "Is it unusual?", font_size=36, color=ManimColor(YELLOW_3B1B),
            weight=BOLD,
        )
        unusual_header.to_edge(UP, buff=0.4)
        self.play(Write(unusual_header), run_time=0.5)
        self.wait(0.3)

        # Number line from 0% to 25%
        nline1 = NumberLine(
            x_range=[0, 25, 5],
            length=10,
            include_numbers=True,
            numbers_to_include=[0, 5, 10, 15, 20, 25],
            font_size=22,
            label_direction=DOWN,
        )
        nline1.shift(UP * 0.5)

        pct_label = Text("%", font_size=20)
        pct_label.next_to(nline1.get_right(), RIGHT, buff=0.15)

        self.play(Create(nline1), Write(pct_label), run_time=0.6)
        self.wait(0.2)

        # 5% threshold (red vertical line)
        threshold_line1 = Line(
            nline1.n2p(5) + DOWN * 0.3,
            nline1.n2p(5) + UP * 0.5,
            color=RED, stroke_width=4,
        )
        threshold_label1 = Text(
            "5% threshold", font_size=18, color=RED, weight=BOLD,
        )
        threshold_label1.next_to(threshold_line1, UP, buff=0.1)

        self.play(Create(threshold_line1), Write(threshold_label1), run_time=0.5)
        self.wait(0.3)

        # Shade the "unusual" zone (0% to 5%) in red
        unusual_zone1 = Rectangle(
            width=nline1.n2p(5)[0] - nline1.n2p(0)[0],
            height=0.3,
            fill_color=RED, fill_opacity=0.2,
            stroke_width=0,
        )
        unusual_zone1.move_to(
            (nline1.n2p(0) + nline1.n2p(5)) / 2 + UP * 0.1
        )
        self.play(FadeIn(unusual_zone1), run_time=0.4)

        # Mark 17.88%
        dot_1788 = Dot(nline1.n2p(17.88), color=ManimColor(GREEN_3B1B), radius=0.12)
        label_1788 = Text(
            "17.88%", font_size=22, color=ManimColor(GREEN_3B1B), weight=BOLD,
        )
        label_1788.next_to(dot_1788, UP, buff=0.15)
        not_unusual_label = Text(
            "Not unusual", font_size=20, color=ManimColor(GREEN_3B1B),
        )
        not_unusual_label.next_to(label_1788, UP, buff=0.08)

        self.play(FadeIn(dot_1788), Write(label_1788), run_time=0.5)
        self.play(Write(not_unusual_label), run_time=0.4)
        self.wait(0.5)

        # Explanation
        explain1 = Text(
            "17.88% > 5%, so this result is NOT unusual",
            font_size=24, color=ManimColor(GREEN_3B1B),
        )
        explain1.next_to(nline1, DOWN, buff=0.7)
        self.play(Write(explain1), run_time=0.6)
        self.wait(2.0)

        # Clear not-unusual example
        nline1_group = VGroup(
            nline1, pct_label, threshold_line1, threshold_label1,
            unusual_zone1, dot_1788, label_1788,
            not_unusual_label, explain1,
        )
        self.play(FadeOut(nline1_group), run_time=0.4)

        # ================================================================
        #  SECTION 5: CONTRAST — UNUSUAL (2%)
        # ================================================================
        contrast_header = Text(
            "But what if the probability were smaller?",
            font_size=26, color=PINK_3B1B,
        )
        contrast_header.next_to(unusual_header, DOWN, buff=0.3)
        self.play(Write(contrast_header), run_time=0.5)
        self.wait(0.3)

        # Second number line
        nline2 = NumberLine(
            x_range=[0, 25, 5],
            length=10,
            include_numbers=True,
            numbers_to_include=[0, 5, 10, 15, 20, 25],
            font_size=22,
            label_direction=DOWN,
        )
        nline2.shift(UP * 0.0)

        pct_label2 = Text("%", font_size=20)
        pct_label2.next_to(nline2.get_right(), RIGHT, buff=0.15)

        self.play(Create(nline2), Write(pct_label2), run_time=0.6)

        # 5% threshold again
        threshold_line2 = Line(
            nline2.n2p(5) + DOWN * 0.3,
            nline2.n2p(5) + UP * 0.5,
            color=RED, stroke_width=4,
        )
        threshold_label2 = Text(
            "5% threshold", font_size=18, color=RED, weight=BOLD,
        )
        threshold_label2.next_to(threshold_line2, UP, buff=0.1)
        self.play(Create(threshold_line2), Write(threshold_label2), run_time=0.4)

        # Shade the unusual zone
        unusual_zone2 = Rectangle(
            width=nline2.n2p(5)[0] - nline2.n2p(0)[0],
            height=0.3,
            fill_color=RED, fill_opacity=0.2,
            stroke_width=0,
        )
        unusual_zone2.move_to(
            (nline2.n2p(0) + nline2.n2p(5)) / 2 + UP * 0.1
        )
        self.play(FadeIn(unusual_zone2), run_time=0.3)

        # Mark 2%
        dot_02 = Dot(nline2.n2p(2), color=RED, radius=0.12)
        label_02 = Text("2%", font_size=22, color=RED, weight=BOLD)
        label_02.next_to(dot_02, UP, buff=0.15)
        unusual_label = Text("Unusual!", font_size=20, color=RED)
        unusual_label.next_to(label_02, UP, buff=0.08)

        self.play(FadeIn(dot_02), Write(label_02), run_time=0.5)
        self.play(Write(unusual_label), run_time=0.4)
        self.wait(0.5)

        # Explanation
        explain2 = VGroup(
            Text("2% < 5%, so this result IS unusual", font_size=24, color=RED),
            Text("it would rarely happen by chance alone",
                 font_size=22, color=GRAY),
        ).arrange(DOWN, buff=0.08)
        explain2.next_to(nline2, DOWN, buff=0.7)
        self.play(Write(explain2[0]), run_time=0.5)
        self.play(Write(explain2[1]), run_time=0.5)
        self.wait(2.0)

        # Clear everything
        nline2_group = VGroup(
            nline2, pct_label2, threshold_line2, threshold_label2,
            unusual_zone2, dot_02, label_02, unusual_label,
            explain2, contrast_header, unusual_header,
        )
        self.play(FadeOut(nline2_group), run_time=0.5)

        # ================================================================
        #  SECTION 6: KEY INSIGHT BOX
        # ================================================================
        insight_title = Text(
            "4 Requirements for a Good Interpretation:",
            font_size=30, color=ManimColor(GOLD), weight=BOLD,
        )

        req1_num = Text("1.", font_size=24, color=ManimColor(GOLD), weight=BOLD)
        req1_txt = Text('Reference "all possible samples of these sizes"',
                        font_size=22)
        req1 = VGroup(req1_num, req1_txt).arrange(RIGHT, buff=0.12)

        req2_num = Text("2.", font_size=24, color=ManimColor(GOLD), weight=BOLD)
        req2_txt = Text("Include the probability or percentage",
                        font_size=22)
        req2 = VGroup(req2_num, req2_txt).arrange(RIGHT, buff=0.12)

        req3_num = Text("3.", font_size=24, color=ManimColor(GOLD), weight=BOLD)
        req3_txt = Text("Describe the observed difference and direction",
                        font_size=22)
        req3 = VGroup(req3_num, req3_txt).arrange(RIGHT, buff=0.12)

        req4_num = Text("4.", font_size=24, color=ManimColor(GOLD), weight=BOLD)
        req4_txt = Text("Use context (specific populations, not generic)",
                        font_size=22)
        req4 = VGroup(req4_num, req4_txt).arrange(RIGHT, buff=0.12)

        requirements = VGroup(
            insight_title,
            Text("", font_size=6),  # spacer
            req1, req2, req3, req4,
        ).arrange(DOWN, buff=0.18, aligned_edge=LEFT)

        # Bottom tagline
        tagline = Text(
            "This is one of the MOST IMPORTANT reasons",
            font_size=22, color=ManimColor(YELLOW_3B1B),
        )
        tagline2 = Text(
            "we study sampling distributions!",
            font_size=22, color=ManimColor(YELLOW_3B1B),
        )
        tagline_group = VGroup(tagline, tagline2).arrange(DOWN, buff=0.06)

        full_insight = VGroup(requirements, tagline_group).arrange(DOWN, buff=0.3)
        full_insight.move_to(ORIGIN)

        insight_box = SurroundingRectangle(
            full_insight, color=ManimColor(GOLD), buff=0.35,
            corner_radius=0.15, stroke_width=3,
        )

        # Animate requirements one at a time
        self.play(Write(insight_title), run_time=0.6)
        self.wait(0.2)
        self.play(FadeIn(req1, shift=RIGHT * 0.2), run_time=0.5)
        self.play(FadeIn(req2, shift=RIGHT * 0.2), run_time=0.5)
        self.play(FadeIn(req3, shift=RIGHT * 0.2), run_time=0.5)
        self.play(FadeIn(req4, shift=RIGHT * 0.2), run_time=0.5)
        self.wait(0.3)
        self.play(Write(tagline), run_time=0.5)
        self.play(Write(tagline2), run_time=0.5)
        self.play(Create(insight_box), run_time=0.6)
        self.wait(3.0)

        # ================================================================
        #  FADE OUT
        # ================================================================
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
        )
        self.wait(0.5)

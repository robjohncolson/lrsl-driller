"""
Interpreting sigma_p-hat: "Typically" vs "Always" (AP Stats Unit 5, Topic 5.5)

Teaches students to correctly interpret the standard deviation of the sampling
distribution of p-hat. Uses a concrete scenario (15% international students,
n = 80) to show mu_p-hat = p on a number line, scatter sample proportions
around it, and illustrate sigma_p-hat as the "typical distance." Contrasts a
common WRONG interpretation (exact/always language) with the CORRECT one
(typically/on average language). Emphasizes the key vocabulary distinction.

Run with: manim -qm --format=mp4 apstat_55_interpret_std_dev_prop.py InterpretStdDevProp
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class InterpretStdDevProp(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(55)

        # ================================================================
        # TITLE
        # ================================================================
        title = VGroup(
            Text("Interpreting ", font_size=44, weight=BOLD),
            MathTex(r"\mu_{\hat{p}}", font_size=48, color=BLUE_3B1B),
            Text(" and ", font_size=44, weight=BOLD),
            MathTex(r"\sigma_{\hat{p}}", font_size=48, color=YELLOW_3B1B),
        ).arrange(RIGHT, buff=0.12)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title), run_time=1.0)
        self.wait(0.3)

        # ================================================================
        # SCENARIO
        # ================================================================
        scenario_line1 = Text(
            "15% of students at a university are international.",
            font_size=26,
        )
        scenario_line2 = Text(
            "We take random samples of n = 80 students.",
            font_size=26, color=TEAL_3B1B,
        )
        scenario = VGroup(scenario_line1, scenario_line2).arrange(DOWN, buff=0.1)
        scenario.next_to(title, DOWN, buff=0.35)

        self.play(Write(scenario_line1), run_time=0.7)
        self.play(Write(scenario_line2), run_time=0.7)
        self.wait(0.8)

        # ================================================================
        # SHOW mu_p-hat = p = 0.15
        # ================================================================
        mu_eq = VGroup(
            MathTex(r"\mu_{\hat{p}}", font_size=36, color=BLUE_3B1B),
            MathTex(r"= p = 0.15", font_size=36),
        ).arrange(RIGHT, buff=0.1)
        mu_eq.next_to(scenario, DOWN, buff=0.35)
        self.play(Write(mu_eq), run_time=0.6)
        self.wait(0.5)

        # Fade scenario to make room for number line
        self.play(FadeOut(scenario), mu_eq.animate.next_to(title, DOWN, buff=0.25), run_time=0.5)

        # ================================================================
        # NUMBER LINE with sample proportion dots
        # ================================================================
        num_line = NumberLine(
            x_range=[0.05, 0.25, 0.02],
            length=10,
            include_numbers=True,
            numbers_to_include=[0.06, 0.08, 0.10, 0.12, 0.14, 0.16, 0.18, 0.20, 0.22, 0.24],
            font_size=16,
            decimal_number_config={"num_decimal_places": 2},
            include_tip=False,
        )
        num_line.move_to(DOWN * 0.2)

        phat_label = MathTex(r"\hat{p}", font_size=24)
        phat_label.next_to(num_line, DOWN, buff=0.25)

        self.play(Create(num_line), Write(phat_label), run_time=0.7)
        self.wait(0.3)

        # Mark p = 0.15 with a triangle and dashed line
        p_pos = num_line.n2p(0.15)
        p_marker = Triangle(fill_color=BLUE_3B1B, fill_opacity=0.9, stroke_width=0).scale(0.15)
        p_marker.next_to(p_pos, DOWN, buff=0.0)
        p_label = MathTex(r"p = 0.15", font_size=22, color=BLUE_3B1B)
        p_label.next_to(p_marker, DOWN, buff=0.1)
        p_dashed = DashedLine(
            p_pos + DOWN * 0.05, p_pos + UP * 1.8,
            color=BLUE_3B1B, stroke_width=2, dash_length=0.08,
        )

        self.play(FadeIn(p_marker), Write(p_label), Create(p_dashed), run_time=0.5)
        self.wait(0.3)

        # ================================================================
        # SCATTER 12 sample proportions around 0.15
        # ================================================================
        # sigma_p-hat = sqrt(0.15 * 0.85 / 80) ~ 0.0399
        sigma = np.sqrt(0.15 * 0.85 / 80)  # ~0.040

        # Generate proportions: normally distributed around 0.15
        raw_props = np.random.normal(0.15, sigma, size=12)
        raw_props = np.clip(raw_props, 0.06, 0.24)

        sample_dots = VGroup()
        for val in raw_props:
            dot = Dot(
                num_line.n2p(val) + UP * 0.25,
                radius=0.08, color=TEAL_3B1B, fill_opacity=0.85,
            )
            sample_dots.add(dot)

        self.play(
            LaggedStart(
                *[FadeIn(d, shift=DOWN * 0.3) for d in sample_dots],
                lag_ratio=0.06,
            ),
            run_time=1.2,
        )
        self.wait(0.3)

        # Label: "Each dot = one sample's p-hat"
        dot_note = Text(
            "Each dot = one sample's p-hat (n = 80)",
            font_size=20, color=GREY_B,
        )
        dot_note.next_to(num_line, UP, buff=0.7)
        self.play(FadeIn(dot_note), run_time=0.4)
        self.wait(0.8)

        # ================================================================
        # SHOW sigma_p-hat with bracket showing "typical distance"
        # ================================================================
        sigma_eq = VGroup(
            MathTex(r"\sigma_{\hat{p}}", font_size=36, color=YELLOW_3B1B),
            MathTex(r"= \sqrt{\frac{p(1-p)}{n}}", font_size=34),
            MathTex(r"\approx 0.040", font_size=36, color=YELLOW_3B1B),
        ).arrange(RIGHT, buff=0.12)
        sigma_eq.next_to(mu_eq, DOWN, buff=0.2)

        self.play(Write(sigma_eq), run_time=0.8)
        self.wait(0.5)

        # Draw double arrows showing +/- sigma from p on the number line
        left_sigma_pos = num_line.n2p(0.15 - sigma)
        right_sigma_pos = num_line.n2p(0.15 + sigma)
        bracket_y = DOWN * 0.2 + DOWN * 0.65

        left_arrow = DoubleArrow(
            num_line.n2p(0.15) + DOWN * 0.65,
            left_sigma_pos + DOWN * 0.65,
            color=YELLOW_3B1B, stroke_width=3, buff=0.0,
            tip_length=0.15,
        )
        right_arrow = DoubleArrow(
            num_line.n2p(0.15) + DOWN * 0.65,
            right_sigma_pos + DOWN * 0.65,
            color=YELLOW_3B1B, stroke_width=3, buff=0.0,
            tip_length=0.15,
        )

        # "typical distance" label
        typical_label = Text(
            "typical distance", font_size=20, color=YELLOW_3B1B, weight=BOLD,
        )
        typical_label.next_to(
            VGroup(left_arrow, right_arrow), DOWN, buff=0.08,
        )

        # sigma value labels on each arrow
        sigma_left_val = MathTex(r"\approx 0.040", font_size=18, color=YELLOW_3B1B)
        sigma_left_val.next_to(left_arrow, UP, buff=0.04)
        sigma_right_val = MathTex(r"\approx 0.040", font_size=18, color=YELLOW_3B1B)
        sigma_right_val.next_to(right_arrow, UP, buff=0.04)

        self.play(
            Create(left_arrow), Create(right_arrow),
            Write(typical_label),
            Write(sigma_left_val), Write(sigma_right_val),
            run_time=0.8,
        )
        self.wait(1.0)

        # ================================================================
        # TRANSITION: Clear number line area for interpretation boxes
        # ================================================================
        number_line_stuff = VGroup(
            num_line, phat_label, p_marker, p_label, p_dashed,
            sample_dots, dot_note,
            left_arrow, right_arrow, typical_label,
            sigma_left_val, sigma_right_val,
        )
        self.play(
            FadeOut(number_line_stuff),
            FadeOut(mu_eq),
            FadeOut(sigma_eq),
            run_time=0.5,
        )

        # ================================================================
        # ERROR ANALYSIS: WRONG vs CORRECT interpretation
        # ================================================================
        section_title = Text(
            "How Do We Interpret This?", font_size=32, color=YELLOW_3B1B, weight=BOLD,
        )
        section_title.next_to(title, DOWN, buff=0.3)
        self.play(Write(section_title), run_time=0.5)
        self.wait(0.3)

        # ---------- LEFT BOX: WRONG ----------
        wrong_header = VGroup(
            Text("X", font_size=28, color=RED, weight=BOLD),
            Text("  WRONG", font_size=26, color=RED, weight=BOLD),
        ).arrange(RIGHT, buff=0.08)

        wrong_text = Text(
            "sigma_p-hat = 0.040 means\nexactly 4% of students\nvary in each sample",
            font_size=22, color=WHITE,
        )

        wrong_content = VGroup(wrong_header, wrong_text).arrange(DOWN, buff=0.2)
        wrong_box = SurroundingRectangle(
            wrong_content, color=RED, buff=0.25, corner_radius=0.1,
            stroke_width=3,
        )
        wrong_group = VGroup(wrong_box, wrong_content)
        wrong_group.move_to(LEFT * 3.3 + DOWN * 0.8)

        # ---------- RIGHT BOX: CORRECT ----------
        correct_header = VGroup(
            Text("ok", font_size=22, color=GREEN_3B1B, weight=BOLD),
            Text("  CORRECT", font_size=26, color=GREEN_3B1B, weight=BOLD),
        ).arrange(RIGHT, buff=0.08)

        correct_text = Text(
            "The sample proportion\ntypically varies by about\n0.040 from the true proportion\nof 0.15 across all possible\nsamples of 80",
            font_size=22, color=WHITE,
        )

        correct_content = VGroup(correct_header, correct_text).arrange(DOWN, buff=0.2)
        correct_box = SurroundingRectangle(
            correct_content, color=GREEN_3B1B, buff=0.25, corner_radius=0.1,
            stroke_width=3,
        )
        correct_group = VGroup(correct_box, correct_content)
        correct_group.move_to(RIGHT * 3.3 + DOWN * 0.8)

        # Animate WRONG box first
        self.play(FadeIn(wrong_group), run_time=0.6)
        self.wait(0.8)

        # Animate CORRECT box
        self.play(FadeIn(correct_group), run_time=0.6)
        self.wait(1.0)

        # ================================================================
        # HIGHLIGHT KEY WORDS in correct interpretation
        # ================================================================
        # Highlight "typically" in the correct text
        highlight_words_label = Text(
            "Key words:", font_size=22, color=YELLOW_3B1B, weight=BOLD,
        )
        kw1 = Text("typically", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        kw2 = Text("on average", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        kw3 = Text("all possible samples", font_size=24, color=YELLOW_3B1B, weight=BOLD)

        key_words = VGroup(highlight_words_label, kw1, kw2, kw3).arrange(
            RIGHT, buff=0.3,
        )
        key_words.to_edge(DOWN, buff=0.45)

        self.play(
            LaggedStart(
                Write(highlight_words_label),
                Write(kw1), Write(kw2), Write(kw3),
                lag_ratio=0.2,
            ),
            run_time=1.2,
        )
        self.wait(1.0)

        # Flash the WRONG box with a big red X overlay
        big_x = Text("X", font_size=80, color=RED, weight=BOLD)
        big_x.move_to(wrong_box.get_center())
        big_x.set_opacity(0.6)
        self.play(FadeIn(big_x, scale=1.5), run_time=0.3)
        self.wait(0.3)

        # Flash the CORRECT box with a green glow
        glow_box = SurroundingRectangle(
            correct_content, color=GREEN_3B1B, buff=0.3, corner_radius=0.12,
            stroke_width=6,
        )
        self.play(Create(glow_box), run_time=0.3)
        self.wait(0.8)

        # ================================================================
        # TRANSITION: Clear boxes, show final insight
        # ================================================================
        self.play(
            FadeOut(wrong_group), FadeOut(big_x),
            FadeOut(correct_group), FadeOut(glow_box),
            FadeOut(section_title), FadeOut(key_words),
            FadeOut(title),
            run_time=0.5,
        )

        # ================================================================
        # FINAL INSIGHT BOX
        # ================================================================
        insight_lines = VGroup(
            Text("Key Language", font_size=34, color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=8),  # spacer
            Text(
                "Use: \"typically varies\" or \"on average\"",
                font_size=26, color=GREEN_3B1B,
            ),
            Text("", font_size=8),  # spacer
            Text(
                "NOT: \"always\" or \"exactly\"",
                font_size=26, color=RED,
            ),
            Text("", font_size=8),  # spacer
            MathTex(
                r"\sigma_{\hat{p}}", font_size=36, color=YELLOW_3B1B,
            ),
            Text(
                "measures the typical distance of sample",
                font_size=24,
            ),
            Text(
                "proportions from the true proportion",
                font_size=24,
            ),
            Text(
                "across ALL possible samples of size n.",
                font_size=24, color=TEAL_3B1B, weight=BOLD,
            ),
        ).arrange(DOWN, buff=0.1)
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

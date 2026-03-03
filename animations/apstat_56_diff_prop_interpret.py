"""
Interpreting the Parameters of the Sampling Distribution of p-hat1 - p-hat2
(AP Stats Unit 5, Topic 5.6)

Shows a normal curve for the sampling distribution of p-hat1 - p-hat2, then
contrasts correct vs incorrect interpretations of the mean and standard
deviation. Crosses out the wrong interpretations and highlights the correct
ones. Ends with common mistakes and a key insight box.

Run with: manim -qm --format=mp4 apstat_56_diff_prop_interpret.py DiffPropInterpret
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class DiffPropInterpret(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ================================================================
        # TITLE
        # ================================================================
        title_text = Text("Interpreting ", font_size=38, weight=BOLD)
        title_math = MathTex(
            r"\hat{p}_1 - \hat{p}_2",
            font_size=44, color=TEAL_3B1B,
        )
        title_suffix = Text(" Parameters", font_size=38, weight=BOLD)
        title = VGroup(title_text, title_math, title_suffix).arrange(RIGHT, buff=0.12)
        title.to_edge(UP, buff=0.3)

        self.play(Write(title), run_time=1.0)
        self.wait(0.3)

        # ================================================================
        # NORMAL CURVE for sampling distribution of p-hat1 - p-hat2
        # ================================================================
        axes = Axes(
            x_range=[-0.3, 0.3, 0.1],
            y_range=[0, 5, 1],
            x_length=8,
            y_length=2.5,
            axis_config={
                "include_tip": False,
                "include_numbers": False,
                "stroke_width": 1.5,
            },
        )
        axes.next_to(title, DOWN, buff=0.4)

        # X-axis labels
        x_labels = VGroup()
        for val in [-0.2, -0.1, 0.0, 0.1, 0.2]:
            lab = Text(f"{val:.1f}", font_size=14)
            lab.next_to(axes.c2p(val, 0), DOWN, buff=0.08)
            x_labels.add(lab)

        x_axis_label = MathTex(
            r"\hat{p}_1 - \hat{p}_2", font_size=24, color=TEAL_3B1B,
        )
        x_axis_label.next_to(axes.x_axis, DOWN, buff=0.3)

        # Normal curve (mu = 0, sigma = 0.07 for visual purposes)
        mu = 0.0
        sigma = 0.07
        curve = axes.plot(
            lambda x: (1 / (sigma * np.sqrt(2 * np.pi)))
            * np.exp(-0.5 * ((x - mu) / sigma) ** 2),
            x_range=[-0.28, 0.28],
            color=BLUE_3B1B,
            stroke_width=3,
        )
        curve_fill = axes.get_area(
            curve, x_range=[-0.28, 0.28],
            color=BLUE_3B1B, opacity=0.2,
        )

        # Mean dashed line
        mean_line = DashedLine(
            axes.c2p(mu, 0), axes.c2p(mu, 4.5),
            color=YELLOW_3B1B, stroke_width=2, dash_length=0.08,
        )
        mean_label = MathTex(
            r"\mu = p_1 - p_2", font_size=20, color=YELLOW_3B1B,
        )
        mean_label.next_to(mean_line, UP, buff=0.05)

        # Sigma bracket arrows
        left_sigma_pos = axes.c2p(mu - sigma, 0)
        right_sigma_pos = axes.c2p(mu + sigma, 0)
        center_pos = axes.c2p(mu, 0)

        sigma_arrow = DoubleArrow(
            left_sigma_pos + DOWN * 0.35,
            right_sigma_pos + DOWN * 0.35,
            color=PINK_3B1B, stroke_width=2.5, buff=0.0, tip_length=0.12,
        )
        sigma_label = MathTex(r"\sigma", font_size=20, color=PINK_3B1B)
        sigma_label.next_to(sigma_arrow, DOWN, buff=0.05)

        self.play(
            Create(axes), FadeIn(x_labels), Write(x_axis_label),
            run_time=0.7,
        )
        self.play(Create(curve), FadeIn(curve_fill), run_time=0.8)
        self.play(
            Create(mean_line), Write(mean_label),
            Create(sigma_arrow), Write(sigma_label),
            run_time=0.7,
        )
        self.wait(0.8)

        # Fade the curve section
        curve_group = VGroup(
            axes, x_labels, x_axis_label, curve, curve_fill,
            mean_line, mean_label, sigma_arrow, sigma_label,
        )
        self.play(
            curve_group.animate.scale(0.55).to_corner(UL, buff=0.15).shift(DOWN * 0.45),
            run_time=0.6,
        )

        # ================================================================
        # MEAN INTERPRETATION: Correct vs Incorrect
        # ================================================================
        mean_header = Text(
            "Interpreting the Mean", font_size=30, color=YELLOW_3B1B, weight=BOLD,
        )
        mean_header.move_to(UP * 2.8 + RIGHT * 2.2)
        self.play(Write(mean_header), run_time=0.5)

        # --- CORRECT ---
        correct_mean_tag = Text(
            "CORRECT", font_size=22, color=GREEN_3B1B, weight=BOLD,
        )
        correct_mean_text = Text(
            "Across all possible pairs of samples,\n"
            "the average difference in sample\n"
            "proportions equals the true\n"
            "difference p\u2081 \u2212 p\u2082.",
            font_size=22, color=WHITE, line_spacing=1.1,
        )
        correct_mean_content = VGroup(correct_mean_tag, correct_mean_text).arrange(
            DOWN, buff=0.12, aligned_edge=LEFT,
        )
        correct_mean_box = SurroundingRectangle(
            correct_mean_content, color=GREEN_3B1B, buff=0.18, corner_radius=0.1,
            stroke_width=3,
        )
        correct_mean_group = VGroup(correct_mean_box, correct_mean_content)
        correct_mean_group.move_to(LEFT * 2.6 + DOWN * 0.3)

        # --- INCORRECT ---
        wrong_mean_tag = Text(
            "INCORRECT", font_size=22, color=RED, weight=BOLD,
        )
        wrong_mean_text = Text(
            "Every pair of samples will give\n"
            "a difference of exactly p\u2081 \u2212 p\u2082.",
            font_size=22, color=WHITE, line_spacing=1.1,
        )
        wrong_mean_content = VGroup(wrong_mean_tag, wrong_mean_text).arrange(
            DOWN, buff=0.12, aligned_edge=LEFT,
        )
        wrong_mean_box = SurroundingRectangle(
            wrong_mean_content, color=RED, buff=0.18, corner_radius=0.1,
            stroke_width=3,
        )
        wrong_mean_group = VGroup(wrong_mean_box, wrong_mean_content)
        wrong_mean_group.move_to(RIGHT * 3.5 + DOWN * 0.3)

        self.play(FadeIn(correct_mean_group), run_time=0.6)
        self.wait(0.5)
        self.play(FadeIn(wrong_mean_group), run_time=0.6)
        self.wait(0.5)

        # Cross out the wrong one
        cross_mean = Cross(
            wrong_mean_group, stroke_color=RED, stroke_width=6,
        )
        self.play(Create(cross_mean), run_time=0.5)
        self.wait(0.3)

        # Glow the correct one
        correct_mean_glow = SurroundingRectangle(
            correct_mean_content, color=GREEN_3B1B, buff=0.22, corner_radius=0.12,
            stroke_width=5,
        )
        self.play(Create(correct_mean_glow), run_time=0.4)
        self.wait(0.8)

        # Clear mean section
        mean_stuff = VGroup(
            mean_header, correct_mean_group, correct_mean_glow,
            wrong_mean_group, cross_mean,
        )
        self.play(FadeOut(mean_stuff), run_time=0.5)

        # ================================================================
        # SD INTERPRETATION: Correct vs Incorrect
        # ================================================================
        sd_header = Text(
            "Interpreting the Standard Deviation",
            font_size=30, color=PINK_3B1B, weight=BOLD,
        )
        sd_header.move_to(UP * 2.8 + RIGHT * 2.2)
        self.play(Write(sd_header), run_time=0.5)

        # --- CORRECT ---
        correct_sd_tag = Text(
            "CORRECT", font_size=22, color=GREEN_3B1B, weight=BOLD,
        )
        correct_sd_text = Text(
            "The difference in sample proportions\n"
            "typically varies by about \u03c3 from\n"
            "the true difference p\u2081 \u2212 p\u2082.",
            font_size=22, color=WHITE, line_spacing=1.1,
        )
        correct_sd_content = VGroup(correct_sd_tag, correct_sd_text).arrange(
            DOWN, buff=0.12, aligned_edge=LEFT,
        )
        correct_sd_box = SurroundingRectangle(
            correct_sd_content, color=GREEN_3B1B, buff=0.18, corner_radius=0.1,
            stroke_width=3,
        )
        correct_sd_group = VGroup(correct_sd_box, correct_sd_content)
        correct_sd_group.move_to(LEFT * 2.6 + DOWN * 0.3)

        # --- INCORRECT ---
        wrong_sd_tag = Text(
            "INCORRECT", font_size=22, color=RED, weight=BOLD,
        )
        wrong_sd_text = Text(
            "The difference is always within\n"
            "\u03c3 of the true difference.",
            font_size=22, color=WHITE, line_spacing=1.1,
        )
        wrong_sd_content = VGroup(wrong_sd_tag, wrong_sd_text).arrange(
            DOWN, buff=0.12, aligned_edge=LEFT,
        )
        wrong_sd_box = SurroundingRectangle(
            wrong_sd_content, color=RED, buff=0.18, corner_radius=0.1,
            stroke_width=3,
        )
        wrong_sd_group = VGroup(wrong_sd_box, wrong_sd_content)
        wrong_sd_group.move_to(RIGHT * 3.5 + DOWN * 0.3)

        self.play(FadeIn(correct_sd_group), run_time=0.6)
        self.wait(0.5)
        self.play(FadeIn(wrong_sd_group), run_time=0.6)
        self.wait(0.5)

        # Cross out the wrong one
        cross_sd = Cross(
            wrong_sd_group, stroke_color=RED, stroke_width=6,
        )
        self.play(Create(cross_sd), run_time=0.5)
        self.wait(0.3)

        # Glow the correct one
        correct_sd_glow = SurroundingRectangle(
            correct_sd_content, color=GREEN_3B1B, buff=0.22, corner_radius=0.12,
            stroke_width=5,
        )
        self.play(Create(correct_sd_glow), run_time=0.4)
        self.wait(0.8)

        # Clear SD section
        sd_stuff = VGroup(
            sd_header, correct_sd_group, correct_sd_glow,
            wrong_sd_group, cross_sd,
        )
        self.play(FadeOut(sd_stuff), run_time=0.5)

        # ================================================================
        # COMMON MISTAKES
        # ================================================================
        # Also fade out the mini curve
        self.play(FadeOut(curve_group), FadeOut(title), run_time=0.4)

        mistakes_header = Text(
            "Common Mistakes", font_size=34, color=YELLOW_3B1B, weight=BOLD,
        )
        mistakes_header.to_edge(UP, buff=0.5)
        self.play(Write(mistakes_header), run_time=0.5)
        self.wait(0.3)

        mistake1 = VGroup(
            Text("1.", font_size=24, color=RED, weight=BOLD),
            Text(
                "Confusing the difference in proportions",
                font_size=24,
            ),
        ).arrange(RIGHT, buff=0.15)
        mistake1b = Text(
            "   with individual proportions",
            font_size=24, color=PINK_3B1B,
        )
        m1_group = VGroup(mistake1, mistake1b).arrange(DOWN, buff=0.06, aligned_edge=LEFT)

        mistake2 = VGroup(
            Text("2.", font_size=24, color=RED, weight=BOLD),
            Text(
                'Saying "always" instead of "typically"',
                font_size=24,
            ),
        ).arrange(RIGHT, buff=0.15)

        mistake3 = VGroup(
            Text("3.", font_size=24, color=RED, weight=BOLD),
            Text(
                'Forgetting to reference "all possible',
                font_size=24,
            ),
        ).arrange(RIGHT, buff=0.15)
        mistake3b = Text(
            '   pairs of samples"',
            font_size=24, color=PINK_3B1B,
        )
        m3_group = VGroup(mistake3, mistake3b).arrange(DOWN, buff=0.06, aligned_edge=LEFT)

        mistakes_list = VGroup(m1_group, mistake2, m3_group).arrange(
            DOWN, buff=0.35, aligned_edge=LEFT,
        )
        mistakes_list.next_to(mistakes_header, DOWN, buff=0.5)

        self.play(
            LaggedStart(
                FadeIn(m1_group, shift=RIGHT * 0.3),
                FadeIn(mistake2, shift=RIGHT * 0.3),
                FadeIn(m3_group, shift=RIGHT * 0.3),
                lag_ratio=0.35,
            ),
            run_time=2.0,
        )
        self.wait(1.5)

        # ================================================================
        # TRANSITION: Clear mistakes, show final insight
        # ================================================================
        self.play(
            FadeOut(mistakes_header), FadeOut(mistakes_list),
            run_time=0.5,
        )

        # ================================================================
        # FINAL KEY INSIGHT BOX
        # ================================================================
        insight_lines = VGroup(
            Text(
                "Key Insight", font_size=34, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=8),  # spacer
            Text(
                'Key words for the MEAN:',
                font_size=26, color=TEAL_3B1B, weight=BOLD,
            ),
            Text(
                '"all possible pairs of samples"',
                font_size=26, color=GREEN_3B1B,
            ),
            Text(
                '+ "average difference equals p\u2081 \u2212 p\u2082"',
                font_size=24, color=GREEN_3B1B,
            ),
            Text("", font_size=8),  # spacer
            Text(
                'Key words for the SD:',
                font_size=26, color=PINK_3B1B, weight=BOLD,
            ),
            Text(
                '"typically varies by about \u03c3"',
                font_size=26, color=GREEN_3B1B,
            ),
            Text("", font_size=8),  # spacer
            Text(
                'NEVER: "always" or "exactly"',
                font_size=24, color=RED,
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

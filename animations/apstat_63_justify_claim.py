"""
Justifying a Claim with a Confidence Interval (AP Stats Unit 6, Topic 6.3)

Shows how to use a CI to justify (or not justify) a claim about a population
proportion. Visualizes the key rule: if ALL values in the interval are
consistent with the claim, there IS convincing evidence; if ANY value is
inconsistent, there is NOT convincing evidence. Uses a number line to show
two examples: one where the claim is supported and one where it is not.

Run with: manim -qm --format=mp4 apstat_63_justify_claim.py JustifyClaim
"""
from manim import *

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class JustifyClaim(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ================================================================
        # TITLE
        # ================================================================
        title = Text("Justifying a Claim with a CI", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.5)

        # ================================================================
        # THE RULE
        # ================================================================
        rule_header = Text("The Key Rule", font_size=30, color=YELLOW_3B1B, weight=BOLD)
        rule_header.next_to(title, DOWN, buff=0.35)
        self.play(Write(rule_header), run_time=0.4)

        rule_yes = VGroup(
            Text("ALL", font_size=24, color=GREEN_3B1B, weight=BOLD),
            Text(" values in CI consistent with claim", font_size=24),
        ).arrange(RIGHT, buff=0.06)
        rule_yes_result = Text(
            "--> Convincing evidence FOR the claim",
            font_size=22, color=GREEN_3B1B,
        )

        rule_no = VGroup(
            Text("ANY", font_size=24, color=RED, weight=BOLD),
            Text(" values in CI inconsistent with claim", font_size=24),
        ).arrange(RIGHT, buff=0.06)
        rule_no_result = Text(
            "--> NOT convincing evidence for the claim",
            font_size=22, color=RED,
        )

        rule_block = VGroup(
            rule_yes, rule_yes_result,
            Text("", font_size=6),
            rule_no, rule_no_result,
        ).arrange(DOWN, buff=0.1)
        rule_block.next_to(rule_header, DOWN, buff=0.25)

        self.play(Write(rule_yes), run_time=0.5)
        self.play(Write(rule_yes_result), run_time=0.5)
        self.wait(0.3)
        self.play(Write(rule_no), run_time=0.5)
        self.play(Write(rule_no_result), run_time=0.5)
        self.wait(0.8)

        rule_box = SurroundingRectangle(rule_block, color=YELLOW_3B1B, buff=0.2, corner_radius=0.1)
        self.play(Create(rule_box), run_time=0.5)
        self.wait(0.5)

        # ================================================================
        # TRANSITION: Clear rule, show Example 1
        # ================================================================
        self.play(
            FadeOut(rule_header), FadeOut(rule_block), FadeOut(rule_box),
            run_time=0.4,
        )

        # ================================================================
        # EXAMPLE 1: Enough Signatures (ALL > threshold)
        # ================================================================
        ex1_header = Text(
            "Example 1: Enough Valid Signatures?",
            font_size=28, color=TEAL_3B1B, weight=BOLD,
        )
        ex1_header.next_to(title, DOWN, buff=0.35)
        self.play(Write(ex1_header), run_time=0.5)

        ex1_setup = VGroup(
            Text("Need at least 6,000 of 9,388 signatures valid", font_size=22),
            MathTex(r"\text{Threshold: } 6000/9388 = 0.639", font_size=26, color=PINK_3B1B),
            Text("95% CI: (0.689, 0.767)", font_size=24, color=GREEN_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.12)
        ex1_setup.next_to(ex1_header, DOWN, buff=0.2)

        for line in ex1_setup:
            self.play(Write(line), run_time=0.4)
            self.wait(0.15)
        self.wait(0.3)

        # Number line
        nl1 = NumberLine(
            x_range=[0.55, 0.85, 0.05],
            length=10,
            include_numbers=True,
            numbers_to_include=[0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85],
            font_size=16,
            decimal_number_config={"num_decimal_places": 2},
            include_tip=False,
        )
        nl1.move_to(DOWN * 0.8)
        self.play(Create(nl1), run_time=0.6)

        # Mark threshold
        thresh_pos = nl1.n2p(0.639)
        thresh_line = DashedLine(
            thresh_pos + DOWN * 0.15, thresh_pos + UP * 0.6,
            color=PINK_3B1B, stroke_width=2, dash_length=0.08,
        )
        thresh_label = Text("0.639", font_size=18, color=PINK_3B1B, weight=BOLD)
        thresh_label.next_to(thresh_line, UP, buff=0.05)
        self.play(Create(thresh_line), Write(thresh_label), run_time=0.5)

        # CI bracket
        left_pos = nl1.n2p(0.689)
        right_pos = nl1.n2p(0.767)
        ci_region = Rectangle(
            width=right_pos[0] - left_pos[0],
            height=0.3,
            fill_color=GREEN_3B1B,
            fill_opacity=0.3,
            stroke_color=GREEN_3B1B,
            stroke_width=2,
        )
        ci_region.move_to((left_pos + right_pos) / 2)

        ci_label = Text("CI: (0.689, 0.767)", font_size=18, color=GREEN_3B1B)
        ci_label.next_to(ci_region, UP, buff=0.1)

        self.play(FadeIn(ci_region), Write(ci_label), run_time=0.6)
        self.wait(0.3)

        # Arrow: entire CI is to the RIGHT of threshold
        verdict1 = Text(
            "ALL values > 0.639  -->  Convincing evidence!",
            font_size=22, color=GREEN_3B1B, weight=BOLD,
        )
        verdict1.next_to(nl1, DOWN, buff=0.5)
        self.play(Write(verdict1), run_time=0.7)
        self.wait(0.8)

        # ================================================================
        # TRANSITION: Clear Example 1, show Example 2
        # ================================================================
        self.play(
            FadeOut(ex1_header), FadeOut(ex1_setup),
            FadeOut(nl1), FadeOut(thresh_line), FadeOut(thresh_label),
            FadeOut(ci_region), FadeOut(ci_label), FadeOut(verdict1),
            run_time=0.5,
        )

        # ================================================================
        # EXAMPLE 2: Majority Support? (CI straddles 0.5)
        # ================================================================
        ex2_header = Text(
            "Example 2: Majority Support?",
            font_size=28, color=TEAL_3B1B, weight=BOLD,
        )
        ex2_header.next_to(title, DOWN, buff=0.35)
        self.play(Write(ex2_header), run_time=0.5)

        ex2_setup = VGroup(
            Text("Claim: a majority (> 50%) support Prop 100", font_size=22),
            MathTex(r"\text{Threshold: } p = 0.50", font_size=26, color=PINK_3B1B),
            Text("95% CI: (0.474, 0.562)", font_size=24, color=BLUE_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.12)
        ex2_setup.next_to(ex2_header, DOWN, buff=0.2)

        for line in ex2_setup:
            self.play(Write(line), run_time=0.4)
            self.wait(0.15)
        self.wait(0.3)

        # Number line
        nl2 = NumberLine(
            x_range=[0.40, 0.65, 0.05],
            length=10,
            include_numbers=True,
            numbers_to_include=[0.40, 0.45, 0.50, 0.55, 0.60, 0.65],
            font_size=16,
            decimal_number_config={"num_decimal_places": 2},
            include_tip=False,
        )
        nl2.move_to(DOWN * 0.8)
        self.play(Create(nl2), run_time=0.6)

        # Mark threshold at 0.50
        thresh2_pos = nl2.n2p(0.50)
        thresh2_line = DashedLine(
            thresh2_pos + DOWN * 0.15, thresh2_pos + UP * 0.6,
            color=PINK_3B1B, stroke_width=2, dash_length=0.08,
        )
        thresh2_label = Text("0.50", font_size=18, color=PINK_3B1B, weight=BOLD)
        thresh2_label.next_to(thresh2_line, UP, buff=0.05)
        self.play(Create(thresh2_line), Write(thresh2_label), run_time=0.5)

        # CI bracket straddling 0.50
        left2_pos = nl2.n2p(0.474)
        right2_pos = nl2.n2p(0.562)
        ci2_region = Rectangle(
            width=right2_pos[0] - left2_pos[0],
            height=0.3,
            fill_color=BLUE_3B1B,
            fill_opacity=0.3,
            stroke_color=BLUE_3B1B,
            stroke_width=2,
        )
        ci2_region.move_to((left2_pos + right2_pos) / 2)

        ci2_label = Text("CI: (0.474, 0.562)", font_size=18, color=BLUE_3B1B)
        ci2_label.next_to(ci2_region, UP, buff=0.1)

        self.play(FadeIn(ci2_region), Write(ci2_label), run_time=0.6)
        self.wait(0.3)

        # Highlight the part below 0.50
        overlap_width = thresh2_pos[0] - left2_pos[0]
        if overlap_width > 0:
            overlap_region = Rectangle(
                width=overlap_width,
                height=0.3,
                fill_color=RED,
                fill_opacity=0.4,
                stroke_width=0,
            )
            overlap_region.move_to(
                (left2_pos + thresh2_pos) / 2
            )
            self.play(FadeIn(overlap_region), run_time=0.5)

        # Verdict
        verdict2 = Text(
            "Values < 0.50 exist  -->  NOT convincing evidence!",
            font_size=22, color=RED, weight=BOLD,
        )
        verdict2.next_to(nl2, DOWN, buff=0.5)
        self.play(Write(verdict2), run_time=0.7)
        self.wait(0.8)

        # ================================================================
        # FINAL KEY INSIGHT BOX
        # ================================================================
        self.play(
            FadeOut(ex2_header), FadeOut(ex2_setup),
            FadeOut(nl2), FadeOut(thresh2_line), FadeOut(thresh2_label),
            FadeOut(ci2_region), FadeOut(ci2_label),
            FadeOut(overlap_region) if overlap_width > 0 else Wait(0),
            FadeOut(verdict2), FadeOut(title),
            run_time=0.5,
        )

        final_content = VGroup(
            Text("Justifying a Claim with a CI", font_size=32, color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=8),
            Text("Compare ALL plausible values to the threshold.", font_size=24),
            Text("", font_size=6),
            Text("ALL values consistent with claim:", font_size=24, color=GREEN_3B1B, weight=BOLD),
            Text("--> Convincing evidence FOR the claim", font_size=22, color=GREEN_3B1B),
            Text("", font_size=6),
            Text("ANY value inconsistent:", font_size=24, color=RED, weight=BOLD),
            Text("--> NOT convincing evidence", font_size=22, color=RED),
            Text("", font_size=6),
            Text("Check: Does the CI straddle the threshold?", font_size=22, color=TEAL_3B1B),
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

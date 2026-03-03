"""
Identifying Evidence in Hypothesis Testing (AP Stats Unit 6, Topic 6.1)

Shows what counts as "evidence" in hypothesis testing by comparing a claimed
population proportion (p0) to an observed sample proportion (p-hat). Uses a
number line to visualize the gap between claimed and observed values, and
emphasizes that the farther p-hat is from p0, the stronger the evidence
against the claim.

Run with: manim -qm --format=mp4 apstat_61_identify_evidence.py IdentifyEvidence
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class IdentifyEvidence(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Identifying Evidence", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "What counts as evidence in hypothesis testing?",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== PART 1: Show the Scenario ==========
        scenario_header = Text("The Scenario", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        scenario_header.next_to(subtitle, DOWN, buff=0.4)
        self.play(Write(scenario_header))
        self.wait(0.2)

        claim_line = Text(
            "A company claims 40% of customers prefer Brand A",
            font_size=24, color=WHITE,
        )
        claim_line.next_to(scenario_header, DOWN, buff=0.25)
        self.play(Write(claim_line))
        self.wait(0.3)

        claim_math = MathTex(r"p_0 = 0.40", font_size=36, color=BLUE_3B1B)
        claim_label = Text("(the claimed value)", font_size=20, color=GRAY)
        claim_row = VGroup(claim_math, claim_label).arrange(RIGHT, buff=0.2)
        claim_row.next_to(claim_line, DOWN, buff=0.2)
        self.play(Write(claim_math), Write(claim_label))
        self.wait(0.5)

        # Show sample result
        sample_line = Text(
            "You survey n = 200 customers and find...",
            font_size=24, color=WHITE,
        )
        sample_line.next_to(claim_row, DOWN, buff=0.35)
        self.play(Write(sample_line))
        self.wait(0.3)

        phat_math = MathTex(r"\hat{p} = 0.52", font_size=36, color=TEAL_3B1B)
        phat_label = Text("(the observed value)", font_size=20, color=GRAY)
        phat_row = VGroup(phat_math, phat_label).arrange(RIGHT, buff=0.2)
        phat_row.next_to(sample_line, DOWN, buff=0.2)
        self.play(Write(phat_math), Write(phat_label))
        self.wait(0.8)

        # ========== PART 2: Number Line Comparison ==========
        self.play(
            FadeOut(scenario_header), FadeOut(claim_line), FadeOut(claim_row),
            FadeOut(sample_line), FadeOut(phat_row),
            run_time=0.5,
        )

        compare_header = Text(
            "Comparing Claimed vs. Observed",
            font_size=28, color=YELLOW_3B1B, weight=BOLD,
        )
        compare_header.next_to(subtitle, DOWN, buff=0.3)
        self.play(Write(compare_header))
        self.wait(0.3)

        # Number line from 0.20 to 0.70
        num_line = NumberLine(
            x_range=[0.20, 0.70, 0.05],
            length=10,
            include_numbers=True,
            numbers_to_include=np.arange(0.20, 0.71, 0.05),
            font_size=16,
            include_tip=False,
            decimal_number_config={"num_decimal_places": 2},
        )
        num_line.shift(DOWN * 0.3)

        num_line_label = Text("Proportion", font_size=20)
        num_line_label.next_to(num_line, DOWN, buff=0.3)

        self.play(Create(num_line), Write(num_line_label), run_time=0.8)
        self.wait(0.3)

        # Mark p0 = 0.40
        p0_dot = Dot(num_line.n2p(0.40), color=BLUE_3B1B, radius=0.12)
        p0_label = VGroup(
            MathTex(r"p_0 = 0.40", font_size=28, color=BLUE_3B1B),
            Text("(Claimed)", font_size=18, color=BLUE_3B1B),
        ).arrange(DOWN, buff=0.05)
        p0_label.next_to(p0_dot, UP, buff=0.2)

        self.play(FadeIn(p0_dot, scale=1.5), Write(p0_label), run_time=0.6)
        self.wait(0.3)

        # Mark p-hat = 0.52
        phat_dot = Dot(num_line.n2p(0.52), color=TEAL_3B1B, radius=0.12)
        phat_label2 = VGroup(
            MathTex(r"\hat{p} = 0.52", font_size=28, color=TEAL_3B1B),
            Text("(Observed)", font_size=18, color=TEAL_3B1B),
        ).arrange(DOWN, buff=0.05)
        phat_label2.next_to(phat_dot, UP, buff=0.2)

        self.play(FadeIn(phat_dot, scale=1.5), Write(phat_label2), run_time=0.6)
        self.wait(0.5)

        # ========== PART 3: Highlight the GAP ==========
        gap_arrow = DoubleArrow(
            num_line.n2p(0.40) + DOWN * 0.3,
            num_line.n2p(0.52) + DOWN * 0.3,
            color=PINK_3B1B, stroke_width=4, buff=0.05,
        )
        gap_label = Text("Gap = 0.12", font_size=22, color=PINK_3B1B, weight=BOLD)
        gap_label.next_to(gap_arrow, DOWN, buff=0.1)

        self.play(Create(gap_arrow), Write(gap_label), run_time=0.6)
        self.wait(0.5)

        # Flash the gap
        self.play(
            gap_arrow.animate.set_color(YELLOW_3B1B),
            gap_label.animate.set_color(YELLOW_3B1B),
            run_time=0.3,
        )
        self.play(
            gap_arrow.animate.set_color(PINK_3B1B),
            gap_label.animate.set_color(PINK_3B1B),
            run_time=0.3,
        )
        self.wait(0.3)

        # Evidence explanation
        evidence_text = Text(
            "This gap IS the evidence!",
            font_size=26, color=GREEN_3B1B, weight=BOLD,
        )
        evidence_text.next_to(num_line_label, DOWN, buff=0.35)
        self.play(Write(evidence_text))
        self.wait(0.8)

        # ========== PART 4: Farther = Stronger ==========
        self.play(FadeOut(evidence_text), run_time=0.3)

        # Show a second scenario with a bigger gap
        bigger_text = Text(
            "What if the sample had shown...",
            font_size=22, color=GRAY,
        )
        bigger_text.next_to(num_line_label, DOWN, buff=0.25)
        self.play(Write(bigger_text))
        self.wait(0.3)

        # Move phat dot to 0.60
        phat_dot_new = Dot(num_line.n2p(0.60), color=YELLOW_3B1B, radius=0.12)
        phat_label_new = VGroup(
            MathTex(r"\hat{p} = 0.60", font_size=28, color=YELLOW_3B1B),
            Text("(Even farther!)", font_size=18, color=YELLOW_3B1B),
        ).arrange(DOWN, buff=0.05)
        phat_label_new.next_to(phat_dot_new, UP, buff=0.2)

        self.play(
            FadeIn(phat_dot_new, scale=1.5),
            Write(phat_label_new),
            run_time=0.6,
        )
        self.wait(0.3)

        # Bigger gap arrow
        gap_arrow2 = DoubleArrow(
            num_line.n2p(0.40) + DOWN * 0.7,
            num_line.n2p(0.60) + DOWN * 0.7,
            color=RED, stroke_width=4, buff=0.05,
        )
        gap_label2 = Text("Gap = 0.20 (STRONGER evidence!)", font_size=20, color=RED, weight=BOLD)
        gap_label2.next_to(gap_arrow2, DOWN, buff=0.1)

        self.play(Create(gap_arrow2), Write(gap_label2), run_time=0.6)
        self.wait(0.8)

        # ========== PART 5: Key Insight Box ==========
        self.play(
            FadeOut(compare_header), FadeOut(num_line), FadeOut(num_line_label),
            FadeOut(p0_dot), FadeOut(p0_label),
            FadeOut(phat_dot), FadeOut(phat_label2),
            FadeOut(phat_dot_new), FadeOut(phat_label_new),
            FadeOut(gap_arrow), FadeOut(gap_label),
            FadeOut(gap_arrow2), FadeOut(gap_label2),
            FadeOut(bigger_text), FadeOut(subtitle), FadeOut(title),
            run_time=0.5,
        )

        insight_content = VGroup(
            Text(
                "What Is Evidence?",
                font_size=32, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=8),
            Text(
                "Evidence = how the sample statistic",
                font_size=26,
            ),
            VGroup(
                Text("(", font_size=26),
                MathTex(r"\hat{p}", font_size=32, color=TEAL_3B1B),
                Text(") compares to the claimed value (", font_size=26),
                MathTex(r"p_0", font_size=32, color=BLUE_3B1B),
                Text(")", font_size=26),
            ).arrange(RIGHT, buff=0.08),
            Text("", font_size=8),
            Text(
                "The FARTHER p-hat is from p0,",
                font_size=26, color=PINK_3B1B,
            ),
            Text(
                "the STRONGER the evidence AGAINST the claim",
                font_size=26, color=PINK_3B1B,
            ),
            Text("", font_size=8),
            Text(
                "Close to p0 --> Weak evidence (consistent with claim)",
                font_size=22, color=GRAY,
            ),
            Text(
                "Far from p0 --> Strong evidence (contradicts claim)",
                font_size=22, color=GREEN_3B1B,
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

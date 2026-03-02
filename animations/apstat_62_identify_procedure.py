"""
Choosing the Right Inference Procedure (AP Stats Unit 6, Topic 6.2)

Walks through a decision flowchart for identifying which inference procedure
to use. Asks three questions: How many samples? What type of data? What is the
goal? Each answer is highlighted to lead to the correct choice: one-sample
z-interval for p. Shows the formula, then briefly contrasts with incorrect
choices (two-sample, t-interval, z-test) to reinforce the reasoning.

Run with: manim -qm --format=mp4 apstat_62_identify_procedure.py IdentifyProcedure
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class IdentifyProcedure(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Choosing the Right Procedure", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "A decision flowchart",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== PART 1: Flowchart — Question 1 ==========
        # We build the flowchart step by step, each question as a row

        q1_text = Text("Q1: How many samples?", font_size=24, color=WHITE)
        q1_box = SurroundingRectangle(q1_text, color=BLUE_3B1B, buff=0.15, corner_radius=0.1)
        q1_group = VGroup(q1_box, q1_text)
        q1_group.move_to(UP * 1.8)

        self.play(FadeIn(q1_group))
        self.wait(0.3)

        # Answer: "One"
        a1_text = Text("One", font_size=26, color=BLUE_3B1B, weight=BOLD)
        a1_box = SurroundingRectangle(a1_text, color=BLUE_3B1B, buff=0.12, corner_radius=0.08, fill_color=BLUE_3B1B, fill_opacity=0.15)
        a1_group = VGroup(a1_box, a1_text)
        a1_group.next_to(q1_group, RIGHT, buff=0.5)

        arrow1 = Arrow(
            q1_group.get_right(), a1_group.get_left(),
            color=BLUE_3B1B, stroke_width=3, buff=0.1,
        )

        self.play(Create(arrow1), FadeIn(a1_group), run_time=0.6)
        self.wait(0.3)

        # Highlight the answer
        self.play(
            a1_box.animate.set_stroke(YELLOW_3B1B, width=3),
            Flash(a1_group, color=YELLOW_3B1B, line_length=0.2, num_lines=8),
            run_time=0.5,
        )
        self.wait(0.3)

        # ========== Question 2 ==========
        q2_text = Text("Q2: What type of data?", font_size=24, color=WHITE)
        q2_box = SurroundingRectangle(q2_text, color=TEAL_3B1B, buff=0.15, corner_radius=0.1)
        q2_group = VGroup(q2_box, q2_text)
        q2_group.move_to(UP * 0.5)

        connector_1_2 = Arrow(
            q1_group.get_bottom(), q2_group.get_top(),
            color=GRAY, stroke_width=2, buff=0.1,
        )

        self.play(Create(connector_1_2), FadeIn(q2_group), run_time=0.5)
        self.wait(0.3)

        # Answer: "Categorical (proportion)"
        a2_text = Text("Categorical (proportion)", font_size=22, color=TEAL_3B1B, weight=BOLD)
        a2_box = SurroundingRectangle(a2_text, color=TEAL_3B1B, buff=0.12, corner_radius=0.08, fill_color=TEAL_3B1B, fill_opacity=0.15)
        a2_group = VGroup(a2_box, a2_text)
        a2_group.next_to(q2_group, RIGHT, buff=0.5)

        arrow2 = Arrow(
            q2_group.get_right(), a2_group.get_left(),
            color=TEAL_3B1B, stroke_width=3, buff=0.1,
        )

        self.play(Create(arrow2), FadeIn(a2_group), run_time=0.6)
        self.wait(0.3)

        self.play(
            a2_box.animate.set_stroke(YELLOW_3B1B, width=3),
            Flash(a2_group, color=YELLOW_3B1B, line_length=0.2, num_lines=8),
            run_time=0.5,
        )
        self.wait(0.3)

        # ========== Question 3 ==========
        q3_text = Text("Q3: What's the goal?", font_size=24, color=WHITE)
        q3_box = SurroundingRectangle(q3_text, color=GREEN_3B1B, buff=0.15, corner_radius=0.1)
        q3_group = VGroup(q3_box, q3_text)
        q3_group.move_to(DOWN * 0.8)

        connector_2_3 = Arrow(
            q2_group.get_bottom(), q3_group.get_top(),
            color=GRAY, stroke_width=2, buff=0.1,
        )

        self.play(Create(connector_2_3), FadeIn(q3_group), run_time=0.5)
        self.wait(0.3)

        # Answer: "Estimate with a confidence interval"
        a3_text = Text("Estimate (confidence interval)", font_size=22, color=GREEN_3B1B, weight=BOLD)
        a3_box = SurroundingRectangle(a3_text, color=GREEN_3B1B, buff=0.12, corner_radius=0.08, fill_color=GREEN_3B1B, fill_opacity=0.15)
        a3_group = VGroup(a3_box, a3_text)
        a3_group.next_to(q3_group, RIGHT, buff=0.5)

        arrow3 = Arrow(
            q3_group.get_right(), a3_group.get_left(),
            color=GREEN_3B1B, stroke_width=3, buff=0.1,
        )

        self.play(Create(arrow3), FadeIn(a3_group), run_time=0.6)
        self.wait(0.3)

        self.play(
            a3_box.animate.set_stroke(YELLOW_3B1B, width=3),
            Flash(a3_group, color=YELLOW_3B1B, line_length=0.2, num_lines=8),
            run_time=0.5,
        )
        self.wait(0.5)

        # ========== PART 2: Result — Procedure Name ==========
        result_text = Text(
            "One-Sample z-Interval for p",
            font_size=32, color=YELLOW_3B1B, weight=BOLD,
        )
        result_box = SurroundingRectangle(
            result_text, color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
            fill_color=YELLOW_3B1B, fill_opacity=0.1,
        )
        result_group = VGroup(result_box, result_text)
        result_group.move_to(DOWN * 2.2)

        connector_3_result = Arrow(
            q3_group.get_bottom(), result_group.get_top(),
            color=YELLOW_3B1B, stroke_width=4, buff=0.1,
        )

        self.play(
            Create(connector_3_result),
            FadeIn(result_group, shift=DOWN * 0.3),
            run_time=0.8,
        )
        self.wait(0.8)

        # ========== PART 3: Show the Formula ==========
        # Clear the flowchart
        flowchart = VGroup(
            q1_group, a1_group, arrow1,
            q2_group, a2_group, arrow2, connector_1_2,
            q3_group, a3_group, arrow3, connector_2_3,
            connector_3_result,
        )
        self.play(
            FadeOut(flowchart),
            result_group.animate.move_to(UP * 1.8),
            run_time=0.6,
        )
        self.wait(0.3)

        formula_label = Text("The Formula:", font_size=26, color=TEAL_3B1B, weight=BOLD)
        formula_label.next_to(result_group, DOWN, buff=0.35)
        self.play(Write(formula_label))
        self.wait(0.2)

        # p-hat +/- z* * sqrt(p-hat(1-p-hat)/n)
        formula = MathTex(
            r"\hat{p}", r"\pm", r"z^*", r"\sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
            font_size=48,
        )
        formula[0].set_color(TEAL_3B1B)
        formula[2].set_color(PINK_3B1B)
        formula[3].set_color(BLUE_3B1B)
        formula.next_to(formula_label, DOWN, buff=0.3)
        self.play(Write(formula), run_time=1.2)
        self.wait(0.3)

        # Label parts
        brace_center = Brace(formula[0], DOWN, buff=0.12)
        center_label = Text("point estimate", font_size=16, color=TEAL_3B1B)
        center_label.next_to(brace_center, DOWN, buff=0.08)

        brace_margin = Brace(VGroup(formula[2], formula[3]), DOWN, buff=0.12)
        margin_label = Text("margin of error", font_size=16, color=PINK_3B1B)
        margin_label.next_to(brace_margin, DOWN, buff=0.08)

        self.play(
            GrowFromCenter(brace_center), Write(center_label),
            GrowFromCenter(brace_margin), Write(margin_label),
            run_time=0.8,
        )
        self.wait(0.8)

        # ========== PART 4: Contrast with Wrong Choices ==========
        self.play(
            FadeOut(brace_center), FadeOut(center_label),
            FadeOut(brace_margin), FadeOut(margin_label),
            FadeOut(formula_label),
            formula.animate.scale(0.7).next_to(result_group, DOWN, buff=0.2),
            run_time=0.5,
        )

        wrong_header = Text("Why NOT these?", font_size=26, color=PINK_3B1B, weight=BOLD)
        wrong_header.move_to(DOWN * 0.2)
        self.play(Write(wrong_header))
        self.wait(0.3)

        # Three wrong choices
        wrong1 = VGroup(
            Text("Two-sample z-interval?", font_size=22, color=RED),
            Text("NO - only ONE group", font_size=18, color=GRAY),
        ).arrange(DOWN, buff=0.06)

        wrong2 = VGroup(
            Text("t-interval?", font_size=22, color=RED),
            Text("NO - that's for MEANS, not proportions", font_size=18, color=GRAY),
        ).arrange(DOWN, buff=0.06)

        wrong3 = VGroup(
            Text("z-test?", font_size=22, color=RED),
            Text("NO - we want to ESTIMATE, not test", font_size=18, color=GRAY),
        ).arrange(DOWN, buff=0.06)

        wrongs = VGroup(wrong1, wrong2, wrong3).arrange(DOWN, buff=0.25)
        wrongs.next_to(wrong_header, DOWN, buff=0.25)

        for w in [wrong1, wrong2, wrong3]:
            # Show wrong choice label
            self.play(Write(w[0]), run_time=0.35)
            self.wait(0.15)
            # Show reason
            self.play(Write(w[1]), run_time=0.35)
            self.wait(0.2)

            # X mark
            x_mark = Text("X", font_size=24, color=RED, weight=BOLD)
            x_mark.next_to(w[0], LEFT, buff=0.15)
            self.play(FadeIn(x_mark, scale=1.5), run_time=0.2)
            w.add(x_mark)

        self.wait(0.8)

        # ========== PART 5: Key Insight Box ==========
        self.play(
            FadeOut(result_group), FadeOut(formula),
            FadeOut(wrong_header), FadeOut(wrongs),
            FadeOut(subtitle), FadeOut(title),
            run_time=0.5,
        )

        insight_content = VGroup(
            Text(
                "Choosing the Right Procedure",
                font_size=32, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=8),
            Text(
                "Ask three questions:",
                font_size=26, color=WHITE,
            ),
            Text("", font_size=4),
            Text(
                "1. How many samples?  -->  One",
                font_size=24, color=BLUE_3B1B,
            ),
            Text(
                "2. What type of data?  -->  Categorical (proportion)",
                font_size=24, color=TEAL_3B1B,
            ),
            Text(
                "3. What's the goal?  -->  Estimate (confidence interval)",
                font_size=24, color=GREEN_3B1B,
            ),
            Text("", font_size=8),
            Text(
                "One sample + proportion + estimate",
                font_size=26, color=WHITE,
            ),
            Text(
                "= One-sample z-interval for p",
                font_size=28, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=6),
            MathTex(
                r"\hat{p} \pm z^* \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
                font_size=38, color=TEAL_3B1B,
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

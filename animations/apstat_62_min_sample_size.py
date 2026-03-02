"""
Minimum Sample Size for a Desired Margin of Error (AP Stats Unit 6, Topic 6.2)

Shows how to solve for the minimum sample size n given a target margin of error.
Derives the formula n >= p-hat(1-p-hat) * (z*/ME)^2 step by step, explains why
p-hat = 0.5 is used when no prior guess exists (graph of p-hat(1-p-hat) with
maximum at 0.5), and works through a full example: 95% confidence, ME <= 0.04,
no prior guess. Emphasizes always rounding UP.

Run with: manim -qm --format=mp4 apstat_62_min_sample_size.py MinSampleSize
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MinSampleSize(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ================================================================
        # TITLE
        # ================================================================
        title = Text("Minimum Sample Size", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Before collecting data -- how many do we need?",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.25)
        self.play(Write(subtitle), run_time=0.7)
        self.wait(0.5)

        # ================================================================
        # STARTING INEQUALITY
        # ================================================================
        start_label = Text("Start with:", font_size=24, color=YELLOW_3B1B)
        start_label.next_to(subtitle, DOWN, buff=0.4)
        start_label.to_edge(LEFT, buff=1.5)

        ineq_start = MathTex(
            r"\text{ME}", r"\geq", r"z^*", r"\cdot",
            r"\sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
            font_size=38,
        )
        ineq_start[0].set_color(YELLOW_3B1B)
        ineq_start[2].set_color(PINK_3B1B)
        ineq_start[4].set_color(BLUE_3B1B)
        ineq_start.next_to(start_label, RIGHT, buff=0.3)

        self.play(Write(start_label), run_time=0.3)
        self.play(Write(ineq_start), run_time=1.0)
        self.wait(0.5)

        goal_text = Text(
            "Goal: solve for n", font_size=24, color=GREEN_3B1B, weight=BOLD,
        )
        goal_text.next_to(ineq_start, DOWN, buff=0.3)
        self.play(Write(goal_text), run_time=0.5)
        self.wait(0.8)

        # ================================================================
        # STEP-BY-STEP ALGEBRA
        # ================================================================
        self.play(
            FadeOut(start_label), FadeOut(ineq_start), FadeOut(goal_text),
            run_time=0.4,
        )

        algebra_header = Text(
            "Solving for n", font_size=30, color=YELLOW_3B1B, weight=BOLD,
        )
        algebra_header.next_to(subtitle, DOWN, buff=0.35)
        self.play(Write(algebra_header), run_time=0.4)

        # Step 1: original inequality
        step1 = MathTex(
            r"\text{ME} \geq z^* \cdot \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
            font_size=34,
        )
        step1.next_to(algebra_header, DOWN, buff=0.3)

        # Step 2: divide both sides by z*
        step2 = MathTex(
            r"\frac{\text{ME}}{z^*} \geq \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
            font_size=34,
        )
        step2_note = Text("Divide by z*", font_size=18, color=GREY_B)

        # Step 3: square both sides
        step3 = MathTex(
            r"\left(\frac{\text{ME}}{z^*}\right)^2 \geq \frac{\hat{p}(1-\hat{p})}{n}",
            font_size=34,
        )
        step3_note = Text("Square both sides", font_size=18, color=GREY_B)

        # Step 4: multiply by n, divide by left side
        step4 = MathTex(
            r"n \geq \frac{\hat{p}(1-\hat{p})}{\left(\text{ME}/z^*\right)^2}",
            font_size=34,
        )
        step4_note = Text("Solve for n", font_size=18, color=GREY_B)

        # Step 5: rewrite cleanly
        step5 = MathTex(
            r"n \geq \hat{p}(1-\hat{p}) \cdot \left(\frac{z^*}{\text{ME}}\right)^2",
            font_size=38,
        )
        step5.set_color(GREEN_3B1B)
        step5_note = Text("Final form", font_size=18, color=GREEN_3B1B)

        # Position all steps centered, transition one at a time
        center_pos = ORIGIN + DOWN * 0.3
        step1.move_to(center_pos)
        self.play(Write(step1), run_time=0.8)
        self.wait(0.5)

        step2.move_to(center_pos)
        step2_note.next_to(step2, RIGHT, buff=0.4)
        self.play(TransformMatchingShapes(step1, step2), FadeIn(step2_note), run_time=0.8)
        self.wait(0.4)

        step3.move_to(center_pos)
        step3_note.next_to(step3, RIGHT, buff=0.4)
        self.play(
            TransformMatchingShapes(step2, step3),
            FadeOut(step2_note), FadeIn(step3_note),
            run_time=0.8,
        )
        self.wait(0.4)

        step4.move_to(center_pos)
        step4_note.next_to(step4, RIGHT, buff=0.4)
        self.play(
            TransformMatchingShapes(step3, step4),
            FadeOut(step3_note), FadeIn(step4_note),
            run_time=0.8,
        )
        self.wait(0.4)

        step5.move_to(center_pos)
        step5_note.next_to(step5, RIGHT, buff=0.4)
        self.play(
            TransformMatchingShapes(step4, step5),
            FadeOut(step4_note), FadeIn(step5_note),
            run_time=0.8,
        )
        self.wait(0.5)

        step5_box = SurroundingRectangle(
            step5, color=GREEN_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(step5_box), run_time=0.4)
        self.wait(0.8)

        # ================================================================
        # WHAT VALUE FOR p-hat?
        # ================================================================
        self.play(
            FadeOut(step5), FadeOut(step5_box), FadeOut(step5_note),
            FadeOut(algebra_header),
            run_time=0.4,
        )

        phat_question = Text(
            "What value for p-hat?", font_size=32, color=YELLOW_3B1B, weight=BOLD,
        )
        phat_question.next_to(subtitle, DOWN, buff=0.35)
        self.play(Write(phat_question), run_time=0.5)
        self.wait(0.3)

        # Two options
        option1 = VGroup(
            Text("Option 1:", font_size=24, color=TEAL_3B1B, weight=BOLD),
            Text("Use a prior guess from a pilot study", font_size=22),
        ).arrange(RIGHT, buff=0.15)

        option2 = VGroup(
            Text("Option 2:", font_size=24, color=PINK_3B1B, weight=BOLD),
            Text("Use p-hat = 0.5  (safe upper bound)", font_size=22, color=PINK_3B1B),
        ).arrange(RIGHT, buff=0.15)

        options = VGroup(option1, option2).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        options.next_to(phat_question, DOWN, buff=0.3)

        self.play(Write(option1), run_time=0.6)
        self.wait(0.3)
        self.play(Write(option2), run_time=0.6)
        self.wait(0.5)

        # ================================================================
        # GRAPH: p-hat(1-p-hat) with max at 0.5
        # ================================================================
        why_text = Text(
            "Why? p-hat(1 - p-hat) is LARGEST at p-hat = 0.5",
            font_size=22, color=GREY_B,
        )
        why_text.next_to(options, DOWN, buff=0.3)
        self.play(Write(why_text), run_time=0.5)

        # Build axes for the parabola
        axes = Axes(
            x_range=[0, 1, 0.1],
            y_range=[0, 0.3, 0.05],
            x_length=6,
            y_length=2.5,
            axis_config={"include_tip": False, "stroke_width": 1.5},
            x_axis_config={"include_numbers": True, "font_size": 16},
            y_axis_config={"include_numbers": True, "font_size": 16},
        )
        axes.shift(DOWN * 1.2)

        x_label = MathTex(r"\hat{p}", font_size=24, color=TEAL_3B1B)
        x_label.next_to(axes.x_axis, DOWN, buff=0.3)
        y_label = MathTex(r"\hat{p}(1-\hat{p})", font_size=22, color=BLUE_3B1B)
        y_label.next_to(axes.y_axis, LEFT, buff=0.15).shift(UP * 0.5)

        # Plot the parabola
        parabola = axes.plot(
            lambda x: x * (1 - x),
            x_range=[0.01, 0.99],
            color=BLUE_3B1B,
            stroke_width=3,
        )

        self.play(Create(axes), Write(x_label), Write(y_label), run_time=0.6)
        self.play(Create(parabola), run_time=1.0)
        self.wait(0.3)

        # Mark the maximum at p-hat = 0.5
        max_dot = Dot(axes.c2p(0.5, 0.25), radius=0.1, color=PINK_3B1B)
        max_label = MathTex(r"\max = 0.25", font_size=22, color=PINK_3B1B)
        max_label.next_to(max_dot, UP, buff=0.15)
        max_dashed = DashedLine(
            axes.c2p(0.5, 0) + DOWN * 0.05, axes.c2p(0.5, 0.25),
            color=PINK_3B1B, stroke_width=2, dash_length=0.06,
        )

        self.play(FadeIn(max_dot), Write(max_label), Create(max_dashed), run_time=0.6)
        self.wait(0.3)

        safe_note = Text(
            "Using 0.5 gives the LARGEST n -- guarantees ME is met",
            font_size=20, color=PINK_3B1B,
        )
        safe_note.next_to(axes, DOWN, buff=0.3)
        self.play(Write(safe_note), run_time=0.6)
        self.wait(1.0)

        # ================================================================
        # TRANSITION: Clear graph, show worked example
        # ================================================================
        graph_stuff = VGroup(
            phat_question, options, why_text,
            axes, x_label, y_label, parabola,
            max_dot, max_label, max_dashed, safe_note,
        )
        self.play(FadeOut(graph_stuff), run_time=0.5)

        # ================================================================
        # WORKED EXAMPLE
        # ================================================================
        ex_header = Text(
            "Worked Example", font_size=32, color=YELLOW_3B1B, weight=BOLD,
        )
        ex_header.next_to(subtitle, DOWN, buff=0.35)
        self.play(Write(ex_header), run_time=0.4)

        ex_givens = VGroup(
            Text("95% confidence", font_size=24, color=PINK_3B1B),
            MathTex(r"\text{ME} \leq 0.04", font_size=28, color=YELLOW_3B1B),
            Text("No prior guess for p-hat", font_size=24, color=GREY_B),
        ).arrange(RIGHT, buff=0.6)
        ex_givens.next_to(ex_header, DOWN, buff=0.25)
        self.play(Write(ex_givens), run_time=0.6)
        self.wait(0.5)

        # Computation
        comp1 = MathTex(
            r"n \geq \hat{p}(1-\hat{p}) \cdot \left(\frac{z^*}{\text{ME}}\right)^2",
            font_size=34,
        )
        comp1.next_to(ex_givens, DOWN, buff=0.35)
        self.play(Write(comp1), run_time=0.7)
        self.wait(0.3)

        comp2 = MathTex(
            r"n \geq 0.5(0.5) \cdot \left(\frac{1.960}{0.04}\right)^2",
            font_size=34,
        )
        comp2.next_to(comp1, DOWN, buff=0.2)
        self.play(Write(comp2), run_time=0.7)
        self.wait(0.3)

        comp3 = MathTex(
            r"n \geq 0.25 \times 2401 = 600.25",
            font_size=34,
        )
        comp3.next_to(comp2, DOWN, buff=0.2)
        self.play(Write(comp3), run_time=0.7)
        self.wait(0.5)

        # Round UP emphasis
        round_up = Text(
            "ALWAYS round UP!", font_size=28, color=RED, weight=BOLD,
        )
        round_up.next_to(comp3, DOWN, buff=0.3)

        result = MathTex(
            r"n = 601", font_size=42, color=GREEN_3B1B,
        )
        result.next_to(round_up, DOWN, buff=0.2)

        self.play(Write(round_up), run_time=0.5)
        self.play(Write(result), run_time=0.5)
        self.wait(0.3)

        result_box = SurroundingRectangle(
            result, color=GREEN_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(result_box), run_time=0.4)
        self.wait(0.5)

        # Emphasize why
        why_round = Text(
            "Rounding down gives ME larger than desired!",
            font_size=20, color=GREY_B,
        )
        why_round.next_to(result_box, DOWN, buff=0.2)
        self.play(Write(why_round), run_time=0.5)
        self.wait(0.8)

        # ================================================================
        # FINAL SUMMARY BOX
        # ================================================================
        self.play(
            FadeOut(ex_header), FadeOut(ex_givens),
            FadeOut(comp1), FadeOut(comp2), FadeOut(comp3),
            FadeOut(round_up), FadeOut(result), FadeOut(result_box),
            FadeOut(why_round),
            FadeOut(title), FadeOut(subtitle),
            run_time=0.5,
        )

        final_lines = VGroup(
            Text("Minimum Sample Size", font_size=34, color=TEAL_3B1B, weight=BOLD),
            Text("", font_size=6),
            MathTex(
                r"n \geq \hat{p}(1-\hat{p}) \cdot \left(\frac{z^*}{\text{ME}}\right)^2",
                font_size=42,
            ),
            Text("", font_size=6),
            Text(
                "No prior guess? Use p-hat = 0.5 (largest n, safe bound)",
                font_size=24, color=PINK_3B1B,
            ),
            Text("", font_size=6),
            Text(
                "ALWAYS round UP!",
                font_size=28, color=RED, weight=BOLD,
            ),
        ).arrange(DOWN, buff=0.12)
        final_lines.move_to(ORIGIN)

        final_box = SurroundingRectangle(
            final_lines, color=YELLOW_3B1B, buff=0.35, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in final_lines],
                lag_ratio=0.15,
            ),
            run_time=2.5,
        )
        self.play(Create(final_box), run_time=0.5)
        self.wait(2.5)

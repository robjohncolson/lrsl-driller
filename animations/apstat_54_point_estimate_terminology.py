"""
Point Estimate Terminology (AP Stats Unit 5, Topic 5.4a)

Teaches the three key terms students must distinguish:
- Parameter (mu): the true population value we want to know
- Point Estimator (x-bar): the method/statistic used to estimate it
- Point Estimate: the specific numerical value computed from a sample

Shows a population, draws a sample, computes x-bar, then labels all three
terms side by side with color coding and a key insight box.

Run with: manim -qm --format=mp4 apstat_54_point_estimate_terminology.py PointEstimateTerminology
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class PointEstimateTerminology(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== PART 1: Title ==========
        title = Text("Point Estimate Terminology", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Parameters, Estimators, and Estimates",
            font_size=24, color=YELLOW_3B1B
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(subtitle))
        self.wait(0.5)

        # ========== PART 2: Population of Student Heights ==========
        pop_label = Text("Population: All Students' Heights", font_size=28, color=BLUE_3B1B)
        pop_label.next_to(subtitle, DOWN, buff=0.4)
        self.play(Write(pop_label))

        # Create a cloud of dots representing the population
        pop_size = 60
        pop_values = np.round(np.random.normal(loc=66.5, scale=3.5, size=pop_size), 1)
        pop_values = np.clip(pop_values, 57.0, 76.0)
        pop_mean = np.mean(pop_values)

        dots = VGroup()
        for i in range(pop_size):
            row = i // 12
            col = i % 12
            x = (col - 5.5) * 0.5
            y = (2 - row) * 0.5 - 0.8

            # Color gradient: shorter = blue, taller = pink
            t = (pop_values[i] - 57.0) / (76.0 - 57.0)
            color = interpolate_color(ManimColor(BLUE_3B1B), ManimColor(PINK_3B1B), t)

            dot = Dot(
                point=RIGHT * x + UP * y,
                radius=0.12,
                color=color,
                fill_opacity=0.7
            )
            dots.add(dot)

        dots.next_to(pop_label, DOWN, buff=0.3)

        self.play(
            LaggedStart(*[FadeIn(d, scale=0.5) for d in dots], lag_ratio=0.015),
            run_time=1.0
        )
        self.wait(0.3)

        # Show the unknown parameter mu
        mu_text = MathTex(r"\mu", r"= \text{ ???}", font_size=36)
        mu_text[0].set_color(YELLOW_3B1B)
        mu_text[1].set_color(GRAY)
        mu_text.next_to(dots, RIGHT, buff=0.6)

        mu_note = Text("(unknown true mean)", font_size=18, color=GRAY)
        mu_note.next_to(mu_text, DOWN, buff=0.1)

        self.play(Write(mu_text), Write(mu_note))
        self.wait(0.5)

        # ========== PART 3: Take a Sample ==========
        sample_size = 8
        sample_indices = np.random.choice(pop_size, size=sample_size, replace=False)
        sample_vals = pop_values[sample_indices]
        sample_mean = np.mean(sample_vals)

        # Highlight the sampled dots
        rings = VGroup()
        for idx in sample_indices:
            ring = Circle(
                radius=0.18,
                color=GREEN_3B1B,
                stroke_width=3
            )
            ring.move_to(dots[idx].get_center())
            rings.add(ring)

        sample_label = Text(f"Sample (n = {sample_size})", font_size=22, color=GREEN_3B1B)
        sample_label.next_to(dots, LEFT, buff=0.5)

        self.play(
            Write(sample_label),
            LaggedStart(*[Create(ring) for ring in rings], lag_ratio=0.06),
            run_time=0.8
        )
        self.wait(0.3)

        # Compute x-bar
        xbar_text = VGroup(
            MathTex(r"\bar{x}", r"=", f"{sample_mean:.1f}", font_size=32),
            Text("inches", font_size=22),
        ).arrange(RIGHT, buff=0.15)
        xbar_text[0][0].set_color(TEAL_3B1B)
        xbar_text[0][2].set_color(GREEN_3B1B)
        xbar_text.next_to(dots, DOWN, buff=0.5)

        self.play(Write(xbar_text))
        self.wait(0.8)

        # ========== PART 4: Clear and Label the Three Terms ==========
        self.play(
            FadeOut(subtitle),
            FadeOut(pop_label),
            FadeOut(dots),
            FadeOut(rings),
            FadeOut(mu_text),
            FadeOut(mu_note),
            FadeOut(sample_label),
            FadeOut(xbar_text),
            title.animate.scale(0.75).to_edge(UP, buff=0.2),
            run_time=0.7
        )

        # --- Term 1: Parameter ---
        param_header = Text("PARAMETER", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        param_symbol = MathTex(r"\mu", font_size=44, color=YELLOW_3B1B)
        param_desc = Text("The true population\nvalue we want to know", font_size=20, color=GRAY)
        param_desc.set_line_spacing(1.3)
        param_example = Text("(mean height of ALL students)", font_size=18, color=YELLOW_3B1B)

        param_group = VGroup(param_header, param_symbol, param_desc, param_example)
        param_group.arrange(DOWN, buff=0.15)
        param_group.move_to(LEFT * 4.2 + DOWN * 0.5)

        param_box = SurroundingRectangle(
            param_group, color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
            stroke_width=2
        )

        self.play(
            LaggedStart(
                Write(param_header),
                Write(param_symbol),
                Write(param_desc),
                Write(param_example),
                lag_ratio=0.2
            ),
            run_time=1.2
        )
        self.play(Create(param_box), run_time=0.4)
        self.wait(0.3)

        # --- Term 2: Point Estimator ---
        est_header = Text("POINT ESTIMATOR", font_size=28, color=TEAL_3B1B, weight=BOLD)
        est_symbol = MathTex(r"\bar{x}", font_size=44, color=TEAL_3B1B)
        est_desc = Text("The method / statistic\nused to estimate", font_size=20, color=GRAY)
        est_desc.set_line_spacing(1.3)
        est_example = Text("(the sample mean formula)", font_size=18, color=TEAL_3B1B)

        est_group = VGroup(est_header, est_symbol, est_desc, est_example)
        est_group.arrange(DOWN, buff=0.15)
        est_group.move_to(DOWN * 0.5)

        est_box = SurroundingRectangle(
            est_group, color=TEAL_3B1B, buff=0.2, corner_radius=0.1,
            stroke_width=2
        )

        self.play(
            LaggedStart(
                Write(est_header),
                Write(est_symbol),
                Write(est_desc),
                Write(est_example),
                lag_ratio=0.2
            ),
            run_time=1.2
        )
        self.play(Create(est_box), run_time=0.4)
        self.wait(0.3)

        # --- Term 3: Point Estimate ---
        val_header = Text("POINT ESTIMATE", font_size=28, color=GREEN_3B1B, weight=BOLD)
        val_symbol = Text(f"{sample_mean:.1f} in.", font_size=40, color=GREEN_3B1B, weight=BOLD)
        val_desc = Text("The specific number\ncalculated from data", font_size=20, color=GRAY)
        val_desc.set_line_spacing(1.3)
        val_example = Text("(one sample's result)", font_size=18, color=GREEN_3B1B)

        val_group = VGroup(val_header, val_symbol, val_desc, val_example)
        val_group.arrange(DOWN, buff=0.15)
        val_group.move_to(RIGHT * 4.2 + DOWN * 0.5)

        val_box = SurroundingRectangle(
            val_group, color=GREEN_3B1B, buff=0.2, corner_radius=0.1,
            stroke_width=2
        )

        self.play(
            LaggedStart(
                Write(val_header),
                Write(val_symbol),
                Write(val_desc),
                Write(val_example),
                lag_ratio=0.2
            ),
            run_time=1.2
        )
        self.play(Create(val_box), run_time=0.4)
        self.wait(0.5)

        # ========== PART 5: Connecting Arrows ==========
        arrow_1 = Arrow(
            est_box.get_left() + LEFT * 0.05,
            param_box.get_right() + RIGHT * 0.05,
            color=WHITE, stroke_width=2, buff=0.1,
            max_tip_length_to_length_ratio=0.15
        )
        arrow_1_label = Text("estimates", font_size=18, color=GRAY)
        arrow_1_label.next_to(arrow_1, UP, buff=0.05)

        arrow_2 = Arrow(
            est_box.get_right() + RIGHT * 0.05,
            val_box.get_left() + LEFT * 0.05,
            color=WHITE, stroke_width=2, buff=0.1,
            max_tip_length_to_length_ratio=0.15
        )
        arrow_2_label = Text("produces", font_size=18, color=GRAY)
        arrow_2_label.next_to(arrow_2, UP, buff=0.05)

        self.play(
            GrowArrow(arrow_1), Write(arrow_1_label),
            GrowArrow(arrow_2), Write(arrow_2_label),
            run_time=0.8
        )
        self.wait(0.8)

        # ========== PART 6: Key Insight Box ==========
        self.play(
            FadeOut(param_group), FadeOut(param_box),
            FadeOut(est_group), FadeOut(est_box),
            FadeOut(val_group), FadeOut(val_box),
            FadeOut(arrow_1), FadeOut(arrow_1_label),
            FadeOut(arrow_2), FadeOut(arrow_2_label),
            FadeOut(title),
            run_time=0.6
        )

        insight_content = VGroup(
            Text("Key Idea", font_size=32, color=YELLOW_3B1B, weight=BOLD),
            Text(
                "A sample statistic is a point estimator",
                font_size=26
            ),
            Text(
                "of the corresponding population parameter.",
                font_size=26
            ),
            VGroup(
                MathTex(r"\bar{x}", font_size=32, color=TEAL_3B1B),
                Text("  estimates  ", font_size=24),
                MathTex(r"\mu", font_size=32, color=YELLOW_3B1B),
            ).arrange(RIGHT, buff=0.15),
            VGroup(
                MathTex(r"\hat{p}", font_size=32, color=TEAL_3B1B),
                Text("  estimates  ", font_size=24),
                MathTex(r"p", font_size=32, color=YELLOW_3B1B),
            ).arrange(RIGHT, buff=0.15),
        ).arrange(DOWN, buff=0.25)
        insight_content.move_to(ORIGIN)

        box = SurroundingRectangle(
            insight_content, color=YELLOW_3B1B, buff=0.35, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.3,
            ),
            run_time=2.5,
        )
        self.play(Create(box))
        self.wait(0.5)

        # Final reminder
        reminder = Text(
            "Estimator = the method     Estimate = the number",
            font_size=22, color=GRAY
        )
        reminder.next_to(box, DOWN, buff=0.4)
        self.play(Write(reminder))
        self.wait(2)

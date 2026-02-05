"""
Inverse Normal: From Area to Value (AP Stats Unit 5, Topic 5.2c)

Demonstrates the inverse normal problem: given a tail area (probability),
find the corresponding x-value. Uses SAT scores as a concrete example.
Visually contrasts forward (value -> area) vs inverse (area -> value).

Run with:
    manim -qm --format=mp4 inverse_normal_cutoff.py InverseNormalCutoff
"""

from manim import *
import numpy as np


class InverseNormalCutoff(Scene):
    def construct(self):
        # Parameters: SAT scores
        mu = 500
        sigma = 100
        top_pct = 0.10
        z_cutoff = 1.28  # z for 90th percentile
        x_cutoff = mu + z_cutoff * sigma  # 628

        # Color scheme
        CURVE_COLOR = BLUE
        TAIL_COLOR = RED
        CUTOFF_COLOR = YELLOW
        FORMULA_COLOR = GREEN

        # Normal PDF
        def normal_pdf(x):
            return (1.0 / (sigma * np.sqrt(2 * np.pi))) * \
                   np.exp(-0.5 * ((x - mu) / sigma) ** 2)

        # ========== TITLE ==========
        title = Text("Inverse Normal: Finding the Cutoff", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # ========== CONTEXT ==========
        context = VGroup(
            Text("SAT Scores", font_size=28, color=GRAY),
            Text("X ~ N(\u03bc = 500, \u03c3 = 100)", font_size=30),
        ).arrange(DOWN, buff=0.15)
        context.next_to(title, DOWN, buff=0.3)
        self.play(FadeIn(context))
        self.wait(0.5)

        # ========== THE QUESTION ==========
        question = Text(
            "What score marks the top 10%?",
            font_size=32, color=CUTOFF_COLOR, weight=BOLD
        )
        question.next_to(context, DOWN, buff=0.4)
        self.play(Write(question))
        self.wait(0.8)

        # Move context up and clear question space
        self.play(
            FadeOut(context),
            FadeOut(question),
        )

        # ========== DRAW NORMAL CURVE ==========
        x_min = mu - 3.5 * sigma  # 150
        x_max = mu + 3.5 * sigma  # 850

        axes = Axes(
            x_range=[x_min, x_max, sigma],
            y_range=[0, 0.005, 0.001],
            x_length=10,
            y_length=3.5,
            axis_config={"include_tip": False, "include_numbers": False},
        )
        axes.shift(DOWN * 0.6)

        # Custom x-axis labels
        x_labels = VGroup()
        x_ticks = VGroup()
        for k in range(-3, 4):
            val = mu + k * sigma
            label = Text(str(int(val)), font_size=16)
            label.next_to(axes.c2p(val, 0), DOWN, buff=0.15)
            x_labels.add(label)
            tick = Line(
                axes.c2p(val, -0.00008), axes.c2p(val, 0.00008),
                color=WHITE, stroke_width=2
            )
            x_ticks.add(tick)

        curve = axes.plot(
            normal_pdf,
            x_range=[x_min, x_max, 1],
            color=CURVE_COLOR,
            stroke_width=3
        )

        # Parameter labels
        param_label = Text(
            "\u03bc = 500, \u03c3 = 100",
            font_size=24
        )
        param_label.to_corner(UL, buff=0.5).shift(DOWN * 0.7)

        self.play(
            Create(axes),
            Create(curve),
            FadeIn(x_labels),
            FadeIn(x_ticks),
            Write(param_label),
            run_time=1.5
        )
        self.wait(0.3)

        # ========== STEP 1: SHADE THE RIGHT TAIL (what we KNOW) ==========
        step1_label = Text(
            "Step 1: We KNOW the area (10%)",
            font_size=24, color=TAIL_COLOR
        )
        step1_label.to_edge(RIGHT, buff=0.5).shift(UP * 2.5)
        self.play(Write(step1_label))
        self.wait(0.3)

        # Shade the right tail
        tail_area = axes.get_area(
            curve,
            x_range=[x_cutoff, x_max],
            color=TAIL_COLOR,
            opacity=0.5
        )
        self.play(FadeIn(tail_area), run_time=1)

        # Label the tail
        tail_label = Text(
            "Area = 0.10",
            font_size=24, color=TAIL_COLOR
        )
        tail_label.move_to(axes.c2p(x_cutoff + 80, 0.0008))
        tail_arrow = Arrow(
            tail_label.get_bottom(),
            axes.c2p(x_cutoff + 40, 0.0003),
            buff=0.05, color=TAIL_COLOR, stroke_width=2
        )
        self.play(Write(tail_label), Create(tail_arrow))
        self.wait(0.3)

        # Also label the left area
        left_label = Text(
            "Area to left = 0.90",
            font_size=22, color=BLUE
        )
        left_label.move_to(axes.c2p(mu - 60, 0.002))
        self.play(Write(left_label))
        self.wait(0.5)

        # Add the question mark at the cutoff
        q_mark = Text("?", font_size=40, color=CUTOFF_COLOR, weight=BOLD)
        q_mark.next_to(axes.c2p(x_cutoff, 0), DOWN, buff=0.5)
        q_arrow = Arrow(
            q_mark.get_top(),
            axes.c2p(x_cutoff, 0) + UP * 0.05,
            buff=0.05, color=CUTOFF_COLOR, stroke_width=2
        )
        self.play(Write(q_mark), Create(q_arrow))
        self.wait(0.5)

        # ========== STEP 2: Z-TABLE LOOKUP ==========
        self.play(FadeOut(step1_label))

        step2_label = Text(
            "Step 2: Find z from the table",
            font_size=24, color=CUTOFF_COLOR
        )
        step2_label.to_edge(RIGHT, buff=0.5).shift(UP * 2.5)
        self.play(Write(step2_label))
        self.wait(0.3)

        z_lookup = VGroup(
            Text("Left area = 0.90", font_size=22),
            Text("\u21d2", font_size=28),
            Text("z = 1.28", font_size=28, color=CUTOFF_COLOR),
        ).arrange(RIGHT, buff=0.3)
        z_lookup.next_to(step2_label, DOWN, buff=0.3)
        self.play(Write(z_lookup))
        self.wait(0.5)

        # ========== STEP 3: CONVERT BACK TO X ==========
        self.play(FadeOut(step2_label))

        step3_label = Text(
            "Step 3: Convert z to x",
            font_size=24, color=FORMULA_COLOR
        )
        step3_label.to_edge(RIGHT, buff=0.5).shift(UP * 2.5)
        self.play(Write(step3_label))
        self.wait(0.3)

        # The unstandardizing formula
        formula = Text(
            "x = \u03bc + z \u00b7 \u03c3",
            font_size=32
        )
        formula.next_to(z_lookup, DOWN, buff=0.4)
        self.play(Write(formula))
        self.wait(0.3)

        # Plug in numbers
        formula_sub = Text(
            "= 500 + 1.28 \u00d7 100",
            font_size=30
        )
        formula_sub.next_to(formula, DOWN, buff=0.2)
        self.play(Write(formula_sub))
        self.wait(0.3)

        formula_result = Text(
            "= 628",
            font_size=34, color=FORMULA_COLOR
        )
        formula_result.next_to(formula_sub, DOWN, buff=0.2)
        self.play(Write(formula_result))
        self.wait(0.5)

        # ========== MARK THE CUTOFF ON THE CURVE ==========
        # Replace question mark with the actual value
        cutoff_line = DashedLine(
            axes.c2p(x_cutoff, 0),
            axes.c2p(x_cutoff, normal_pdf(x_cutoff)),
            color=CUTOFF_COLOR, stroke_width=3
        )
        cutoff_value = Text("628", font_size=22, color=CUTOFF_COLOR, weight=BOLD)
        cutoff_value.next_to(axes.c2p(x_cutoff, 0), DOWN, buff=0.5)

        self.play(
            FadeOut(q_mark),
            FadeOut(q_arrow),
            Create(cutoff_line),
            Write(cutoff_value),
            run_time=0.8
        )
        self.wait(0.5)

        # Highlight the answer on the curve
        cutoff_dot = Dot(axes.c2p(x_cutoff, 0), color=CUTOFF_COLOR, radius=0.08)
        self.play(FadeIn(cutoff_dot))
        self.wait(0.3)

        # ========== VISUAL CONTRAST: FORWARD VS INVERSE ==========
        # Clear the right-side computations
        self.play(
            FadeOut(step3_label),
            FadeOut(z_lookup),
            FadeOut(formula),
            FadeOut(formula_sub),
            FadeOut(formula_result),
            FadeOut(tail_label),
            FadeOut(tail_arrow),
            FadeOut(left_label),
        )
        self.wait(0.3)

        # Two-row comparison
        contrast_title = Text(
            "Two Directions", font_size=26, weight=BOLD, color=WHITE
        )
        contrast_title.to_edge(RIGHT, buff=1).shift(UP * 2.5)
        self.play(Write(contrast_title))

        # Forward: value -> area
        forward_label = Text("Normal:", font_size=22, color=BLUE, weight=BOLD)
        forward_arrow_group = VGroup(
            Text("value", font_size=20, color=BLUE),
            Text("\u2192", font_size=28, color=BLUE),
            Text("area", font_size=20, color=BLUE),
        ).arrange(RIGHT, buff=0.2)
        forward_row = VGroup(forward_label, forward_arrow_group).arrange(
            RIGHT, buff=0.3
        )
        forward_row.next_to(contrast_title, DOWN, buff=0.4)

        self.play(Write(forward_row))
        self.wait(0.3)

        # Inverse: area -> value
        inverse_label = Text("Inverse:", font_size=22, color=TAIL_COLOR, weight=BOLD)
        inverse_arrow_group = VGroup(
            Text("area", font_size=20, color=TAIL_COLOR),
            Text("\u2192", font_size=28, color=TAIL_COLOR),
            Text("value", font_size=20, color=TAIL_COLOR),
        ).arrange(RIGHT, buff=0.2)
        inverse_row = VGroup(inverse_label, inverse_arrow_group).arrange(
            RIGHT, buff=0.3
        )
        inverse_row.next_to(forward_row, DOWN, buff=0.3)

        self.play(Write(inverse_row))
        self.wait(0.5)

        # Highlight the inverse row (that's what we just did)
        highlight_box = SurroundingRectangle(
            inverse_row, color=CUTOFF_COLOR, buff=0.15, corner_radius=0.1
        )
        self.play(Create(highlight_box))
        self.wait(0.5)

        # ========== KEY INSIGHT BOX ==========
        self.play(
            FadeOut(contrast_title),
            FadeOut(forward_row),
            FadeOut(inverse_row),
            FadeOut(highlight_box),
        )

        insight_text = Text(
            "Inverse Normal: Start with area, find the value",
            font_size=30, weight=BOLD, color=CUTOFF_COLOR
        )
        insight_box = SurroundingRectangle(
            insight_text, color=CUTOFF_COLOR, buff=0.25, corner_radius=0.1
        )
        insight_group = VGroup(insight_box, insight_text)
        insight_group.to_edge(RIGHT, buff=0.3).shift(UP * 1.8)

        self.play(Create(insight_box), Write(insight_text))
        self.wait(0.5)

        # Final answer line
        final_answer = Text(
            "Top 10% of SAT scores: x \u2265 628",
            font_size=28, color=FORMULA_COLOR
        )
        final_answer.next_to(insight_group, DOWN, buff=0.4)
        self.play(Write(final_answer))
        self.wait(2)

        # Fade out
        self.play(
            *[FadeOut(mob) for mob in self.mobjects]
        )
        self.wait(0.5)

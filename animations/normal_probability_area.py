"""
Normal Probability as Area Under the Curve (AP Stats Unit 5, Topic 5.2b)

Draws a normal distribution curve, calculates a z-score from a concrete
example (women's heights), shades the area in the right tail, and
demonstrates that area under the curve equals probability equals proportion.

Run with:
    manim -qm --format=mp4 normal_probability_area.py NormalProbabilityArea
"""

from manim import *
import numpy as np


class NormalProbabilityArea(Scene):
    def construct(self):
        # Parameters
        mu = 64.5
        sigma = 2.5
        x_query = 69

        # Color scheme
        CURVE_COLOR = BLUE
        SHADE_COLOR = RED
        Z_COLOR = YELLOW
        PROB_COLOR = GREEN

        # ========== TITLE ==========
        title = Text("Normal Probability as Area", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # ========== CONTEXT ==========
        context = Text(
            "Heights of adult women (inches)",
            font_size=28, color=GRAY
        )
        context.next_to(title, DOWN, buff=0.2)
        self.play(FadeIn(context))
        self.wait(0.3)

        params = Text(
            "X ~ N(μ = 64.5, σ = 2.5)",
            font_size=32
        )
        params.next_to(context, DOWN, buff=0.3)
        self.play(Write(params))
        self.wait(0.5)

        # Move context to corner
        self.play(
            FadeOut(context),
            params.animate.scale(0.7).to_corner(UL, buff=0.5).shift(DOWN * 0.7)
        )

        # ========== DRAW NORMAL CURVE ==========
        # Axes: show roughly mu-4*sigma to mu+4*sigma in x
        x_min = mu - 4 * sigma  # 54.5
        x_max = mu + 4 * sigma  # 74.5

        axes = Axes(
            x_range=[x_min, x_max, sigma],
            y_range=[0, 0.2, 0.05],
            x_length=10,
            y_length=3.5,
            axis_config={"include_tip": False, "include_numbers": False},
        )
        axes.shift(DOWN * 0.5)

        # Custom x-axis labels at mu - 3sigma, mu - 2sigma, ..., mu + 3sigma
        x_labels = VGroup()
        for k in range(-3, 4):
            val = mu + k * sigma
            label = Text(f"{val:.0f}" if val == int(val) else f"{val:.1f}",
                         font_size=16)
            label.next_to(axes.c2p(val, 0), DOWN, buff=0.15)
            x_labels.add(label)

        # Tick marks
        x_ticks = VGroup()
        for k in range(-3, 4):
            val = mu + k * sigma
            tick = Line(
                axes.c2p(val, -0.003), axes.c2p(val, 0.003),
                color=WHITE, stroke_width=2
            )
            x_ticks.add(tick)

        # Normal PDF function
        def normal_pdf(x):
            return (1.0 / (sigma * np.sqrt(2 * np.pi))) * \
                   np.exp(-0.5 * ((x - mu) / sigma) ** 2)

        # Draw the curve
        curve = axes.plot(
            normal_pdf,
            x_range=[x_min, x_max, 0.1],
            color=CURVE_COLOR,
            stroke_width=3
        )

        self.play(Create(axes), run_time=0.5)
        self.play(
            Create(curve),
            FadeIn(x_labels),
            FadeIn(x_ticks),
            run_time=1.5
        )
        self.wait(0.3)

        # Label mu on axis
        mu_label = Text("μ", font_size=28, color=BLUE)
        mu_label.next_to(axes.c2p(mu, 0), DOWN, buff=0.5)
        mu_arrow = Arrow(
            mu_label.get_top(),
            axes.c2p(mu, 0) + UP * 0.05,
            buff=0.05, color=BLUE, stroke_width=2
        )
        self.play(Write(mu_label), Create(mu_arrow))
        self.wait(0.3)

        # Show sigma bracket
        sigma_brace = BraceBetweenPoints(
            axes.c2p(mu, normal_pdf(mu)),
            axes.c2p(mu + sigma, normal_pdf(mu)),
            direction=UP, color=YELLOW
        )
        sigma_label = Text("σ = 2.5", font_size=22, color=YELLOW)
        sigma_label.next_to(sigma_brace, UP, buff=0.1)

        self.play(Create(sigma_brace), Write(sigma_label))
        self.wait(0.5)
        self.play(FadeOut(sigma_brace), FadeOut(sigma_label))

        # ========== POSE THE QUESTION ==========
        question = Text(
            "What is P(X > 69)?",
            font_size=36, color=Z_COLOR, weight=BOLD
        )
        question.to_edge(RIGHT, buff=0.8).shift(UP * 2.5)
        self.play(Write(question))
        self.wait(0.5)

        # Mark x = 69 on the axis
        query_line = DashedLine(
            axes.c2p(x_query, 0),
            axes.c2p(x_query, normal_pdf(x_query)),
            color=Z_COLOR, stroke_width=2
        )
        query_dot = Dot(axes.c2p(x_query, 0), color=Z_COLOR, radius=0.06)
        query_label = Text("69", font_size=20, color=Z_COLOR)
        query_label.next_to(query_dot, DOWN, buff=0.15)

        self.play(
            Create(query_line),
            FadeIn(query_dot),
            Write(query_label)
        )
        self.wait(0.5)

        # ========== Z-SCORE CALCULATION ==========
        z_title = Text("Step 1: Calculate z-score", font_size=24, color=Z_COLOR)
        z_title.to_edge(RIGHT, buff=0.5).shift(UP * 1.5)
        self.play(Write(z_title))
        self.wait(0.3)

        z_formula = Text(
            "z = (x - μ) / σ",
            font_size=30
        )
        z_formula.next_to(z_title, DOWN, buff=0.3)
        self.play(Write(z_formula))
        self.wait(0.3)

        z_calc = Text(
            "= (69 - 64.5) / 2.5",
            font_size=30
        )
        z_calc.next_to(z_formula, DOWN, buff=0.2)
        self.play(Write(z_calc))
        self.wait(0.3)

        z_result = Text(
            "= 1.8",
            font_size=34, color=Z_COLOR
        )
        z_result.next_to(z_calc, DOWN, buff=0.2)
        self.play(Write(z_result))
        self.wait(0.5)

        # ========== SHADE THE AREA ==========
        shade_title = Text("Step 2: Find the area", font_size=24, color=SHADE_COLOR)
        shade_title.next_to(z_result, DOWN, buff=0.5)
        self.play(Write(shade_title))
        self.wait(0.3)

        # Create the shaded region to the RIGHT of x = 69
        shaded_area = axes.get_area(
            curve,
            x_range=[x_query, x_max],
            color=SHADE_COLOR,
            opacity=0.5
        )

        # Animate the shading growing from the query line outward
        self.play(FadeIn(shaded_area), run_time=1.5)
        self.wait(0.5)

        # ========== SHOW PROBABILITY ==========
        prob_text = Text(
            "P(X > 69) = 0.0359",
            font_size=30, color=PROB_COLOR
        )
        prob_text.next_to(shade_title, DOWN, buff=0.3)
        self.play(Write(prob_text))
        self.wait(0.5)

        # Point to the shaded area with a label inside
        area_label = Text(
            "≈ 3.6%",
            font_size=24, color=WHITE
        )
        # Position label inside/near the shaded region
        area_label.move_to(axes.c2p(x_query + 1.8, 0.025))
        area_arrow = Arrow(
            area_label.get_left(),
            axes.c2p(x_query + 0.5, 0.015),
            buff=0.05, color=WHITE, stroke_width=2
        )

        self.play(Write(area_label), Create(area_arrow))
        self.wait(0.5)

        # ========== VISUAL CONCEPT: AREA = PROBABILITY = PROPORTION ==========
        # Clear the right-side calculations
        self.play(
            FadeOut(question),
            FadeOut(z_title),
            FadeOut(z_formula),
            FadeOut(z_calc),
            FadeOut(z_result),
            FadeOut(shade_title),
            FadeOut(prob_text),
            FadeOut(area_label),
            FadeOut(area_arrow),
            FadeOut(mu_label),
            FadeOut(mu_arrow),
        )
        self.wait(0.3)

        # Show the triple equivalence
        equiv_title = Text("The Big Idea", font_size=28, weight=BOLD, color=Z_COLOR)
        equiv_title.to_edge(RIGHT, buff=1.2).shift(UP * 2)
        self.play(Write(equiv_title))

        # Three concepts connected with = signs
        concept_area = Text("Shaded Area", font_size=24, color=SHADE_COLOR)
        equals1 = Text("=", font_size=30)
        concept_prob = Text("Probability", font_size=24, color=PROB_COLOR)
        equals2 = Text("=", font_size=30)
        concept_prop = Text("Proportion", font_size=24, color=BLUE)

        equiv_group = VGroup(
            concept_area, equals1, concept_prob, equals2, concept_prop
        ).arrange(DOWN, buff=0.2)
        equiv_group.next_to(equiv_title, DOWN, buff=0.4)

        for item in equiv_group:
            self.play(FadeIn(item), run_time=0.4)
            self.wait(0.2)

        self.wait(0.5)

        # Flash the shaded area to reinforce connection
        self.play(
            shaded_area.animate.set_opacity(0.8),
            run_time=0.3
        )
        self.play(
            shaded_area.animate.set_opacity(0.5),
            run_time=0.3
        )
        self.wait(0.3)

        # ========== KEY INSIGHT BOX ==========
        # Clear equivalence for final insight
        self.play(
            FadeOut(equiv_title),
            FadeOut(equiv_group),
        )

        insight_text = Text(
            "Area under the curve = Probability",
            font_size=32, weight=BOLD, color=Z_COLOR
        )
        insight_box = SurroundingRectangle(
            insight_text, color=Z_COLOR, buff=0.25, corner_radius=0.1
        )

        insight_group = VGroup(insight_box, insight_text)
        insight_group.to_edge(RIGHT, buff=0.5).shift(UP * 1.5)

        self.play(Create(insight_box), Write(insight_text))
        self.wait(0.5)

        # Show the complete answer below the insight
        final_answer = Text(
            "P(X > 69) = P(z > 1.8) ≈ 0.0359",
            font_size=28
        )
        final_answer.next_to(insight_group, DOWN, buff=0.4)

        self.play(Write(final_answer))
        self.wait(2)

        # Fade out
        self.play(
            *[FadeOut(mob) for mob in self.mobjects]
        )
        self.wait(0.5)

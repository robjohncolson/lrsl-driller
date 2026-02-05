"""
Z-Score Calculation on a Number Line (Unit 5, Topic 5.2a)

Shows a normal curve with dual number lines (raw values and z-scores),
picks a specific value, animates the z-score formula with actual numbers,
and visually demonstrates that z tells you "how many SDs from the mean."

Run with: manim -qm --format=mp4 z_score_number_line.py ZScoreNumberLine
"""
from manim import *
import numpy as np


class ZScoreNumberLine(Scene):
    def construct(self):
        # Parameters for our normal distribution
        mu = 72       # mean exam score
        sigma = 8     # standard deviation
        x_val = 88    # the value we will compute z for

        # ========== PART 1: Title ==========
        title = Text("Z-Scores: How Far from the Mean?", font_size=40)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # Context
        context = Text(
            "Exam scores: mean = 72, SD = 8",
            font_size=24,
            color=GRAY
        )
        context.next_to(title, DOWN, buff=0.2)
        self.play(Write(context))
        self.wait(0.3)

        # ========== PART 2: Draw the Normal Curve ==========
        # Create axes (hidden) for plotting
        axes = Axes(
            x_range=[mu - 4 * sigma, mu + 4 * sigma, sigma],
            y_range=[0, 0.06, 0.01],
            x_length=11,
            y_length=3.0,
            axis_config={"include_tip": False},
        )
        axes.shift(UP * 0.3)

        # Normal curve
        curve = axes.plot(
            lambda x: (1 / (sigma * np.sqrt(2 * np.pi))) *
                       np.exp(-0.5 * ((x - mu) / sigma) ** 2),
            x_range=[mu - 3.5 * sigma, mu + 3.5 * sigma],
            color=WHITE,
            stroke_width=3
        )

        # Fill below mean in blue, above mean in red
        left_area = axes.get_area(
            curve,
            x_range=[mu - 3.5 * sigma, mu],
            color=BLUE,
            opacity=0.25
        )
        right_area = axes.get_area(
            curve,
            x_range=[mu, mu + 3.5 * sigma],
            color=RED,
            opacity=0.25
        )

        self.play(
            Create(curve),
            FadeIn(left_area),
            FadeIn(right_area),
            run_time=1.2
        )
        self.wait(0.3)

        # ========== PART 3: Raw Value Number Line ==========
        # Draw the x-axis as a number line with raw values
        raw_line = NumberLine(
            x_range=[mu - 3 * sigma, mu + 3 * sigma + 0.1, sigma],
            length=10,
            include_numbers=False,
            color=WHITE,
            stroke_width=2
        )
        raw_line.next_to(curve, DOWN, buff=0.15)
        raw_line.move_to(axes.c2p(mu, 0), coor_mask=np.array([1, 0, 0]))

        # Add tick marks and labels for mu-3sigma through mu+3sigma
        raw_labels = VGroup()
        for i in range(-3, 4):
            val = mu + i * sigma
            tick_pos = raw_line.n2p(val)
            tick = Line(
                tick_pos + UP * 0.1,
                tick_pos + DOWN * 0.1,
                color=WHITE,
                stroke_width=2
            )
            label = Text(str(val), font_size=18)
            label.next_to(tick, DOWN, buff=0.1)

            # Highlight the mean
            if i == 0:
                label.set_color(YELLOW)
                mu_marker = Text("μ", font_size=24, color=YELLOW)
                mu_marker.next_to(label, DOWN, buff=0.05)
                raw_labels.add(tick, label, mu_marker)
            else:
                raw_labels.add(tick, label)

        self.play(Create(raw_line), Write(raw_labels), run_time=0.8)
        self.wait(0.3)

        # ========== PART 4: Z-Score Number Line (dual axis) ==========
        z_line = NumberLine(
            x_range=[-3, 3.1, 1],
            length=10,
            include_numbers=False,
            color=GREEN,
            stroke_width=2
        )
        z_line.next_to(raw_line, DOWN, buff=0.6)
        # Align so z=0 is directly below the raw mean
        z_line.move_to(raw_line.n2p(mu), coor_mask=np.array([1, 0, 0]))

        z_title = Text("z-score:", font_size=20, color=GREEN)
        z_title.next_to(z_line, LEFT, buff=0.3)

        z_labels = VGroup()
        for i in range(-3, 4):
            tick_pos = z_line.n2p(i)
            tick = Line(
                tick_pos + UP * 0.1,
                tick_pos + DOWN * 0.1,
                color=GREEN,
                stroke_width=2
            )
            label = Text(str(i), font_size=18, color=GREEN)
            label.next_to(tick, DOWN, buff=0.1)
            z_labels.add(tick, label)

        self.play(Create(z_line), Write(z_title), Write(z_labels), run_time=0.8)

        # Draw dashed vertical connectors between the two number lines
        connectors = VGroup()
        for i in range(-3, 4):
            raw_pos = raw_line.n2p(mu + i * sigma)
            z_pos = z_line.n2p(i)
            connector = DashedLine(
                raw_pos + DOWN * 0.15,
                z_pos + UP * 0.15,
                color=GRAY,
                stroke_width=1,
                dash_length=0.05
            )
            connectors.add(connector)

        self.play(
            LaggedStart(*[Create(c) for c in connectors], lag_ratio=0.05),
            run_time=0.6
        )
        self.wait(0.5)

        # ========== PART 5: Pick a Value x and Show It ==========
        # Mark x = 88 on the curve
        x_pos_raw = raw_line.n2p(x_val)
        x_dot = Dot(x_pos_raw, color=YELLOW, radius=0.1)
        x_label = Text(
            f"x = {x_val}",
            font_size=24,
            color=YELLOW
        )
        x_label.next_to(x_dot, UP, buff=0.3)

        # Vertical line from curve to number line
        curve_y = (1 / (sigma * np.sqrt(2 * np.pi))) * \
                  np.exp(-0.5 * ((x_val - mu) / sigma) ** 2)
        x_vline = DashedLine(
            axes.c2p(x_val, curve_y),
            axes.c2p(x_val, 0),
            color=YELLOW,
            stroke_width=2
        )

        self.play(
            Create(x_vline),
            FadeIn(x_dot, scale=1.5),
            Write(x_label),
            run_time=0.8
        )
        self.wait(0.5)

        # ========== PART 6: Show the Distance as sigma-lengths ==========
        # Draw a brace from mu to x showing the distance
        mu_pos = raw_line.n2p(mu)
        brace = BraceBetweenPoints(
            mu_pos + UP * 0.25,
            x_pos_raw + UP * 0.25,
            direction=UP,
            color=ORANGE
        )
        distance_label = Text(
            f"{x_val} - {mu} = {x_val - mu}",
            font_size=22,
            color=ORANGE
        )
        distance_label.next_to(brace, UP, buff=0.1)

        self.play(Create(brace), Write(distance_label))
        self.wait(0.5)

        # Show sigma-length markers
        sigma_braces = VGroup()
        sigma_labels_group = VGroup()
        for i in range(int((x_val - mu) / sigma)):
            left_pt = raw_line.n2p(mu + i * sigma) + DOWN * 0.15
            right_pt = raw_line.n2p(mu + (i + 1) * sigma) + DOWN * 0.15
            s_brace = BraceBetweenPoints(
                left_pt, right_pt,
                direction=DOWN,
                color=RED
            )
            s_label = Text("σ", font_size=18, color=RED)
            s_label.next_to(s_brace, DOWN, buff=0.05)
            sigma_braces.add(s_brace)
            sigma_labels_group.add(s_label)

        self.play(
            LaggedStart(
                *[Create(b) for b in sigma_braces],
                lag_ratio=0.2
            ),
            LaggedStart(
                *[Write(l) for l in sigma_labels_group],
                lag_ratio=0.2
            ),
            run_time=1
        )

        count_text = Text(
            f"= {int((x_val - mu) / sigma)} standard deviations above μ",
            font_size=22,
            color=RED
        )
        count_text.next_to(sigma_labels_group, DOWN, buff=0.15)
        self.play(Write(count_text))
        self.wait(0.8)

        # ========== PART 7: Animate the Z-Score Formula ==========
        # Clear the sigma braces and distance label to make room
        self.play(
            FadeOut(brace),
            FadeOut(distance_label),
            FadeOut(sigma_braces),
            FadeOut(sigma_labels_group),
            FadeOut(count_text),
            FadeOut(x_vline),
            FadeOut(x_dot),
            FadeOut(x_label),
            # Shrink the top section
            VGroup(curve, left_area, right_area).animate.scale(0.6).to_edge(UP, buff=0.6).shift(LEFT * 0.5),
            FadeOut(title),
            FadeOut(context),
            run_time=0.8
        )

        # Move number lines up
        self.play(
            raw_line.animate.shift(UP * 1.5),
            raw_labels.animate.shift(UP * 1.5),
            z_line.animate.shift(UP * 1.5),
            z_title.animate.shift(UP * 1.5),
            z_labels.animate.shift(UP * 1.5),
            connectors.animate.shift(UP * 1.5),
            run_time=0.5
        )

        # Show the formula step by step
        formula_title = Text("The Z-Score Formula", font_size=32, color=GREEN)
        formula_title.move_to(DOWN * 0.5)
        self.play(Write(formula_title))

        # Generic formula
        generic = VGroup(
            Text("z", font_size=44),
            Text(" = ", font_size=44),
            Text("(x - μ) / σ", font_size=44),
        ).arrange(RIGHT, buff=0.08)
        generic[0].set_color(GREEN)
        generic.next_to(formula_title, DOWN, buff=0.4)
        self.play(Write(generic))
        self.wait(0.5)

        # Substitution
        substituted = VGroup(
            Text("z", font_size=44),
            Text(" = ", font_size=44),
            Text(f"({x_val}", font_size=44),
            Text(" - ", font_size=44),
            Text(f"{mu}", font_size=44),
            Text(f") / {sigma}", font_size=44),
        ).arrange(RIGHT, buff=0.08)
        substituted[0].set_color(GREEN)
        substituted[2].set_color(YELLOW)   # x value
        substituted[4].set_color(YELLOW)   # mu value
        substituted.next_to(generic, DOWN, buff=0.3)

        self.play(Write(substituted))
        self.wait(0.3)

        # Numerator computation
        z_value = (x_val - mu) / sigma
        step2 = VGroup(
            Text("z", font_size=44),
            Text(" = ", font_size=44),
            Text(f"{x_val - mu} / {sigma}", font_size=44),
        ).arrange(RIGHT, buff=0.08)
        step2[0].set_color(GREEN)
        step2.next_to(substituted, DOWN, buff=0.3)
        self.play(Write(step2))
        self.wait(0.3)

        # Final result
        result = VGroup(
            Text("z", font_size=52),
            Text(" = ", font_size=52),
            Text(f"{z_value:.1f}", font_size=52),
        ).arrange(RIGHT, buff=0.08)
        result[0].set_color(GREEN)
        result[2].set_color(GREEN)
        result.next_to(step2, DOWN, buff=0.3)
        self.play(Write(result))
        self.wait(0.3)

        # Highlight z on the z-score number line
        z_dot = Dot(
            z_line.n2p(z_value) + UP * 1.5,  # shifted because we moved the line
            color=GREEN,
            radius=0.12
        )
        z_dot.move_to(z_line.get_center(), coor_mask=np.array([0, 1, 0]))
        z_dot.set_x(z_line.n2p(z_value)[0])

        z_dot_label = Text(
            f"z = {z_value:.1f}",
            font_size=22,
            color=GREEN
        )
        z_dot_label.next_to(z_dot, DOWN, buff=0.3)

        self.play(
            FadeIn(z_dot, scale=2),
            Write(z_dot_label),
            run_time=0.6
        )
        self.wait(0.5)

        # ========== PART 8: Interpretation and Final Insight ==========
        # Clear intermediate steps
        self.play(
            FadeOut(formula_title),
            FadeOut(generic),
            FadeOut(substituted),
            FadeOut(step2),
            run_time=0.4
        )

        # Move result to center-ish
        self.play(result.animate.move_to(DOWN * 0.5), run_time=0.3)

        interpretation = Text(
            f"A score of {x_val} is {z_value:.0f} standard deviations ABOVE the mean",
            font_size=24,
            color=RED
        )
        interpretation.next_to(result, DOWN, buff=0.3)
        self.play(Write(interpretation))
        self.wait(0.5)

        # Final boxed insight
        self.play(FadeOut(interpretation), run_time=0.3)

        insight_lines = VGroup(
            Text(
                "z = (x - μ) / σ",
                font_size=36
            ),
            Text(
                "z tells you how many SDs a value is from the mean",
                font_size=24,
                color=YELLOW
            ),
            VGroup(
                Text("z > 0 : above mean", font_size=20, color=RED),
                Text("z < 0 : below mean", font_size=20, color=BLUE),
                Text("z = 0 : at the mean", font_size=20, color=WHITE),
            ).arrange(RIGHT, buff=0.6),
        ).arrange(DOWN, buff=0.25)
        insight_lines.next_to(result, DOWN, buff=0.4)

        box = SurroundingRectangle(
            VGroup(result, insight_lines),
            color=GREEN,
            buff=0.25,
            corner_radius=0.15
        )

        self.play(
            Write(insight_lines[0]),
            run_time=0.5
        )
        self.play(Write(insight_lines[1]), run_time=0.5)
        self.play(Write(insight_lines[2]), run_time=0.5)
        self.play(Create(box))
        self.wait(2)

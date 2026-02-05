"""
AP Exam Solution Checklist (AP Stats Unit 5, Topic 5.2d)

Builds up the 5 required elements of a complete AP normal distribution
solution, step by step with visual reinforcement. Then contrasts a
complete solution against an incomplete one to emphasize why every
element matters for full credit.

Run with:
    manim -qm --format=mp4 ap_solution_checklist.py APSolutionChecklist
"""

from manim import *
import numpy as np


class APSolutionChecklist(Scene):
    def construct(self):
        # Parameters for the running example
        mu = 64.5
        sigma = 2.5
        x_query = 69

        # Color scheme
        CHECK_COLOR = GREEN
        X_COLOR = RED
        ELEMENT_COLOR = BLUE
        HIGHLIGHT_COLOR = YELLOW
        CURVE_COLOR = BLUE

        # Normal PDF for mini curves
        def normal_pdf(x):
            return (1.0 / (sigma * np.sqrt(2 * np.pi))) * \
                   np.exp(-0.5 * ((x - mu) / sigma) ** 2)

        # ========== TITLE ==========
        title = Text("AP Exam: The Complete Solution", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "5 Elements Graders Look For",
            font_size=28, color=HIGHLIGHT_COLOR
        )
        subtitle.next_to(title, DOWN, buff=0.2)
        self.play(FadeIn(subtitle))
        self.wait(0.5)

        # ========== EMPTY SKELETON ==========
        # Create 5 empty slots that we'll fill in
        skeleton_title = Text("Your Solution:", font_size=24, weight=BOLD)
        skeleton_title.shift(LEFT * 3.5 + UP * 1.5)
        self.play(Write(skeleton_title))

        # Create empty numbered lines with dashes
        slot_texts = [
            "1. ___________________________",
            "2. ___________________________",
            "3. ___________________________",
            "4. ___________________________",
            "5. ___________________________",
        ]
        slots = VGroup()
        for i, txt in enumerate(slot_texts):
            slot = Text(txt, font_size=20, color=GRAY)
            slots.add(slot)

        slots.arrange(DOWN, buff=0.35, aligned_edge=LEFT)
        slots.next_to(skeleton_title, DOWN, buff=0.3).align_to(skeleton_title, LEFT)

        self.play(
            LaggedStart(*[FadeIn(s) for s in slots], lag_ratio=0.1)
        )
        self.wait(0.5)

        # ========== MINI CURVE for visual reinforcement ==========
        # Small axes in the right portion of the screen
        mini_axes = Axes(
            x_range=[mu - 3.5 * sigma, mu + 3.5 * sigma, sigma],
            y_range=[0, 0.2, 0.05],
            x_length=4.5,
            y_length=2,
            axis_config={"include_tip": False, "include_numbers": False},
        )
        mini_axes.to_edge(RIGHT, buff=0.5).shift(DOWN * 0.3)

        mini_curve = mini_axes.plot(
            normal_pdf,
            x_range=[mu - 3.5 * sigma, mu + 3.5 * sigma, 0.1],
            color=CURVE_COLOR,
            stroke_width=2
        )

        # Minimal x-labels on mini curve
        mini_mu_label = Text("\u03bc", font_size=18)
        mini_mu_label.next_to(mini_axes.c2p(mu, 0), DOWN, buff=0.1)

        self.play(
            Create(mini_axes),
            Create(mini_curve),
            Write(mini_mu_label),
            run_time=0.8
        )
        self.wait(0.3)

        # ========== ELEMENT 1: Define the random variable ==========
        check1 = Text("1.", font_size=20, color=CHECK_COLOR, weight=BOLD)
        checkmark1 = Text("\u2713", font_size=28, color=CHECK_COLOR)
        element1 = Text(
            "Let X = height of a randomly",
            font_size=19
        )
        element1b = Text(
            "  selected woman (inches)",
            font_size=19
        )
        elem1_group = VGroup(
            VGroup(checkmark1, check1).arrange(RIGHT, buff=0.1),
            element1,
            element1b
        ).arrange(RIGHT, buff=0.15)
        elem1_group.move_to(slots[0].get_center())

        self.play(
            FadeOut(slots[0]),
            FadeIn(elem1_group),
            run_time=0.6
        )
        self.wait(0.3)

        # Highlight on mini curve: just a gentle glow on the whole curve
        curve_flash = mini_curve.copy().set_color(HIGHLIGHT_COLOR).set_stroke(width=5)
        self.play(FadeIn(curve_flash), run_time=0.3)
        self.play(FadeOut(curve_flash), run_time=0.3)
        self.wait(0.2)

        # ========== ELEMENT 2: State the distribution ==========
        checkmark2 = Text("\u2713", font_size=28, color=CHECK_COLOR)
        check2 = Text("2.", font_size=20, color=CHECK_COLOR, weight=BOLD)
        element2 = Text(
            "X ~ N(64.5, 2.5)",
            font_size=24
        )
        elem2_group = VGroup(
            VGroup(checkmark2, check2).arrange(RIGHT, buff=0.1),
            element2
        ).arrange(RIGHT, buff=0.15)
        elem2_group.move_to(slots[1].get_center())

        self.play(
            FadeOut(slots[1]),
            FadeIn(elem2_group),
            run_time=0.6
        )
        self.wait(0.3)

        # Highlight on mini curve: add a label N(64.5, 2.5)
        mini_dist_label = Text(
            "N(64.5, 2.5)", font_size=16, color=HIGHLIGHT_COLOR
        )
        mini_dist_label.next_to(mini_curve, UP, buff=0.1)
        self.play(Write(mini_dist_label), run_time=0.4)
        self.wait(0.2)

        # ========== ELEMENT 3: Identify parameters ==========
        checkmark3 = Text("\u2713", font_size=28, color=CHECK_COLOR)
        check3 = Text("3.", font_size=20, color=CHECK_COLOR, weight=BOLD)
        element3 = Text(
            "\u03bc = 64.5,  \u03c3 = 2.5",
            font_size=24
        )
        elem3_group = VGroup(
            VGroup(checkmark3, check3).arrange(RIGHT, buff=0.1),
            element3
        ).arrange(RIGHT, buff=0.15)
        elem3_group.move_to(slots[2].get_center())

        self.play(
            FadeOut(slots[2]),
            FadeIn(elem3_group),
            run_time=0.6
        )
        self.wait(0.3)

        # Highlight on mini curve: mark mu and sigma
        mini_mu_mark = DashedLine(
            mini_axes.c2p(mu, 0),
            mini_axes.c2p(mu, normal_pdf(mu)),
            color=HIGHLIGHT_COLOR, stroke_width=2
        )
        mini_sigma_brace = BraceBetweenPoints(
            mini_axes.c2p(mu, normal_pdf(mu) * 0.6),
            mini_axes.c2p(mu + sigma, normal_pdf(mu) * 0.6),
            direction=UP, color=HIGHLIGHT_COLOR
        )
        mini_sigma_text = Text("\u03c3", font_size=16, color=HIGHLIGHT_COLOR)
        mini_sigma_text.next_to(mini_sigma_brace, UP, buff=0.05)

        self.play(
            Create(mini_mu_mark),
            Create(mini_sigma_brace),
            Write(mini_sigma_text),
            run_time=0.5
        )
        self.wait(0.2)

        # ========== ELEMENT 4: Value of interest + direction ==========
        checkmark4 = Text("\u2713", font_size=28, color=CHECK_COLOR)
        check4 = Text("4.", font_size=20, color=CHECK_COLOR, weight=BOLD)
        element4 = Text(
            "P(X > 69)",
            font_size=24
        )
        elem4_group = VGroup(
            VGroup(checkmark4, check4).arrange(RIGHT, buff=0.1),
            element4
        ).arrange(RIGHT, buff=0.15)
        elem4_group.move_to(slots[3].get_center())

        self.play(
            FadeOut(slots[3]),
            FadeIn(elem4_group),
            run_time=0.6
        )
        self.wait(0.3)

        # Highlight on mini curve: shade the right tail past x=69
        mini_query_line = DashedLine(
            mini_axes.c2p(x_query, 0),
            mini_axes.c2p(x_query, normal_pdf(x_query)),
            color=RED, stroke_width=2
        )
        mini_shade = mini_axes.get_area(
            mini_curve,
            x_range=[x_query, mu + 3.5 * sigma],
            color=RED,
            opacity=0.4
        )
        self.play(Create(mini_query_line), FadeIn(mini_shade), run_time=0.5)
        self.wait(0.2)

        # ========== ELEMENT 5: Correct probability ==========
        checkmark5 = Text("\u2713", font_size=28, color=CHECK_COLOR)
        check5 = Text("5.", font_size=20, color=CHECK_COLOR, weight=BOLD)
        element5 = Text(
            "= 0.0359",
            font_size=24, color=CHECK_COLOR
        )
        elem5_group = VGroup(
            VGroup(checkmark5, check5).arrange(RIGHT, buff=0.1),
            element5
        ).arrange(RIGHT, buff=0.15)
        elem5_group.move_to(slots[4].get_center())

        self.play(
            FadeOut(slots[4]),
            FadeIn(elem5_group),
            run_time=0.6
        )
        self.wait(0.3)

        # Label the area on mini curve
        mini_prob_label = Text("0.0359", font_size=16, color=RED)
        mini_prob_label.next_to(mini_shade, RIGHT, buff=0.1).shift(UP * 0.2)
        self.play(Write(mini_prob_label), run_time=0.3)
        self.wait(0.5)

        # ========== SHOW COMPLETE "PERFECT ANSWER" ==========
        # Draw a border around all 5 elements
        all_elements = VGroup(
            elem1_group, elem2_group, elem3_group, elem4_group, elem5_group
        )
        perfect_box = SurroundingRectangle(
            VGroup(skeleton_title, all_elements),
            color=CHECK_COLOR, buff=0.2, corner_radius=0.1
        )
        perfect_label = Text(
            "COMPLETE (Full Credit)", font_size=22,
            color=CHECK_COLOR, weight=BOLD
        )
        perfect_label.next_to(perfect_box, DOWN, buff=0.15)

        self.play(Create(perfect_box), Write(perfect_label))
        self.wait(1)

        # ========== NOW SHOW A BAD EXAMPLE ==========
        # Fade out the mini curve elements and shift
        self.play(
            FadeOut(mini_axes),
            FadeOut(mini_curve),
            FadeOut(mini_mu_label),
            FadeOut(mini_dist_label),
            FadeOut(mini_mu_mark),
            FadeOut(mini_sigma_brace),
            FadeOut(mini_sigma_text),
            FadeOut(mini_query_line),
            FadeOut(mini_shade),
            FadeOut(mini_prob_label),
            FadeOut(subtitle),
        )
        self.wait(0.3)

        # Bad example: missing element 1 (no variable defined) and element 3 (no params)
        bad_title = Text("Incomplete Solution:", font_size=24, weight=BOLD, color=X_COLOR)
        bad_title.to_edge(RIGHT, buff=0.8).shift(UP * 1.8)
        self.play(Write(bad_title))

        # Show the bad elements
        bad_elements = VGroup()

        # Missing element 1 - red X
        x_mark1 = Text("\u2717", font_size=28, color=X_COLOR)
        bad_line1 = Text("(no variable defined)", font_size=18, color=X_COLOR)
        bad_row1 = VGroup(x_mark1, bad_line1).arrange(RIGHT, buff=0.15)

        # Element 2 present but sloppy - just "normal distribution"
        check_b2 = Text("\u2713", font_size=24, color=GRAY)
        bad_line2 = Text("Normal distribution", font_size=18, color=GRAY)
        bad_row2 = VGroup(check_b2, bad_line2).arrange(RIGHT, buff=0.15)

        # Missing element 3 - red X
        x_mark3 = Text("\u2717", font_size=28, color=X_COLOR)
        bad_line3 = Text("(parameters not stated)", font_size=18, color=X_COLOR)
        bad_row3 = VGroup(x_mark3, bad_line3).arrange(RIGHT, buff=0.15)

        # Element 4 present
        check_b4 = Text("\u2713", font_size=24, color=GRAY)
        bad_line4 = Text("P(X > 69)", font_size=22, color=GRAY)
        bad_row4 = VGroup(check_b4, bad_line4).arrange(RIGHT, buff=0.15)

        # Element 5 present
        check_b5 = Text("\u2713", font_size=24, color=GRAY)
        bad_line5 = Text("= 0.0359", font_size=22, color=GRAY)
        bad_row5 = VGroup(check_b5, bad_line5).arrange(RIGHT, buff=0.15)

        bad_elements = VGroup(bad_row1, bad_row2, bad_row3, bad_row4, bad_row5)
        bad_elements.arrange(DOWN, buff=0.25, aligned_edge=LEFT)
        bad_elements.next_to(bad_title, DOWN, buff=0.3).align_to(bad_title, LEFT)

        for row in bad_elements:
            self.play(FadeIn(row), run_time=0.3)
            self.wait(0.15)

        self.wait(0.3)

        # Draw a red border with "INCOMPLETE"
        bad_box = SurroundingRectangle(
            VGroup(bad_title, bad_elements),
            color=X_COLOR, buff=0.2, corner_radius=0.1
        )
        bad_label = Text(
            "INCOMPLETE (Points Lost!)", font_size=22,
            color=X_COLOR, weight=BOLD
        )
        bad_label.next_to(bad_box, DOWN, buff=0.15)

        self.play(Create(bad_box), Write(bad_label))
        self.wait(1)

        # ========== KEY INSIGHT BOX ==========
        # Clear everything for the final insight
        self.play(
            FadeOut(title),
            FadeOut(skeleton_title),
            FadeOut(all_elements),
            FadeOut(perfect_box),
            FadeOut(perfect_label),
            FadeOut(bad_title),
            FadeOut(bad_elements),
            FadeOut(bad_box),
            FadeOut(bad_label),
        )
        self.wait(0.3)

        # Big insight
        insight_line1 = Text(
            "AP Graders check for ALL 5 elements",
            font_size=36, weight=BOLD, color=HIGHLIGHT_COLOR
        )
        insight_line2 = Text(
            "Missing ANY one costs points",
            font_size=32, color=X_COLOR
        )
        insight_group = VGroup(insight_line1, insight_line2).arrange(DOWN, buff=0.3)
        insight_group.move_to(ORIGIN).shift(UP * 0.5)

        insight_box = SurroundingRectangle(
            insight_group, color=HIGHLIGHT_COLOR, buff=0.3, corner_radius=0.1
        )

        self.play(Create(insight_box), run_time=0.5)
        self.play(Write(insight_line1))
        self.play(Write(insight_line2))
        self.wait(0.5)

        # Recap the 5 elements as a quick numbered list below
        recap = VGroup(
            Text("1. Define variable", font_size=24, color=CHECK_COLOR),
            Text("2. State distribution", font_size=24, color=CHECK_COLOR),
            Text("3. Identify parameters", font_size=24, color=CHECK_COLOR),
            Text("4. Value + direction", font_size=24, color=CHECK_COLOR),
            Text("5. Correct probability", font_size=24, color=CHECK_COLOR),
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        recap.next_to(insight_box, DOWN, buff=0.5)

        self.play(
            LaggedStart(*[FadeIn(r) for r in recap], lag_ratio=0.15)
        )
        self.wait(2)

        # Fade out
        self.play(
            *[FadeOut(mob) for mob in self.mobjects]
        )
        self.wait(0.5)

"""
Interpreting a Confidence Interval (AP Stats Unit 6, Topic 6.3)

Shows the standard template for interpreting a CI for a population proportion:
"We are C% confident that the interval from ___ to ___ captures the [parameter]."
Walks through a concrete example (Proposition 100 signatures), highlights the
three required elements (confidence level, bounds, parameter in context), and
warns against the common mistake of saying "probability."

Run with: manim -qm --format=mp4 apstat_63_interpret_ci.py InterpretCI
"""
from manim import *

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class InterpretCI(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ================================================================
        # TITLE
        # ================================================================
        title = Text("Interpreting a Confidence Interval", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.5)

        # ================================================================
        # THE TEMPLATE
        # ================================================================
        template_header = Text(
            "The Template", font_size=30, color=YELLOW_3B1B, weight=BOLD,
        )
        template_header.next_to(title, DOWN, buff=0.35)
        self.play(Write(template_header), run_time=0.4)

        # Build template with colored placeholders
        t_line1 = Text("\"We are ", font_size=26)
        t_conf = Text("C%", font_size=26, color=PINK_3B1B, weight=BOLD)
        t_line1b = Text(" confident that the interval", font_size=26)
        row1 = VGroup(t_line1, t_conf, t_line1b).arrange(RIGHT, buff=0.06)

        t_line2a = Text("from ", font_size=26)
        t_low = Text("___", font_size=26, color=GREEN_3B1B, weight=BOLD)
        t_line2b = Text(" to ", font_size=26)
        t_high = Text("___", font_size=26, color=GREEN_3B1B, weight=BOLD)
        t_line2c = Text(" captures the", font_size=26)
        row2 = VGroup(t_line2a, t_low, t_line2b, t_high, t_line2c).arrange(RIGHT, buff=0.06)

        t_line3 = Text("[population parameter in context].\"", font_size=26, color=TEAL_3B1B)

        template_block = VGroup(row1, row2, t_line3).arrange(DOWN, buff=0.1)
        template_block.next_to(template_header, DOWN, buff=0.25)

        self.play(
            LaggedStart(
                Write(row1), Write(row2), Write(t_line3),
                lag_ratio=0.4,
            ),
            run_time=2.0,
        )
        self.wait(0.5)

        template_box = SurroundingRectangle(
            template_block, color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(template_box), run_time=0.5)
        self.wait(0.8)

        # ================================================================
        # THREE REQUIRED ELEMENTS
        # ================================================================
        elements_header = Text(
            "3 Required Elements:", font_size=24, color=BLUE_3B1B, weight=BOLD,
        )
        elements_header.next_to(template_box, DOWN, buff=0.3)

        elem1 = VGroup(
            Text("1.", font_size=22, color=PINK_3B1B, weight=BOLD),
            Text("Confidence level (e.g. 95%)", font_size=22),
        ).arrange(RIGHT, buff=0.1)

        elem2 = VGroup(
            Text("2.", font_size=22, color=GREEN_3B1B, weight=BOLD),
            Text("Interval bounds (lower to upper)", font_size=22),
        ).arrange(RIGHT, buff=0.1)

        elem3 = VGroup(
            Text("3.", font_size=22, color=TEAL_3B1B, weight=BOLD),
            Text("Parameter IN CONTEXT (not just 'p')", font_size=22),
        ).arrange(RIGHT, buff=0.1)

        elems = VGroup(elem1, elem2, elem3).arrange(DOWN, aligned_edge=LEFT, buff=0.12)
        elems.next_to(elements_header, DOWN, buff=0.15)

        self.play(Write(elements_header), run_time=0.4)
        for elem in [elem1, elem2, elem3]:
            self.play(Write(elem), run_time=0.5)
            self.wait(0.2)
        self.wait(0.6)

        # ================================================================
        # TRANSITION: Clear, show worked example
        # ================================================================
        self.play(
            FadeOut(template_header), FadeOut(template_block), FadeOut(template_box),
            FadeOut(elements_header), FadeOut(elems),
            run_time=0.5,
        )

        # ================================================================
        # WORKED EXAMPLE: Proposition 100
        # ================================================================
        ex_header = Text(
            "Example: Proposition 100", font_size=30, color=YELLOW_3B1B, weight=BOLD,
        )
        ex_header.next_to(title, DOWN, buff=0.35)
        self.play(Write(ex_header), run_time=0.5)

        # Setup
        setup_lines = VGroup(
            Text("500 signatures sampled from 9,388 submitted", font_size=22),
            Text("364 of 500 were valid (from registered voters)", font_size=22),
            MathTex(r"\hat{p} = 364/500 = 0.728", font_size=28, color=TEAL_3B1B),
            Text("95% CI: (0.689, 0.767)", font_size=24, color=GREEN_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.12)
        setup_lines.next_to(ex_header, DOWN, buff=0.25)

        for line in setup_lines:
            self.play(Write(line), run_time=0.45)
            self.wait(0.15)
        self.wait(0.5)

        # The interpretation
        interp_header = Text(
            "Interpretation:", font_size=24, color=BLUE_3B1B, weight=BOLD,
        )
        interp_header.next_to(setup_lines, DOWN, buff=0.3)

        interp_l1 = Text("\"We are ", font_size=24)
        interp_c = Text("95% confident", font_size=24, color=PINK_3B1B, weight=BOLD)
        interp_l1b = Text(" that the interval", font_size=24)
        irow1 = VGroup(interp_l1, interp_c, interp_l1b).arrange(RIGHT, buff=0.05)

        interp_l2a = Text("from ", font_size=24)
        interp_lo = Text("0.689", font_size=24, color=GREEN_3B1B, weight=BOLD)
        interp_l2b = Text(" to ", font_size=24)
        interp_hi = Text("0.767", font_size=24, color=GREEN_3B1B, weight=BOLD)
        interp_l2c = Text(" captures the", font_size=24)
        irow2 = VGroup(interp_l2a, interp_lo, interp_l2b, interp_hi, interp_l2c).arrange(RIGHT, buff=0.05)

        interp_l3 = Text(
            "proportion of all submitted signatures",
            font_size=24, color=TEAL_3B1B,
        )
        interp_l4 = Text(
            "that are from registered voters.\"",
            font_size=24, color=TEAL_3B1B,
        )

        interp_block = VGroup(irow1, irow2, interp_l3, interp_l4).arrange(DOWN, buff=0.08)
        interp_block.next_to(interp_header, DOWN, buff=0.15)

        self.play(Write(interp_header), run_time=0.4)
        self.play(
            LaggedStart(
                Write(irow1), Write(irow2), Write(interp_l3), Write(interp_l4),
                lag_ratio=0.35,
            ),
            run_time=2.2,
        )
        self.wait(0.5)

        interp_box = SurroundingRectangle(
            interp_block, color=GREEN_3B1B, buff=0.15, corner_radius=0.1,
        )
        self.play(Create(interp_box), run_time=0.5)
        self.wait(0.8)

        # ================================================================
        # FINAL KEY INSIGHT BOX
        # ================================================================
        self.play(
            FadeOut(ex_header), FadeOut(setup_lines),
            FadeOut(interp_header), FadeOut(interp_block), FadeOut(interp_box),
            FadeOut(title),
            run_time=0.5,
        )

        final_content = VGroup(
            Text("Interpreting a CI", font_size=34, color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=8),
            Text("\"We are C% confident that the interval", font_size=24),
            Text("from ___ to ___ captures the [parameter in context].\"", font_size=24),
            Text("", font_size=8),
            Text("Always include:", font_size=24, color=BLUE_3B1B, weight=BOLD),
            Text("1. Confidence level    2. Bounds    3. Context", font_size=22, color=TEAL_3B1B),
            Text("", font_size=6),
            Text(
                "Say 'confident' -- NEVER say 'probability'",
                font_size=22, color=RED,
            ),
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

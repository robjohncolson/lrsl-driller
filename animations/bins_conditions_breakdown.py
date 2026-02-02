"""
BINS Conditions Mnemonic Animation

Builds the BINS mnemonic step-by-step for AP Statistics students learning
about binomial distribution conditions.

Run command:
    manim -qm --format=mp4 bins_conditions_breakdown.py BINSConditionsBreakdown
"""

from manim import *


class BINSConditionsBreakdown(Scene):
    def construct(self):
        # Color scheme
        LETTER_COLOR = BLUE
        DEFINITION_COLOR = GREEN
        EXAMPLE_COLOR = YELLOW

        # Title
        title = Text("BINS: The 4 Binomial Conditions", font_size=42)
        title.to_edge(UP, buff=0.5)

        self.play(Write(title), run_time=1.5)
        self.wait(0.5)

        # Store all condition groups for final summary
        conditions = []

        # Starting position for conditions
        start_y = 1.5
        y_spacing = 1.5

        # ==================== B: Binary ====================
        b_letter = Text("B", font_size=72, color=LETTER_COLOR)
        b_letter.move_to(LEFT * 5 + UP * start_y)

        self.play(FadeIn(b_letter, scale=1.5), run_time=0.5)
        self.wait(0.3)

        b_def = Text("Binary outcomes", font_size=36, color=DEFINITION_COLOR)
        b_def.next_to(b_letter, RIGHT, buff=0.5)

        self.play(Write(b_def), run_time=0.7)
        self.wait(0.3)

        b_detail = Text("(only two possible: success/failure)", font_size=28, color=WHITE)
        b_detail.next_to(b_def, RIGHT, buff=0.3)

        self.play(FadeIn(b_detail), run_time=0.5)
        self.wait(0.3)

        b_example = Text("Ex: Coin flip → Heads or Tails", font_size=24, color=EXAMPLE_COLOR)
        b_example.next_to(b_letter, DOWN, buff=0.2, aligned_edge=LEFT)

        self.play(Write(b_example), run_time=0.7)
        self.wait(0.5)

        # Fade example, keep letter and definition
        self.play(FadeOut(b_example), FadeOut(b_detail), run_time=0.3)

        b_group = VGroup(b_letter, b_def)
        conditions.append(b_group)

        # ==================== I: Independent ====================
        i_letter = Text("I", font_size=72, color=LETTER_COLOR)
        i_letter.move_to(LEFT * 5 + UP * (start_y - y_spacing))

        self.play(FadeIn(i_letter, scale=1.5), run_time=0.5)
        self.wait(0.3)

        i_def = Text("Independent trials", font_size=36, color=DEFINITION_COLOR)
        i_def.next_to(i_letter, RIGHT, buff=0.5)

        self.play(Write(i_def), run_time=0.7)
        self.wait(0.3)

        i_detail = Text("(each trial doesn't affect others)", font_size=28, color=WHITE)
        i_detail.next_to(i_def, RIGHT, buff=0.3)

        self.play(FadeIn(i_detail), run_time=0.5)
        self.wait(0.3)

        i_example = Text("Ex: Each dice roll is separate", font_size=24, color=EXAMPLE_COLOR)
        i_example.next_to(i_letter, DOWN, buff=0.2, aligned_edge=LEFT)

        self.play(Write(i_example), run_time=0.7)
        self.wait(0.5)

        self.play(FadeOut(i_example), FadeOut(i_detail), run_time=0.3)

        i_group = VGroup(i_letter, i_def)
        conditions.append(i_group)

        # ==================== N: Number fixed ====================
        n_letter = Text("N", font_size=72, color=LETTER_COLOR)
        n_letter.move_to(LEFT * 5 + UP * (start_y - 2 * y_spacing))

        self.play(FadeIn(n_letter, scale=1.5), run_time=0.5)
        self.wait(0.3)

        n_def = Text("Number of trials fixed", font_size=36, color=DEFINITION_COLOR)
        n_def.next_to(n_letter, RIGHT, buff=0.5)

        self.play(Write(n_def), run_time=0.7)
        self.wait(0.3)

        n_detail = Text("(n is determined in advance)", font_size=28, color=WHITE)
        n_detail.next_to(n_def, RIGHT, buff=0.3)

        self.play(FadeIn(n_detail), run_time=0.5)
        self.wait(0.3)

        n_example = Text("Ex: Flip a coin exactly 10 times", font_size=24, color=EXAMPLE_COLOR)
        n_example.next_to(n_letter, DOWN, buff=0.2, aligned_edge=LEFT)

        self.play(Write(n_example), run_time=0.7)
        self.wait(0.5)

        self.play(FadeOut(n_example), FadeOut(n_detail), run_time=0.3)

        n_group = VGroup(n_letter, n_def)
        conditions.append(n_group)

        # ==================== S: Same probability ====================
        s_letter = Text("S", font_size=72, color=LETTER_COLOR)
        s_letter.move_to(LEFT * 5 + UP * (start_y - 3 * y_spacing))

        self.play(FadeIn(s_letter, scale=1.5), run_time=0.5)
        self.wait(0.3)

        s_def = Text("Same probability", font_size=36, color=DEFINITION_COLOR)
        s_def.next_to(s_letter, RIGHT, buff=0.5)

        self.play(Write(s_def), run_time=0.7)
        self.wait(0.3)

        s_detail = Text("(p remains constant across trials)", font_size=28, color=WHITE)
        s_detail.next_to(s_def, RIGHT, buff=0.3)

        self.play(FadeIn(s_detail), run_time=0.5)
        self.wait(0.3)

        s_example = Text("Ex: P(Heads) = 0.5 every flip", font_size=24, color=EXAMPLE_COLOR)
        s_example.next_to(s_letter, DOWN, buff=0.2, aligned_edge=LEFT)

        self.play(Write(s_example), run_time=0.7)
        self.wait(0.5)

        self.play(FadeOut(s_example), FadeOut(s_detail), run_time=0.3)

        s_group = VGroup(s_letter, s_def)
        conditions.append(s_group)

        self.wait(0.5)

        # ==================== Final Summary Box ====================
        # Fade out title and existing content
        all_conditions = VGroup(*conditions)

        self.play(FadeOut(title), run_time=0.5)

        # Create summary content
        summary_title = Text("BINS Conditions Summary", font_size=36, color=WHITE)
        summary_title.to_edge(UP, buff=0.6)

        # Create compact summary lines
        summary_lines = VGroup()

        b_summary = VGroup(
            Text("B", font_size=48, color=LETTER_COLOR),
            Text(" – Binary outcomes (success/failure)", font_size=28, color=WHITE)
        ).arrange(RIGHT, buff=0.2)

        i_summary = VGroup(
            Text("I", font_size=48, color=LETTER_COLOR),
            Text(" – Independent trials", font_size=28, color=WHITE)
        ).arrange(RIGHT, buff=0.2)

        n_summary = VGroup(
            Text("N", font_size=48, color=LETTER_COLOR),
            Text(" – Number of trials fixed (n)", font_size=28, color=WHITE)
        ).arrange(RIGHT, buff=0.2)

        s_summary = VGroup(
            Text("S", font_size=48, color=LETTER_COLOR),
            Text(" – Same probability (p)", font_size=28, color=WHITE)
        ).arrange(RIGHT, buff=0.2)

        summary_lines = VGroup(b_summary, i_summary, n_summary, s_summary)
        summary_lines.arrange(DOWN, buff=0.4, aligned_edge=LEFT)
        summary_lines.move_to(ORIGIN)

        # Create box around summary
        box = SurroundingRectangle(
            summary_lines,
            color=BLUE,
            buff=0.4,
            corner_radius=0.1
        )

        # Animate transition to summary
        self.play(
            FadeOut(all_conditions),
            run_time=0.5
        )

        self.play(
            Write(summary_title),
            run_time=0.7
        )

        self.play(
            FadeIn(summary_lines),
            Create(box),
            run_time=1.0
        )

        # Final formula
        formula = MathTex(
            r"X \sim \text{Binomial}(n, p)",
            font_size=36
        )
        formula.next_to(box, DOWN, buff=0.5)

        self.play(Write(formula), run_time=0.7)

        self.wait(2)

        # Fade out
        self.play(
            FadeOut(VGroup(summary_title, summary_lines, box, formula)),
            run_time=1.0
        )

"""
Topic 4.6 Capstone Review Animation

A fast-paced review of key probability concepts from Topic 4.6:
- Independence
- Multiplication Rule for Independent Events
- Addition Rule
- Mutually Exclusive Events
- Critical distinction between Independent and ME

Run with:
    manim -qm --format=mp4 l32_capstone_46.py Capstone46
"""

from manim import *

class Capstone46(Scene):
    def construct(self):
        # Title
        title = Text("Topic 4.6 Review", font_size=56, weight=BOLD)
        subtitle = Text("Probability Rules", font_size=36, color=GRAY)
        subtitle.next_to(title, DOWN, buff=0.3)

        self.play(Write(title), run_time=0.5)
        self.play(FadeIn(subtitle, shift=UP*0.2), run_time=0.3)
        self.wait(0.5)
        self.play(FadeOut(title), FadeOut(subtitle), run_time=0.3)

        # Flashcard 1: Independence
        self.show_flashcard(
            "INDEPENDENCE",
            [
                MathTex(r"P(A|B) = P(A)", color=BLUE),
                Text("or", font_size=28, color=GRAY),
                MathTex(r"P(A \cap B) = P(A) \times P(B)", color=BLUE)
            ],
            BLUE
        )

        # Flashcard 2: Multiplication Rule
        self.show_flashcard(
            "MULTIPLICATION RULE",
            [
                Text("For Independent Events:", font_size=28, color=GREEN),
                MathTex(r"P(A \text{ and } B) = P(A) \times P(B)", color=GREEN, font_size=44)
            ],
            GREEN
        )

        # Flashcard 3: Addition Rule
        self.show_flashcard(
            "ADDITION RULE",
            [
                MathTex(r"P(A \text{ or } B) = P(A) + P(B) - P(A \cap B)", color=YELLOW, font_size=38)
            ],
            YELLOW
        )

        # Flashcard 4: Mutually Exclusive
        self.show_flashcard(
            "MUTUALLY EXCLUSIVE",
            [
                Text("Events cannot both occur", font_size=28, color=ORANGE),
                MathTex(r"P(A \cap B) = 0", color=ORANGE),
                MathTex(r"P(A \text{ or } B) = P(A) + P(B)", color=ORANGE, font_size=40)
            ],
            ORANGE
        )

        # Critical Distinction
        self.show_critical_distinction()

        # Formula Reference Card
        self.show_reference_card()

        # Closing message
        closing = Text("Ready for Random Variables!", font_size=48, color=GREEN, weight=BOLD)
        self.play(FadeIn(closing, scale=0.8), run_time=0.5)
        self.wait(1)
        self.play(FadeOut(closing), run_time=0.3)

    def show_flashcard(self, title_text, content_items, color):
        """Display a flashcard with title and content."""
        # Create card background
        card = Rectangle(
            width=12,
            height=6,
            fill_color=color,
            fill_opacity=0.1,
            stroke_color=color,
            stroke_width=4
        )

        # Title
        title = Text(title_text, font_size=40, color=color, weight=BOLD)
        title.to_edge(UP, buff=1)

        # Content group
        content = VGroup(*content_items)
        content.arrange(DOWN, buff=0.4)
        content.move_to(ORIGIN)

        # Animate in
        self.play(
            Create(card),
            Write(title),
            run_time=0.4
        )
        self.play(FadeIn(content, shift=UP*0.3), run_time=0.5)
        self.wait(1.2)

        # Animate out
        self.play(
            FadeOut(card),
            FadeOut(title),
            FadeOut(content),
            run_time=0.3
        )

    def show_critical_distinction(self):
        """Emphasize the distinction between Independent and ME."""
        warning = Text("CRITICAL DISTINCTION!", font_size=48, color=RED, weight=BOLD)
        warning.to_edge(UP, buff=0.5)

        self.play(Write(warning), run_time=0.4)

        # Create comparison
        independent_label = Text("Independent", font_size=32, color=BLUE)
        independent_label.move_to(LEFT*3.5 + UP*1.5)

        me_label = Text("Mutually Exclusive", font_size=32, color=ORANGE)
        me_label.move_to(RIGHT*3 + UP*1.5)

        # Independent properties
        ind_props = VGroup(
            MathTex(r"P(A|B) = P(A)", color=BLUE, font_size=32),
            MathTex(r"P(A \cap B) = P(A) \times P(B)", color=BLUE, font_size=32),
            Text("Events CAN occur together", font_size=24, color=BLUE)
        )
        ind_props.arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        ind_props.next_to(independent_label, DOWN, buff=0.4)

        # ME properties
        me_props = VGroup(
            MathTex(r"P(A \cap B) = 0", color=ORANGE, font_size=32),
            MathTex(r"P(A \text{ or } B) = P(A) + P(B)", color=ORANGE, font_size=32),
            Text("Events CANNOT occur together", font_size=24, color=ORANGE)
        )
        me_props.arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        me_props.next_to(me_label, DOWN, buff=0.4)

        # Divider
        divider = Line(UP*2, DOWN*2, color=GRAY, stroke_width=2)
        divider.move_to(ORIGIN)

        # Animate
        self.play(
            Write(independent_label),
            Write(me_label),
            Create(divider),
            run_time=0.5
        )
        self.play(
            FadeIn(ind_props, shift=RIGHT*0.3),
            FadeIn(me_props, shift=LEFT*0.3),
            run_time=0.6
        )

        # Emphasis
        not_equal = Text("≠", font_size=72, color=RED, weight=BOLD)
        not_equal.move_to(ORIGIN + DOWN*2.5)
        self.play(Write(not_equal), run_time=0.3)
        self.wait(1.5)

        # Clear
        self.play(
            FadeOut(warning),
            FadeOut(independent_label),
            FadeOut(me_label),
            FadeOut(ind_props),
            FadeOut(me_props),
            FadeOut(divider),
            FadeOut(not_equal),
            run_time=0.4
        )

    def show_reference_card(self):
        """Display final formula reference card."""
        title = Text("Formula Reference", font_size=42, color=WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)

        formulas = VGroup(
            MathTex(r"\text{Independence: } P(A|B) = P(A)", color=BLUE, font_size=32),
            MathTex(r"\text{Independent Multiplication: } P(A \cap B) = P(A) \times P(B)", color=GREEN, font_size=32),
            MathTex(r"\text{Addition Rule: } P(A \cup B) = P(A) + P(B) - P(A \cap B)", color=YELLOW, font_size=32),
            MathTex(r"\text{ME Addition: } P(A \cup B) = P(A) + P(B)", color=ORANGE, font_size=32),
        )
        formulas.arrange(DOWN, buff=0.5, aligned_edge=LEFT)
        formulas.move_to(ORIGIN + DOWN*0.3)

        # Create border
        border = SurroundingRectangle(
            formulas,
            color=WHITE,
            buff=0.5,
            stroke_width=3
        )

        self.play(Write(title), run_time=0.4)
        self.play(
            Create(border),
            FadeIn(formulas, lag_ratio=0.2),
            run_time=1
        )
        self.wait(2)

        self.play(
            FadeOut(title),
            FadeOut(border),
            FadeOut(formulas),
            run_time=0.4
        )

"""
Topics 4.4-4.5 Capstone Review Animation

Covers:
- Mutually exclusive events
- Joint probability
- Conditional probability
- Multiplication rule
- Key distinctions and common mistakes

Render with:
manim -qm --format=mp4 l24_capstone_44_45.py Capstone44_45
"""

from manim import *

class Capstone44_45(Scene):
    def construct(self):
        # Title
        title = Text("Topics 4.4-4.5 Review", font_size=48, weight=BOLD)
        self.play(Write(title))
        self.wait(0.5)
        self.play(FadeOut(title))

        # Concept 1: Mutually Exclusive
        self.show_mutually_exclusive()

        # Concept 2: Joint Probability
        self.show_joint_probability()

        # Concept 3: Conditional Probability
        self.show_conditional_probability()

        # Concept 4: Multiplication Rule
        self.show_multiplication_rule()

        # Concept 5: Order Matters
        self.show_order_matters()

        # Common Mistakes
        self.show_common_mistakes()

        # Closing
        self.show_closing()

    def show_mutually_exclusive(self):
        """Flashcard 1: Mutually Exclusive Events"""
        header = Text("Mutually Exclusive", font_size=36, color=RED).to_edge(UP)

        definition = Text(
            "Events cannot occur together",
            font_size=28,
            color=RED
        ).next_to(header, DOWN, buff=0.5)

        formula = MathTex(
            r"P(A \cap B) = 0",
            font_size=40,
            color=RED
        ).next_to(definition, DOWN, buff=0.8)

        example = Text(
            "Example: Rolling 2 and rolling 5",
            font_size=24,
            color=GRAY
        ).next_to(formula, DOWN, buff=0.5)

        self.play(
            FadeIn(header),
            FadeIn(definition),
            run_time=0.5
        )
        self.play(Write(formula), run_time=0.6)
        self.play(FadeIn(example), run_time=0.4)
        self.wait(1)
        self.play(
            FadeOut(header),
            FadeOut(definition),
            FadeOut(formula),
            FadeOut(example),
            run_time=0.5
        )

    def show_joint_probability(self):
        """Flashcard 2: Joint Probability"""
        header = Text("Joint Probability", font_size=36, color=BLUE).to_edge(UP)

        definition = Text(
            "Both events occur (intersection)",
            font_size=28,
            color=BLUE
        ).next_to(header, DOWN, buff=0.5)

        formula = MathTex(
            r"P(A \cap B) = \frac{\text{intersection}}{\text{grand total}}",
            font_size=36,
            color=BLUE
        ).next_to(definition, DOWN, buff=0.8)

        tip = Text(
            "Use GRAND TOTAL in denominator",
            font_size=24,
            color=YELLOW,
            weight=BOLD
        ).next_to(formula, DOWN, buff=0.5)

        self.play(
            FadeIn(header),
            FadeIn(definition),
            run_time=0.5
        )
        self.play(Write(formula), run_time=0.6)
        self.play(FadeIn(tip), run_time=0.4)
        self.wait(1)
        self.play(
            FadeOut(header),
            FadeOut(definition),
            FadeOut(formula),
            FadeOut(tip),
            run_time=0.5
        )

    def show_conditional_probability(self):
        """Flashcard 3: Conditional Probability"""
        header = Text("Conditional Probability", font_size=36, color=GREEN).to_edge(UP)

        definition = Text(
            "Probability of B given A occurred",
            font_size=28,
            color=GREEN
        ).next_to(header, DOWN, buff=0.5)

        formula = MathTex(
            r"P(B|A) = \frac{\text{intersection}}{\text{total for A}}",
            font_size=36,
            color=GREEN
        ).next_to(definition, DOWN, buff=0.8)

        warning = Text(
            "NOT grand total! Use ROW/COLUMN total",
            font_size=24,
            color=RED,
            weight=BOLD
        ).next_to(formula, DOWN, buff=0.5)

        self.play(
            FadeIn(header),
            FadeIn(definition),
            run_time=0.5
        )
        self.play(Write(formula), run_time=0.6)
        self.play(FadeIn(warning), run_time=0.4)
        self.wait(1.2)
        self.play(
            FadeOut(header),
            FadeOut(definition),
            FadeOut(formula),
            FadeOut(warning),
            run_time=0.5
        )

    def show_multiplication_rule(self):
        """Flashcard 4: Multiplication Rule"""
        header = Text("Multiplication Rule", font_size=36, color=PURPLE).to_edge(UP)

        definition = Text(
            "Find joint probability from conditional",
            font_size=28,
            color=PURPLE
        ).next_to(header, DOWN, buff=0.5)

        formula = MathTex(
            r"P(A \cap B) = P(A) \times P(B|A)",
            font_size=40,
            color=PURPLE
        ).next_to(definition, DOWN, buff=0.8)

        alt_formula = MathTex(
            r"= P(B) \times P(A|B)",
            font_size=36,
            color=PURPLE
        ).next_to(formula, DOWN, buff=0.3)

        self.play(
            FadeIn(header),
            FadeIn(definition),
            run_time=0.5
        )
        self.play(Write(formula), run_time=0.6)
        self.play(Write(alt_formula), run_time=0.5)
        self.wait(1)
        self.play(
            FadeOut(header),
            FadeOut(definition),
            FadeOut(formula),
            FadeOut(alt_formula),
            run_time=0.5
        )

    def show_order_matters(self):
        """Flashcard 5: Order Matters"""
        header = Text("Order Matters!", font_size=36, color=ORANGE).to_edge(UP)

        warning = Text(
            "These are generally NOT equal:",
            font_size=28,
            color=ORANGE
        ).next_to(header, DOWN, buff=0.5)

        inequality = MathTex(
            r"P(A|B) \neq P(B|A)",
            font_size=44,
            color=ORANGE
        ).next_to(warning, DOWN, buff=0.8)

        example = VGroup(
            Text("P(rain | clouds) ≠ P(clouds | rain)", font_size=22, color=GRAY),
        ).next_to(inequality, DOWN, buff=0.5)

        self.play(
            FadeIn(header),
            FadeIn(warning),
            run_time=0.5
        )
        self.play(Write(inequality), run_time=0.6)
        self.play(FadeIn(example), run_time=0.4)
        self.wait(1)
        self.play(
            FadeOut(header),
            FadeOut(warning),
            FadeOut(inequality),
            FadeOut(example),
            run_time=0.5
        )

    def show_common_mistakes(self):
        """Show common mistakes to avoid"""
        title = Text("Common Mistakes", font_size=40, color=RED, weight=BOLD)
        title.to_edge(UP)

        mistakes = VGroup(
            Text("× Using grand total for P(B|A)", font_size=26, color=RED),
            Text("× Confusing P(A|B) with P(B|A)", font_size=26, color=RED),
            Text("× Forgetting mutually exclusive ≠ independent", font_size=26, color=RED),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.4).next_to(title, DOWN, buff=0.8)

        # Add checkmarks for correct approaches
        corrections = VGroup(
            Text("✓ Use row/column total for conditional", font_size=24, color=GREEN),
            Text("✓ Check which event is given", font_size=24, color=GREEN),
            Text("✓ M.E. means P(A∩B)=0, not P(A)×P(B)", font_size=24, color=GREEN),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.4).next_to(mistakes, DOWN, buff=0.6)

        self.play(FadeIn(title), run_time=0.4)
        self.play(LaggedStart(*[FadeIn(m) for m in mistakes], lag_ratio=0.3), run_time=1.2)
        self.play(LaggedStart(*[FadeIn(c) for c in corrections], lag_ratio=0.3), run_time=1.2)
        self.wait(1.5)
        self.play(
            FadeOut(title),
            FadeOut(mistakes),
            FadeOut(corrections),
            run_time=0.5
        )

    def show_closing(self):
        """Closing message"""
        message = Text(
            "Ready for independence and unions!",
            font_size=42,
            color=YELLOW,
            weight=BOLD
        )

        checkmark = Text("✓", font_size=80, color=GREEN).next_to(message, UP, buff=0.5)

        self.play(
            FadeIn(checkmark, scale=1.5),
            Write(message),
            run_time=1
        )
        self.wait(1.5)
        self.play(
            FadeOut(checkmark),
            FadeOut(message),
            run_time=0.5
        )

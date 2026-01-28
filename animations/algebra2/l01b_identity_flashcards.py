"""
Level 1b: Identity Flashcards
Quick memorization drill for polynomial identities.

Run with: python -m manim -qm --format=mp4 l01b_identity_flashcards.py IdentityFlashcards
"""
from manim import *


class IdentityFlashcards(Scene):
    def construct(self):
        # Title
        title = Text("Identity Flashcards", font_size=44)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.3)

        # Flashcard style - show LHS, then reveal RHS
        # Using Text with Unicode superscripts to avoid LaTeX
        cards = [
            ("(a+b)²", "a² + 2ab + b²", "Square of a Sum", GREEN),
            ("(a-b)²", "a² - 2ab + b²", "Square of a Difference", BLUE),
            ("a² - b²", "(a+b)(a-b)", "Difference of Squares", YELLOW),
            ("a³ + b³", "(a+b)(a²-ab+b²)", "Sum of Cubes", ORANGE),
            ("a³ - b³", "(a-b)(a²+ab+b²)", "Difference of Cubes", PURPLE),
        ]

        card_box = RoundedRectangle(width=8, height=3.5, corner_radius=0.2, color=WHITE, stroke_width=3)
        card_box.shift(DOWN * 0.3)

        self.play(Create(card_box))

        for i, (lhs, rhs, name, color) in enumerate(cards):
            # Clear previous
            if i > 0:
                self.play(FadeOut(prev_group))

            # Show name
            name_text = Text(name, font_size=28, color=color)
            name_text.next_to(card_box, UP, buff=0.2)

            # Show left side using Text
            lhs_text = Text(lhs, font_size=48, font="monospace")
            lhs_text.move_to(card_box.get_center() + UP * 0.5)

            self.play(Write(name_text), Write(lhs_text))
            self.wait(0.8)

            # Show equals sign
            equals = Text("=", font_size=48)
            equals.move_to(card_box.get_center())
            self.play(Write(equals))
            self.wait(0.3)

            # Reveal right side
            rhs_text = Text(rhs, font_size=48, color=color, font="monospace")
            rhs_text.move_to(card_box.get_center() + DOWN * 0.5)
            self.play(Write(rhs_text), run_time=0.8)
            self.wait(1)

            prev_group = VGroup(name_text, lhs_text, equals, rhs_text)

        # Final tip
        self.play(FadeOut(prev_group))

        tip = VGroup(
            Text("Memory Tip for Cubes:", font_size=28, color=YELLOW),
            Text("Middle sign is OPPOSITE", font_size=24),
            Text("a³ + b³ → (a+b)(a²-ab+b²)", font_size=32, font="monospace"),
            Text("a³ - b³ → (a-b)(a²+ab+b²)", font_size=32, font="monospace"),
        ).arrange(DOWN, buff=0.3)
        tip.move_to(card_box.get_center())

        self.play(Write(tip), run_time=1.5)
        self.wait(2)

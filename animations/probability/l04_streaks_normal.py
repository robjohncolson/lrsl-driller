"""
Streaks Are Normal - Probability Animation

Demonstrates that streaks are a natural feature of random sequences,
and that humans tend to avoid them when trying to fake randomness.

To render:
manim -qm --format=mp4 l04_streaks_normal.py StreaksAreNormal
"""

from manim import *


class StreaksAreNormal(Scene):
    def construct(self):
        # Title
        title = Text("Streaks Are Normal!", font_size=56, color=YELLOW)
        self.play(Write(title))
        self.wait(1)
        self.play(title.animate.scale(0.7).to_edge(UP))
        self.wait(0.5)

        # Create two sequences
        real_sequence = "HHHHHTHTTTTTHTH"
        fake_sequence = "HTHTTHTHHTHTHHH"

        # Labels
        real_label = Text("Real Random:", font_size=32, color=GREEN).shift(UP * 1.5 + LEFT * 4)
        fake_label = Text("Human Fake:", font_size=32, color=ORANGE).shift(DOWN * 1 + LEFT * 4)

        self.play(Write(real_label))
        self.wait(0.3)

        # Create real random sequence with boxes
        real_boxes = self.create_sequence_boxes(real_sequence, UP * 1.5 + RIGHT * 0.5)
        self.play(LaggedStart(*[FadeIn(box) for box in real_boxes], lag_ratio=0.05))
        self.wait(1)

        # Highlight streaks in real sequence (5+ consecutive)
        # H streak: positions 0-4 (5 H's)
        # T streak: positions 7-11 (5 T's)
        streak_highlights = []

        # First H streak (positions 0-4)
        h_streak_box = SurroundingRectangle(
            VGroup(*real_boxes[0:5]),
            color=YELLOW,
            buff=0.05,
            stroke_width=4
        )
        streak_highlights.append(h_streak_box)

        # T streak (positions 7-11)
        t_streak_box = SurroundingRectangle(
            VGroup(*real_boxes[7:12]),
            color=YELLOW,
            buff=0.05,
            stroke_width=4
        )
        streak_highlights.append(t_streak_box)

        self.play(Create(h_streak_box))
        self.wait(0.3)
        self.play(Create(t_streak_box))
        self.wait(1)

        # Show fake sequence
        self.play(Write(fake_label))
        self.wait(0.3)

        fake_boxes = self.create_sequence_boxes(fake_sequence, DOWN * 1 + RIGHT * 0.5)
        self.play(LaggedStart(*[FadeIn(box) for box in fake_boxes], lag_ratio=0.05))
        self.wait(1.5)

        # Fade out sequences to show statistics
        self.play(
            FadeOut(real_label),
            FadeOut(fake_label),
            FadeOut(VGroup(*real_boxes)),
            FadeOut(VGroup(*fake_boxes)),
            FadeOut(VGroup(*streak_highlights))
        )
        self.wait(0.5)

        # Show key statistic
        stat_text = VGroup(
            Text("In 100 coin flips:", font_size=36),
            Text("P(streak of 8+) ≈ 32%", font_size=42, color=YELLOW)
        ).arrange(DOWN, buff=0.4)

        self.play(Write(stat_text[0]))
        self.wait(0.5)
        self.play(Write(stat_text[1]))
        self.wait(1.5)

        # Fade out statistic
        self.play(FadeOut(stat_text))
        self.wait(0.3)

        # Key insight
        insight = VGroup(
            Text("Key Insight:", font_size=40, color=GREEN),
            Text("If no streaks →", font_size=36),
            Text("probably NOT random!", font_size=40, color=RED)
        ).arrange(DOWN, buff=0.4)

        self.play(Write(insight[0]))
        self.wait(0.4)
        self.play(Write(insight[1]))
        self.wait(0.4)
        self.play(Write(insight[2]))
        self.wait(2)

        # Fade everything out
        self.play(
            FadeOut(title),
            FadeOut(insight)
        )
        self.wait(0.5)

    def create_sequence_boxes(self, sequence, start_position):
        """Create a row of colored boxes for a coin flip sequence."""
        boxes = VGroup()
        box_size = 0.5
        spacing = 0.6

        for i, flip in enumerate(sequence):
            # Choose color based on H or T
            color = BLUE if flip == 'H' else RED

            # Create square
            square = Square(side_length=box_size, fill_opacity=0.8, fill_color=color, stroke_width=2)

            # Create text
            text = Text(flip, font_size=28, color=WHITE)

            # Group them
            box = VGroup(square, text)
            box.move_to(start_position + RIGHT * (i * spacing))

            boxes.add(box)

        return boxes

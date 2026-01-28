"""
Manim animation: Outcomes vs Events

This animation demonstrates the fundamental difference between a single outcome
and an event (collection of outcomes) using a die as an example.

To render:
manim -qm --format=mp4 l02_outcome_event.py OutcomeVsEvent

Author: Claude Code
Date: 2026-01-28
"""

from manim import *


class OutcomeVsEvent(Scene):
    def construct(self):
        # Title
        title = Text("Outcome vs Event", font_size=48, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Create die faces (1-6)
        die_faces = self.create_die_faces()
        die_group = VGroup(*die_faces).arrange(RIGHT, buff=0.4)
        die_group.shift(UP * 1.5)

        self.play(FadeIn(die_group))
        self.wait(0.5)

        # Part 1: Show OUTCOME (single result)
        outcome_label = Text("OUTCOME", font_size=36, color=BLUE, weight=BOLD)
        outcome_label.next_to(die_group, DOWN, buff=0.8)

        outcome_desc = Text(
            "Result of ONE trial",
            font_size=24,
            color=BLUE
        )
        outcome_desc.next_to(outcome_label, DOWN, buff=0.3)

        self.play(
            Write(outcome_label),
            Write(outcome_desc)
        )
        self.wait(0.3)

        # Highlight die face showing 4 (index 3)
        highlight_4 = self.create_highlight(die_faces[3], YELLOW)
        example_text = Text("Example: Rolling a 4", font_size=22, color=YELLOW)
        example_text.next_to(outcome_desc, DOWN, buff=0.3)

        self.play(
            Create(highlight_4),
            Write(example_text)
        )
        self.wait(1)

        # Clear outcome example
        self.play(
            FadeOut(highlight_4),
            FadeOut(outcome_label),
            FadeOut(outcome_desc),
            FadeOut(example_text)
        )
        self.wait(0.3)

        # Part 2: Show EVENT (collection of outcomes)
        event_label = Text("EVENT", font_size=36, color=RED, weight=BOLD)
        event_label.next_to(die_group, DOWN, buff=0.8)

        event_desc = Text(
            "COLLECTION of outcomes",
            font_size=24,
            color=RED
        )
        event_desc.next_to(event_label, DOWN, buff=0.3)

        self.play(
            Write(event_label),
            Write(event_desc)
        )
        self.wait(0.3)

        # Highlight prime numbers: 2, 3, 5 (indices 1, 2, 4)
        highlight_2 = self.create_highlight(die_faces[1], YELLOW)
        highlight_3 = self.create_highlight(die_faces[2], YELLOW)
        highlight_5 = self.create_highlight(die_faces[4], YELLOW)

        event_example = Text(
            "Example: Rolling a prime {2, 3, 5}",
            font_size=22,
            color=YELLOW
        )
        event_example.next_to(event_desc, DOWN, buff=0.3)

        self.play(
            Create(highlight_2),
            Create(highlight_3),
            Create(highlight_5),
            Write(event_example)
        )
        self.wait(1.5)

        # Clear for final comparison
        self.play(
            FadeOut(highlight_2),
            FadeOut(highlight_3),
            FadeOut(highlight_5),
            FadeOut(event_label),
            FadeOut(event_desc),
            FadeOut(event_example),
            die_group.animate.shift(UP * 0.5)
        )
        self.wait(0.3)

        # Final side-by-side comparison
        comparison = self.create_comparison()
        comparison.shift(DOWN * 1.5)

        self.play(FadeIn(comparison))
        self.wait(2)

        # Fade out
        self.play(
            FadeOut(title),
            FadeOut(die_group),
            FadeOut(comparison)
        )

    def create_die_faces(self):
        """Create visual representations of die faces 1-6"""
        faces = []

        for i in range(1, 7):
            # Create square for die face
            square = Square(side_length=0.8, color=WHITE, stroke_width=3)

            # Add dots based on number
            dots = self.create_dots(i)
            dots.move_to(square.get_center())

            # Add number label below
            label = Text(str(i), font_size=20, color=GRAY)
            label.next_to(square, DOWN, buff=0.15)

            face = VGroup(square, dots, label)
            faces.append(face)

        return faces

    def create_dots(self, number):
        """Create dot pattern for die face"""
        dot_radius = 0.08
        spacing = 0.25

        dots = VGroup()

        if number == 1:
            dots.add(Dot(radius=dot_radius, color=BLUE))

        elif number == 2:
            dots.add(
                Dot(radius=dot_radius, color=BLUE).shift(UP * spacing + LEFT * spacing),
                Dot(radius=dot_radius, color=BLUE).shift(DOWN * spacing + RIGHT * spacing)
            )

        elif number == 3:
            dots.add(
                Dot(radius=dot_radius, color=BLUE).shift(UP * spacing + LEFT * spacing),
                Dot(radius=dot_radius, color=BLUE),
                Dot(radius=dot_radius, color=BLUE).shift(DOWN * spacing + RIGHT * spacing)
            )

        elif number == 4:
            dots.add(
                Dot(radius=dot_radius, color=BLUE).shift(UP * spacing + LEFT * spacing),
                Dot(radius=dot_radius, color=BLUE).shift(UP * spacing + RIGHT * spacing),
                Dot(radius=dot_radius, color=BLUE).shift(DOWN * spacing + LEFT * spacing),
                Dot(radius=dot_radius, color=BLUE).shift(DOWN * spacing + RIGHT * spacing)
            )

        elif number == 5:
            dots.add(
                Dot(radius=dot_radius, color=BLUE).shift(UP * spacing + LEFT * spacing),
                Dot(radius=dot_radius, color=BLUE).shift(UP * spacing + RIGHT * spacing),
                Dot(radius=dot_radius, color=BLUE),
                Dot(radius=dot_radius, color=BLUE).shift(DOWN * spacing + LEFT * spacing),
                Dot(radius=dot_radius, color=BLUE).shift(DOWN * spacing + RIGHT * spacing)
            )

        elif number == 6:
            dots.add(
                Dot(radius=dot_radius, color=BLUE).shift(UP * spacing + LEFT * spacing),
                Dot(radius=dot_radius, color=BLUE).shift(UP * spacing + RIGHT * spacing),
                Dot(radius=dot_radius, color=BLUE).shift(LEFT * spacing),
                Dot(radius=dot_radius, color=BLUE).shift(RIGHT * spacing),
                Dot(radius=dot_radius, color=BLUE).shift(DOWN * spacing + LEFT * spacing),
                Dot(radius=dot_radius, color=BLUE).shift(DOWN * spacing + RIGHT * spacing)
            )

        return dots

    def create_highlight(self, die_face, color):
        """Create a highlight circle around a die face"""
        circle = Circle(
            radius=0.6,
            color=color,
            stroke_width=6
        )
        circle.move_to(die_face[0].get_center())
        return circle

    def create_comparison(self):
        """Create final side-by-side comparison table"""
        # Left side: OUTCOME
        outcome_box = Rectangle(
            height=2,
            width=3.5,
            color=BLUE,
            stroke_width=3,
            fill_color=BLUE,
            fill_opacity=0.1
        )

        outcome_title = Text("OUTCOME", font_size=28, color=BLUE, weight=BOLD)
        outcome_title.move_to(outcome_box.get_top() + DOWN * 0.4)

        outcome_text = VGroup(
            Text("• Single result", font_size=18, color=WHITE),
            Text("• One element", font_size=18, color=WHITE),
            Text("• Example: {4}", font_size=18, color=YELLOW)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        outcome_text.move_to(outcome_box.get_center() + DOWN * 0.2)

        outcome_group = VGroup(outcome_box, outcome_title, outcome_text)
        outcome_group.shift(LEFT * 2.2)

        # Right side: EVENT
        event_box = Rectangle(
            height=2,
            width=3.5,
            color=RED,
            stroke_width=3,
            fill_color=RED,
            fill_opacity=0.1
        )

        event_title = Text("EVENT", font_size=28, color=RED, weight=BOLD)
        event_title.move_to(event_box.get_top() + DOWN * 0.4)

        event_text = VGroup(
            Text("• Collection", font_size=18, color=WHITE),
            Text("• Multiple outcomes", font_size=18, color=WHITE),
            Text("• Example: {2,3,5}", font_size=18, color=YELLOW)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        event_text.move_to(event_box.get_center() + DOWN * 0.2)

        event_group = VGroup(event_box, event_title, event_text)
        event_group.shift(RIGHT * 2.2)

        return VGroup(outcome_group, event_group)

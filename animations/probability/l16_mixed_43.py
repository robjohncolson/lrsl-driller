"""
Topic 4.3 Mixed Practice Review - Quick Reference Card

Renders a four-quadrant quick reference showing the four key rules from Topic 4.3:
- Sample Space
- Valid Probability Model
- Complement Rule
- At Least One Rule

Run with:
    manim -qm --format=mp4 l16_mixed_43.py Mixed43Review
"""

from manim import *


class Mixed43Review(Scene):
    def construct(self):
        # Title
        title = Text("Topic 4.3 Quick Reference", font_size=48, weight=BOLD)
        title.to_edge(UP, buff=0.5)

        self.play(Write(title))
        self.wait(0.5)

        # Create quadrant dividers
        v_line = Line(UP * 2.5, DOWN * 3, color=WHITE, stroke_width=2)
        h_line = Line(LEFT * 6.5, RIGHT * 6.5, color=WHITE, stroke_width=2)

        self.play(Create(v_line), Create(h_line))
        self.wait(0.3)

        # Quadrant colors
        colors = {
            "tl": BLUE,
            "tr": GREEN,
            "bl": ORANGE,
            "br": PURPLE
        }

        # TOP-LEFT: Sample Space
        tl_title = Text("Sample Space", font_size=32, color=colors["tl"], weight=BOLD)
        tl_title.move_to(LEFT * 3.25 + UP * 1.5)

        tl_icon = Circle(radius=0.6, color=colors["tl"], fill_opacity=0.2)
        tl_icon.move_to(LEFT * 3.25 + UP * 0.5)

        tl_outcomes = VGroup(
            Text("1", font_size=20),
            Text("2", font_size=20),
            Text("3", font_size=20),
            Text("4", font_size=20),
            Text("...", font_size=20)
        ).arrange(RIGHT, buff=0.15)
        tl_outcomes.move_to(tl_icon.get_center())

        tl_formula = MathTex(r"S = \{\text{all outcomes}\}", font_size=28)
        tl_formula.move_to(LEFT * 3.25 + DOWN * 0.3)

        tl_group = VGroup(tl_title, tl_icon, tl_outcomes, tl_formula)

        # TOP-RIGHT: Valid Model
        tr_title = Text("Valid Model", font_size=32, color=colors["tr"], weight=BOLD)
        tr_title.move_to(RIGHT * 3.25 + UP * 1.5)

        tr_condition1 = MathTex(r"0 \leq P(A) \leq 1", font_size=28, color=colors["tr"])
        tr_condition1.move_to(RIGHT * 3.25 + UP * 0.5)

        tr_and = Text("AND", font_size=24, color=GRAY)
        tr_and.move_to(RIGHT * 3.25 + UP * 0)

        tr_condition2 = MathTex(r"\sum P = 1", font_size=28, color=colors["tr"])
        tr_condition2.move_to(RIGHT * 3.25 + DOWN * 0.5)

        tr_group = VGroup(tr_title, tr_condition1, tr_and, tr_condition2)

        # BOTTOM-LEFT: Complement Rule
        bl_title = Text("Complement Rule", font_size=32, color=colors["bl"], weight=BOLD)
        bl_title.move_to(LEFT * 3.25 + DOWN * 1.2)

        bl_formula = MathTex(r"P(A') = 1 - P(A)", font_size=32, color=colors["bl"])
        bl_formula.move_to(LEFT * 3.25 + DOWN * 2)

        bl_example = Text("P(not A) = 1 - P(A)", font_size=22, color=GRAY, slant=ITALIC)
        bl_example.move_to(LEFT * 3.25 + DOWN * 2.7)

        bl_group = VGroup(bl_title, bl_formula, bl_example)

        # BOTTOM-RIGHT: At Least One
        br_title = Text("At Least One", font_size=32, color=colors["br"], weight=BOLD)
        br_title.move_to(RIGHT * 3.25 + DOWN * 1.2)

        br_formula = MathTex(r"P(\geq 1) = 1 - P(0)", font_size=32, color=colors["br"])
        br_formula.move_to(RIGHT * 3.25 + DOWN * 2)

        br_example = Text("1 - P(none)", font_size=22, color=GRAY, slant=ITALIC)
        br_example.move_to(RIGHT * 3.25 + DOWN * 2.7)

        br_group = VGroup(br_title, br_formula, br_example)

        # Animate each quadrant with highlight
        quadrants = [
            (tl_group, LEFT * 3.25 + UP * 0.25, colors["tl"]),
            (tr_group, RIGHT * 3.25 + UP * 0.25, colors["tr"]),
            (bl_group, LEFT * 3.25 + DOWN * 2, colors["bl"]),
            (br_group, RIGHT * 3.25 + DOWN * 2, colors["br"])
        ]

        for group, center, color in quadrants:
            # Create highlight background
            highlight = Rectangle(
                width=6,
                height=2.3,
                color=color,
                fill_opacity=0.15,
                stroke_width=3
            )
            highlight.move_to(center)

            # Animate quadrant
            self.play(
                FadeIn(highlight),
                FadeIn(group),
                run_time=0.8
            )
            self.wait(0.4)
            self.play(
                highlight.animate.set_fill(opacity=0.05).set_stroke(width=1),
                run_time=0.3
            )

        self.wait(0.5)

        # Final question
        question = Text(
            "Which rule fits your problem?",
            font_size=36,
            color=YELLOW,
            weight=BOLD
        )
        question.next_to(h_line, DOWN, buff=0.4)

        self.play(
            FadeIn(question, shift=UP * 0.3),
            run_time=0.8
        )
        self.wait(2)

        # Fade out
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
            run_time=1
        )
        self.wait(0.5)

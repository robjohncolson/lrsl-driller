"""
Addition Rule Definition (Union) - L29

Demonstrates the addition rule for probability of unions:
P(A ∪ B) = P(A) + P(B) - P(A ∩ B)

Shows why we must subtract the intersection to avoid double-counting,
and the special case for mutually exclusive events.

Usage:
    manim -qm --format=mp4 l29_addition_rule_def.py AdditionRuleDef
"""

from manim import *

class AdditionRuleDef(Scene):
    def construct(self):
        # Title
        title = Text("The Addition Rule (Union)", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # Create Venn diagram components
        circle_a = Circle(radius=1.2, color=BLUE, fill_opacity=0)
        circle_b = Circle(radius=1.2, color=RED, fill_opacity=0)
        circle_a.shift(LEFT * 0.7)
        circle_b.shift(RIGHT * 0.7)

        label_a = MathTex("A", color=BLUE, font_size=36).move_to(circle_a.get_center() + LEFT * 0.8)
        label_b = MathTex("B", color=RED, font_size=36).move_to(circle_b.get_center() + RIGHT * 0.8)

        venn_group = VGroup(circle_a, circle_b, label_a, label_b)
        venn_group.shift(UP * 0.3)

        self.play(Create(circle_a), Create(circle_b), Write(label_a), Write(label_b))
        self.wait(0.3)

        # Step 1: Add P(A) - fill first circle
        step1 = Text("Add P(A)", font_size=28, color=BLUE)
        step1.next_to(venn_group, DOWN, buff=0.5)

        filled_a = circle_a.copy().set_fill(BLUE, opacity=0.5)
        self.play(Write(step1), FadeIn(filled_a))
        self.wait(0.4)

        # Step 2: Add P(B) - fill second circle
        step2 = Text("Add P(B)", font_size=28, color=RED)
        step2.move_to(step1.get_center())

        filled_b = circle_b.copy().set_fill(RED, opacity=0.5)
        self.play(FadeOut(step1), Write(step2), FadeIn(filled_b))
        self.wait(0.4)

        # Step 3: Highlight the problem - overlap counted TWICE
        problem = Text("Overlap counted TWICE!", font_size=28, color=YELLOW, weight=BOLD)
        problem.move_to(step2.get_center())

        # Create intersection highlight (approximate with smaller circle)
        intersection = Intersection(circle_a, circle_b, color=YELLOW, fill_opacity=0.7, stroke_width=4)

        self.play(
            FadeOut(step2),
            Write(problem),
            Create(intersection),
            filled_a.animate.set_opacity(0.3),
            filled_b.animate.set_opacity(0.3)
        )
        self.wait(0.5)

        # Step 4: Solution - subtract P(A ∩ B)
        solution = Text("Subtract P(A ∩ B) once", font_size=28, color=GREEN)
        solution.move_to(problem.get_center())

        self.play(
            FadeOut(problem),
            Write(solution),
            intersection.animate.set_opacity(0.3)
        )
        self.wait(0.4)

        # Clear for formula
        self.play(
            FadeOut(solution),
            FadeOut(filled_a),
            FadeOut(filled_b),
            FadeOut(intersection)
        )

        # Main formula
        formula = MathTex(
            r"P(A \cup B) = P(A) + P(B) - P(A \cap B)",
            font_size=36
        )
        formula.next_to(venn_group, DOWN, buff=0.6)

        # Color parts of formula
        formula[0][0:7].set_color(YELLOW)  # P(A ∪ B)
        formula[0][8:12].set_color(BLUE)   # P(A)
        formula[0][13:17].set_color(RED)   # P(B)
        formula[0][18:].set_color(PURPLE)  # P(A ∩ B)

        self.play(Write(formula))
        self.wait(0.6)

        # Special case: Mutually exclusive events
        self.play(
            FadeOut(venn_group),
            formula.animate.shift(UP * 1.2)
        )

        special_title = Text("Special Case: Mutually Exclusive", font_size=28, color=ORANGE)
        special_title.next_to(formula, DOWN, buff=0.5)

        # New Venn diagram - no overlap
        circle_a_me = Circle(radius=1.0, color=BLUE, fill_opacity=0.4)
        circle_b_me = Circle(radius=1.0, color=RED, fill_opacity=0.4)
        circle_a_me.shift(LEFT * 1.8 + DOWN * 0.3)
        circle_b_me.shift(RIGHT * 1.8 + DOWN * 0.3)

        label_a_me = MathTex("A", color=BLUE, font_size=32).move_to(circle_a_me.get_center())
        label_b_me = MathTex("B", color=RED, font_size=32).move_to(circle_b_me.get_center())

        me_group = VGroup(circle_a_me, circle_b_me, label_a_me, label_b_me)

        self.play(
            Write(special_title),
            FadeIn(me_group)
        )
        self.wait(0.3)

        # Simplified formula
        simple_formula = MathTex(
            r"P(A \cap B) = 0",
            font_size=30,
            color=GRAY
        )
        simple_formula.next_to(me_group, DOWN, buff=0.4)

        final_formula = MathTex(
            r"P(A \cup B) = P(A) + P(B)",
            font_size=34
        )
        final_formula.next_to(simple_formula, DOWN, buff=0.3)
        final_formula[0][0:7].set_color(YELLOW)
        final_formula[0][8:12].set_color(BLUE)
        final_formula[0][13:].set_color(RED)

        self.play(Write(simple_formula))
        self.wait(0.2)
        self.play(Write(final_formula))
        self.wait(1.0)

        # Fade out
        self.play(
            *[FadeOut(mob) for mob in self.mobjects]
        )

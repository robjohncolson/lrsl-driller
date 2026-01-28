"""
Addition Rule (Avoiding Double Counting)
Shows why we subtract P(A∩B) when calculating P(A or B) using a Venn diagram.
Demonstrates the double-counting problem visually with overlapping circles.

Run with: manim -qm --format=mp4 addition_rule_venn_diagram.py AdditionRuleVennDiagram
"""
from manim import *


class AdditionRuleVennDiagram(Scene):
    def construct(self):
        # Color scheme
        COLOR_A = BLUE
        COLOR_B = RED
        COLOR_INTERSECTION = YELLOW
        COLOR_FORMULA = GREEN

        # ========== TITLE ==========
        title = Text("The Addition Rule", font_size=44)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        subtitle = Text("Avoiding Double Counting", font_size=28, color=YELLOW)
        subtitle.next_to(title, DOWN, buff=0.2)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== CREATE VENN DIAGRAM ==========
        # Position circles with overlap
        circle_a = Circle(radius=1.5, color=COLOR_A, stroke_width=4)
        circle_a.shift(LEFT * 0.8)

        circle_b = Circle(radius=1.5, color=COLOR_B, stroke_width=4)
        circle_b.shift(RIGHT * 0.8)

        # Labels for circles
        label_a = MathTex("A", font_size=40, color=COLOR_A)
        label_a.next_to(circle_a, LEFT, buff=0.2)

        label_b = MathTex("B", font_size=40, color=COLOR_B)
        label_b.next_to(circle_b, RIGHT, buff=0.2)

        # Create the Venn diagram group and position it
        venn_group = VGroup(circle_a, circle_b, label_a, label_b)
        venn_group.shift(DOWN * 0.3)

        self.play(
            Create(circle_a),
            Create(circle_b),
            Write(label_a),
            Write(label_b),
            run_time=1.5
        )
        self.wait(0.5)

        # ========== STEP 1: Add P(A) ==========
        step1_text = Text("Step 1: Add P(A)", font_size=26)
        step1_text.to_edge(LEFT, buff=0.5)
        step1_text.shift(DOWN * 2.5)
        self.play(Write(step1_text))

        # Fill circle A with blue (with opacity so we can see overlap)
        fill_a = Circle(radius=1.5, color=COLOR_A, fill_opacity=0.5, stroke_width=0)
        fill_a.move_to(circle_a.get_center())
        self.play(FadeIn(fill_a), run_time=0.8)

        # Show P(A) formula component
        formula_step1 = MathTex("P(A)", font_size=32, color=COLOR_A)
        formula_step1.to_edge(RIGHT, buff=1)
        formula_step1.shift(DOWN * 2)
        self.play(Write(formula_step1))
        self.wait(0.5)

        # ========== STEP 2: Add P(B) ==========
        step2_text = Text("Step 2: Add P(B)", font_size=26)
        step2_text.next_to(step1_text, DOWN, buff=0.3)
        self.play(Write(step2_text))

        # Fill circle B with red
        fill_b = Circle(radius=1.5, color=COLOR_B, fill_opacity=0.5, stroke_width=0)
        fill_b.move_to(circle_b.get_center())
        self.play(FadeIn(fill_b), run_time=0.8)

        # Update formula
        formula_step2 = MathTex("P(A) + P(B)", font_size=32)
        formula_step2[0][0:4].set_color(COLOR_A)  # P(A)
        formula_step2[0][5:9].set_color(COLOR_B)  # P(B)
        formula_step2.move_to(formula_step1.get_center())
        self.play(Transform(formula_step1, formula_step2))
        self.wait(0.5)

        # ========== STEP 3: Show the Problem - Double Counting ==========
        step3_text = Text("Problem: Overlap counted TWICE!", font_size=26, color=COLOR_INTERSECTION)
        step3_text.next_to(step2_text, DOWN, buff=0.3)
        self.play(Write(step3_text))
        self.wait(0.3)

        # Create intersection highlight
        # Use Intersection to show the overlapping region
        intersection = Intersection(circle_a, circle_b, color=COLOR_INTERSECTION, fill_opacity=0.9, stroke_width=3)

        # Flash the intersection to show it's been counted twice
        self.play(
            intersection.animate.set_fill(COLOR_INTERSECTION, opacity=0.9),
            FadeIn(intersection),
            run_time=0.5
        )

        # Add "2x" indicator on the intersection
        twice_label = MathTex("2\\times", font_size=36, color=BLACK)
        twice_label.move_to(intersection.get_center())
        self.play(Write(twice_label))

        # Pulse the intersection to emphasize
        self.play(
            intersection.animate.set_fill(WHITE, opacity=1),
            run_time=0.3
        )
        self.play(
            intersection.animate.set_fill(COLOR_INTERSECTION, opacity=0.9),
            run_time=0.3
        )
        self.wait(0.5)

        # Add annotation for intersection
        intersection_label = MathTex("A \\cap B", font_size=28)
        intersection_label.next_to(intersection, DOWN, buff=0.3)
        self.play(Write(intersection_label))
        self.wait(0.5)

        # ========== STEP 4: Subtract P(A∩B) ==========
        step4_text = Text("Step 3: Subtract once to correct", font_size=26, color=COLOR_FORMULA)
        step4_text.next_to(step3_text, DOWN, buff=0.3)
        self.play(Write(step4_text))

        # Show the subtraction visually - remove one layer from intersection
        self.play(
            FadeOut(twice_label),
            intersection.animate.set_fill(COLOR_INTERSECTION, opacity=0.0),
            run_time=0.8
        )

        # Show "1x" to indicate it's now counted once
        once_label = MathTex("1\\times", font_size=36, color=BLACK)
        once_label.move_to(intersection.get_center())

        # Recreate the intersection with just single counting representation
        intersection_final = Intersection(circle_a, circle_b, color=COLOR_INTERSECTION, fill_opacity=0.5, stroke_width=3)
        self.play(
            FadeIn(intersection_final),
            Write(once_label),
            run_time=0.5
        )
        self.wait(0.5)

        # ========== FINAL FORMULA ==========
        # Clear step texts and show final formula
        self.play(
            FadeOut(step1_text),
            FadeOut(step2_text),
            FadeOut(step3_text),
            FadeOut(step4_text),
            FadeOut(intersection_label),
            FadeOut(formula_step1),
            FadeOut(once_label),
            run_time=0.5
        )

        # Show the complete formula
        final_formula = MathTex(
            "P(A \\cup B) = P(A) + P(B) - P(A \\cap B)",
            font_size=36
        )
        final_formula.to_edge(DOWN, buff=1)

        # Color code the formula
        # P(A∪B) is positions 0-6
        # P(A) is positions 8-11
        # P(B) is positions 13-16
        # P(A∩B) is positions 18-24
        final_formula[0][0:7].set_color(COLOR_FORMULA)    # P(A∪B)
        final_formula[0][8:12].set_color(COLOR_A)         # P(A)
        final_formula[0][13:17].set_color(COLOR_B)        # P(B)
        final_formula[0][18:].set_color(COLOR_INTERSECTION)  # P(A∩B)

        self.play(Write(final_formula), run_time=1.5)
        self.wait(0.5)

        # Box the final formula
        box = SurroundingRectangle(final_formula, color=COLOR_FORMULA, buff=0.2, corner_radius=0.1)
        self.play(Create(box))
        self.wait(0.5)

        # Add explanation text
        explanation = Text(
            "Add both circles, then subtract the overlap counted twice",
            font_size=22
        )
        explanation.next_to(box, DOWN, buff=0.3)
        self.play(Write(explanation))
        self.wait(2)


class AdditionRuleWithNumbers(Scene):
    """Bonus scene: Shows the addition rule with concrete probability values"""
    def construct(self):
        # Color scheme
        COLOR_A = BLUE
        COLOR_B = RED
        COLOR_INTERSECTION = YELLOW
        COLOR_FORMULA = GREEN

        # Title
        title = Text("Addition Rule: Numerical Example", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Create Venn diagram
        circle_a = Circle(radius=1.3, color=COLOR_A, stroke_width=4)
        circle_a.shift(LEFT * 0.7 + UP * 0.3)

        circle_b = Circle(radius=1.3, color=COLOR_B, stroke_width=4)
        circle_b.shift(RIGHT * 0.7 + UP * 0.3)

        # Labels
        label_a = MathTex("A", font_size=36, color=COLOR_A)
        label_a.next_to(circle_a, LEFT, buff=0.15)

        label_b = MathTex("B", font_size=36, color=COLOR_B)
        label_b.next_to(circle_b, RIGHT, buff=0.15)

        self.play(
            Create(circle_a),
            Create(circle_b),
            Write(label_a),
            Write(label_b)
        )
        self.wait(0.3)

        # Add probability values to each region
        # A only region
        prob_a_only = MathTex("0.3", font_size=28, color=COLOR_A)
        prob_a_only.move_to(circle_a.get_center() + LEFT * 0.5)

        # B only region
        prob_b_only = MathTex("0.4", font_size=28, color=COLOR_B)
        prob_b_only.move_to(circle_b.get_center() + RIGHT * 0.5)

        # Intersection
        prob_intersection = MathTex("0.1", font_size=28, color=COLOR_INTERSECTION)
        prob_intersection.move_to((circle_a.get_center() + circle_b.get_center()) / 2)

        self.play(
            Write(prob_a_only),
            Write(prob_b_only),
            Write(prob_intersection)
        )
        self.wait(0.5)

        # Show given probabilities
        given = VGroup(
            MathTex("P(A) = 0.3 + 0.1 = 0.4", font_size=26),
            MathTex("P(B) = 0.4 + 0.1 = 0.5", font_size=26),
            MathTex(r"P(A \cap B) = 0.1", font_size=26),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        given[0].set_color(COLOR_A)
        given[1].set_color(COLOR_B)
        given[2].set_color(COLOR_INTERSECTION)
        given.shift(DOWN * 2 + LEFT * 3.5)

        self.play(Write(given), run_time=1.5)
        self.wait(0.5)

        # Show wrong calculation first
        wrong_title = Text("If we just add:", font_size=24, color=RED)
        wrong_title.shift(DOWN * 1.5 + RIGHT * 2)
        self.play(Write(wrong_title))

        wrong_calc = MathTex(
            "P(A) + P(B) = 0.4 + 0.5 = 0.9",
            font_size=26,
            color=RED
        )
        wrong_calc.next_to(wrong_title, DOWN, buff=0.2)
        self.play(Write(wrong_calc))

        wrong_note = Text("(0.1 counted twice!)", font_size=20, color=RED)
        wrong_note.next_to(wrong_calc, DOWN, buff=0.1)
        self.play(Write(wrong_note))
        self.wait(0.5)

        # Show correct calculation
        correct_title = Text("Correct calculation:", font_size=24, color=COLOR_FORMULA)
        correct_title.next_to(wrong_note, DOWN, buff=0.4)
        self.play(Write(correct_title))

        correct_calc = MathTex(
            r"P(A \cup B) = 0.4 + 0.5 - 0.1 = 0.8",
            font_size=26,
            color=COLOR_FORMULA
        )
        correct_calc.next_to(correct_title, DOWN, buff=0.2)
        self.play(Write(correct_calc))

        # Verify by adding regions
        verify = MathTex(
            r"\text{Check: } 0.3 + 0.1 + 0.4 = 0.8 \quad \checkmark",
            font_size=24,
            color=COLOR_FORMULA
        )
        verify.next_to(correct_calc, DOWN, buff=0.2)
        self.play(Write(verify))

        # Box the correct answer
        box = SurroundingRectangle(correct_calc, color=COLOR_FORMULA, buff=0.15)
        self.play(Create(box))
        self.wait(2)


class AdditionRuleMutuallyExclusive(Scene):
    """Shows the special case when events are mutually exclusive (no overlap)"""
    def construct(self):
        # Color scheme
        COLOR_A = BLUE
        COLOR_B = RED
        COLOR_FORMULA = GREEN

        # Title
        title = Text("Special Case: Mutually Exclusive Events", font_size=38)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Definition
        definition = MathTex(
            r"\text{Mutually exclusive: } A \cap B = \emptyset",
            font_size=28
        )
        definition.next_to(title, DOWN, buff=0.3)
        self.play(Write(definition))
        self.wait(0.5)

        # Create non-overlapping circles
        circle_a = Circle(radius=1.2, color=COLOR_A, stroke_width=4, fill_opacity=0.4)
        circle_a.shift(LEFT * 1.8)

        circle_b = Circle(radius=1.2, color=COLOR_B, stroke_width=4, fill_opacity=0.4)
        circle_b.shift(RIGHT * 1.8)

        label_a = MathTex("A", font_size=36, color=COLOR_A)
        label_a.move_to(circle_a.get_center())

        label_b = MathTex("B", font_size=36, color=COLOR_B)
        label_b.move_to(circle_b.get_center())

        self.play(
            Create(circle_a),
            Create(circle_b),
            Write(label_a),
            Write(label_b)
        )
        self.wait(0.5)

        # No overlap indicator
        no_overlap = Text("No overlap!", font_size=24, color=YELLOW)
        no_overlap.shift(DOWN * 0.5)

        arrow_left = Arrow(start=no_overlap.get_left() + LEFT * 0.3, end=circle_a.get_right(), color=YELLOW)
        arrow_right = Arrow(start=no_overlap.get_right() + RIGHT * 0.3, end=circle_b.get_left(), color=YELLOW)

        self.play(Write(no_overlap))
        self.play(Create(arrow_left), Create(arrow_right))
        self.wait(0.5)

        # Show simplified formula
        formula_general = MathTex(
            r"P(A \cup B) = P(A) + P(B) - P(A \cap B)",
            font_size=30
        )
        formula_general.shift(DOWN * 1.8)
        self.play(Write(formula_general))
        self.wait(0.5)

        # Show that P(A∩B) = 0
        zero_note = MathTex(
            r"P(A \cap B) = 0 \text{ (no overlap)}",
            font_size=26,
            color=YELLOW
        )
        zero_note.next_to(formula_general, DOWN, buff=0.3)
        self.play(Write(zero_note))
        self.wait(0.5)

        # Simplified formula
        formula_simple = MathTex(
            r"P(A \cup B) = P(A) + P(B)",
            font_size=36,
            color=COLOR_FORMULA
        )
        formula_simple.next_to(zero_note, DOWN, buff=0.4)
        self.play(Write(formula_simple))

        # Box the simplified formula
        box = SurroundingRectangle(formula_simple, color=COLOR_FORMULA, buff=0.2, corner_radius=0.1)
        self.play(Create(box))

        # Final note
        final_note = Text(
            "For mutually exclusive events, just add the probabilities!",
            font_size=24
        )
        final_note.to_edge(DOWN, buff=0.5)
        self.play(Write(final_note))
        self.wait(2)

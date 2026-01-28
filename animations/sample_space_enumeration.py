"""
Sample Space Enumeration (Systematic Listing for Multi-Stage Experiments)
Demonstrates tree diagrams for two coin flips, systematic outcome listing,
and probability calculation from sample space.

Run with: manim -qm --format=mp4 sample_space_enumeration.py SampleSpaceEnumeration
"""
from manim import *


class SampleSpaceEnumeration(Scene):
    def construct(self):
        # ========== TITLE ==========
        title = Text("Sample Space: Two Coin Flips", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # ========== PART 1: Build Tree Diagram ==========
        tree_label = Text("Tree Diagram", font_size=28)
        tree_label.next_to(title, DOWN, buff=0.4)
        self.play(Write(tree_label))
        self.wait(0.3)

        # Starting point for tree
        start_point = LEFT * 4 + UP * 0.5

        # Create the root dot
        root = Dot(start_point, color=WHITE, radius=0.08)
        self.play(FadeIn(root))

        # First flip label
        first_flip_label = Text("First Flip", font_size=20, color=BLUE)
        first_flip_label.next_to(start_point, UP, buff=0.3)
        self.play(Write(first_flip_label))

        # First level branches (H and T) - BLUE
        first_h_end = start_point + RIGHT * 1.5 + UP * 1.2
        first_t_end = start_point + RIGHT * 1.5 + DOWN * 1.2

        branch_h1 = Line(start_point, first_h_end, color=BLUE, stroke_width=3)
        branch_t1 = Line(start_point, first_t_end, color=BLUE, stroke_width=3)

        h1_label = Text("H", font_size=24, color=BLUE)
        h1_label.next_to(first_h_end, UP + LEFT, buff=0.1)

        t1_label = Text("T", font_size=24, color=BLUE)
        t1_label.next_to(first_t_end, DOWN + LEFT, buff=0.1)

        h1_dot = Dot(first_h_end, color=BLUE, radius=0.08)
        t1_dot = Dot(first_t_end, color=BLUE, radius=0.08)

        # Animate first flip
        self.play(Create(branch_h1), FadeIn(h1_dot), Write(h1_label))
        self.play(Create(branch_t1), FadeIn(t1_dot), Write(t1_label))
        self.wait(0.3)

        # Second flip label
        second_flip_label = Text("Second Flip", font_size=20, color=RED)
        second_flip_label.move_to(first_h_end + RIGHT * 1.5 + UP * 0.5)
        self.play(Write(second_flip_label))

        # Second level branches from H - RED
        hh_end = first_h_end + RIGHT * 1.5 + UP * 0.6
        ht_end = first_h_end + RIGHT * 1.5 + DOWN * 0.6

        branch_hh = Line(first_h_end, hh_end, color=RED, stroke_width=3)
        branch_ht = Line(first_h_end, ht_end, color=RED, stroke_width=3)

        hh_branch_label = Text("H", font_size=22, color=RED)
        hh_branch_label.next_to(hh_end, UP + LEFT, buff=0.05)
        ht_branch_label = Text("T", font_size=22, color=RED)
        ht_branch_label.next_to(ht_end, DOWN + LEFT, buff=0.05)

        hh_dot = Dot(hh_end, color=RED, radius=0.08)
        ht_dot = Dot(ht_end, color=RED, radius=0.08)

        # Outcome labels in GREEN
        hh_outcome = Text("HH", font_size=24, color=GREEN)
        hh_outcome.next_to(hh_end, RIGHT, buff=0.2)
        ht_outcome = Text("HT", font_size=24, color=GREEN)
        ht_outcome.next_to(ht_end, RIGHT, buff=0.2)

        self.play(Create(branch_hh), FadeIn(hh_dot), Write(hh_branch_label))
        self.play(Write(hh_outcome))
        self.play(Create(branch_ht), FadeIn(ht_dot), Write(ht_branch_label))
        self.play(Write(ht_outcome))
        self.wait(0.3)

        # Second level branches from T - RED
        th_end = first_t_end + RIGHT * 1.5 + UP * 0.6
        tt_end = first_t_end + RIGHT * 1.5 + DOWN * 0.6

        branch_th = Line(first_t_end, th_end, color=RED, stroke_width=3)
        branch_tt = Line(first_t_end, tt_end, color=RED, stroke_width=3)

        th_branch_label = Text("H", font_size=22, color=RED)
        th_branch_label.next_to(th_end, UP + LEFT, buff=0.05)
        tt_branch_label = Text("T", font_size=22, color=RED)
        tt_branch_label.next_to(tt_end, DOWN + LEFT, buff=0.05)

        th_dot = Dot(th_end, color=RED, radius=0.08)
        tt_dot = Dot(tt_end, color=RED, radius=0.08)

        # Outcome labels in GREEN
        th_outcome = Text("TH", font_size=24, color=GREEN)
        th_outcome.next_to(th_end, RIGHT, buff=0.2)
        tt_outcome = Text("TT", font_size=24, color=GREEN)
        tt_outcome.next_to(tt_end, RIGHT, buff=0.2)

        self.play(Create(branch_th), FadeIn(th_dot), Write(th_branch_label))
        self.play(Write(th_outcome))
        self.play(Create(branch_tt), FadeIn(tt_dot), Write(tt_branch_label))
        self.play(Write(tt_outcome))
        self.wait(0.5)

        # ========== PART 2: List All Outcomes ==========
        sample_space_label = Text("Sample Space:", font_size=26)
        sample_space_label.move_to(RIGHT * 3.5 + UP * 2)
        self.play(Write(sample_space_label))

        sample_space = MathTex(
            r"S = \{", r"HH", r",\ ", r"HT", r",\ ", r"TH", r",\ ", r"TT", r"\}",
            font_size=28
        )
        # Color code the outcomes
        sample_space[1].set_color(GREEN)  # HH
        sample_space[3].set_color(GREEN)  # HT
        sample_space[5].set_color(GREEN)  # TH
        sample_space[7].set_color(GREEN)  # TT
        sample_space.next_to(sample_space_label, DOWN, buff=0.2)
        self.play(Write(sample_space))

        total_outcomes = MathTex(r"|S| = 4 \text{ outcomes}", font_size=24)
        total_outcomes.next_to(sample_space, DOWN, buff=0.2)
        self.play(Write(total_outcomes))
        self.wait(0.5)

        # ========== PART 3: Order Matters Insight ==========
        # Highlight HT and TH
        order_title = Text("Key Insight: Order Matters!", font_size=26, color=YELLOW)
        order_title.move_to(RIGHT * 3.5 + DOWN * 0.3)
        self.play(Write(order_title))

        # Create boxes around HT and TH in the tree
        ht_box = SurroundingRectangle(ht_outcome, color=YELLOW, buff=0.1)
        th_box = SurroundingRectangle(th_outcome, color=YELLOW, buff=0.1)

        self.play(Create(ht_box), Create(th_box))

        order_explanation = VGroup(
            MathTex(r"HT", r" \neq ", r"TH", font_size=26),
            Text("(First H, then T) vs (First T, then H)", font_size=18),
        ).arrange(DOWN, buff=0.1)
        order_explanation[0][0].set_color(GREEN)
        order_explanation[0][2].set_color(GREEN)
        order_explanation.next_to(order_title, DOWN, buff=0.2)
        self.play(Write(order_explanation))
        self.wait(0.5)

        sequence_note = Text("When sequence is recorded, these are different!", font_size=18, color=YELLOW)
        sequence_note.next_to(order_explanation, DOWN, buff=0.15)
        self.play(Write(sequence_note))
        self.wait(0.8)

        # Fade out the highlight boxes
        self.play(FadeOut(ht_box), FadeOut(th_box))

        # ========== PART 4: Probability Calculation ==========
        # Clear some elements to make room
        self.play(
            FadeOut(order_title),
            FadeOut(order_explanation),
            FadeOut(sequence_note),
            FadeOut(first_flip_label),
            FadeOut(second_flip_label),
            FadeOut(tree_label)
        )

        # Move sample space info up
        prob_question = Text("P(at least one H) = ?", font_size=28, color=YELLOW)
        prob_question.move_to(RIGHT * 3.5 + DOWN * 0.2)
        self.play(Write(prob_question))
        self.wait(0.3)

        # Highlight favorable outcomes in tree
        favorable_label = Text("Favorable outcomes:", font_size=22)
        favorable_label.next_to(prob_question, DOWN, buff=0.3)
        self.play(Write(favorable_label))

        # Highlight HH, HT, TH (outcomes with at least one H)
        hh_highlight = SurroundingRectangle(hh_outcome, color=YELLOW, buff=0.08, stroke_width=3)
        ht_highlight = SurroundingRectangle(ht_outcome, color=YELLOW, buff=0.08, stroke_width=3)
        th_highlight = SurroundingRectangle(th_outcome, color=YELLOW, buff=0.08, stroke_width=3)

        self.play(Create(hh_highlight))
        self.play(Create(ht_highlight))
        self.play(Create(th_highlight))

        favorable_list = MathTex(r"\{HH, HT, TH\}", font_size=24, color=YELLOW)
        favorable_list.next_to(favorable_label, DOWN, buff=0.15)
        self.play(Write(favorable_list))

        favorable_count = MathTex(r"= 3 \text{ outcomes}", font_size=22)
        favorable_count.next_to(favorable_list, RIGHT, buff=0.1)
        self.play(Write(favorable_count))
        self.wait(0.5)

        # Show probability calculation
        prob_calc = MathTex(
            r"P(\text{at least one H}) = \frac{3}{4}",
            font_size=28,
            color=GREEN
        )
        prob_calc.next_to(favorable_list, DOWN, buff=0.4)
        self.play(Write(prob_calc))
        self.wait(0.5)

        # Box the answer
        answer_box = SurroundingRectangle(prob_calc, color=GREEN, buff=0.15, corner_radius=0.1)
        self.play(Create(answer_box))
        self.wait(0.5)

        # ========== PART 5: Key Formula ==========
        # Clear the probability question area
        self.play(
            FadeOut(prob_question),
            FadeOut(favorable_label),
            FadeOut(favorable_list),
            FadeOut(favorable_count),
            FadeOut(prob_calc),
            FadeOut(answer_box),
            FadeOut(hh_highlight),
            FadeOut(ht_highlight),
            FadeOut(th_highlight)
        )

        # Show key formula at bottom
        formula_title = Text("Key Formula:", font_size=26, color=YELLOW)
        formula_title.move_to(DOWN * 2)

        formula = MathTex(
            r"P(\text{event}) = \frac{\text{favorable outcomes}}{\text{total outcomes}}",
            font_size=32
        )
        formula.next_to(formula_title, DOWN, buff=0.25)

        formula_box = SurroundingRectangle(
            VGroup(formula_title, formula),
            color=YELLOW,
            buff=0.2,
            corner_radius=0.1
        )

        self.play(Write(formula_title))
        self.play(Write(formula))
        self.play(Create(formula_box))
        self.wait(0.5)

        # Final example reminder
        example_text = MathTex(
            r"\text{Example: } P(\text{at least one H}) = \frac{3}{4}",
            font_size=24
        )
        example_text.next_to(formula_box, DOWN, buff=0.3)
        self.play(Write(example_text))

        self.wait(2)

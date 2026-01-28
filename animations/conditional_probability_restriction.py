"""
Conditional Probability (Two-Stage Filtering)
Visualizes how conditional probability RESTRICTS the sample space to the given condition.
Key insight: The denominator P(B) becomes the NEW total, not the original sample space.

Run with: manim -qm --format=mp4 conditional_probability_restriction.py ConditionalProbabilityRestriction
"""
from manim import *


class ConditionalProbabilityRestriction(Scene):
    def construct(self):
        # Color scheme
        A_COLOR = BLUE
        B_COLOR = RED
        INTERSECTION_COLOR = GREEN
        EMPHASIS_COLOR = YELLOW

        # ========== TITLE ==========
        title = Text("Conditional Probability: Restricting the Sample Space", font_size=36)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # ========== STEP 1: Full Sample Space ==========
        step1_label = Text("Step 1: Full Sample Space", font_size=24, color=EMPHASIS_COLOR)
        step1_label.next_to(title, DOWN, buff=0.3)
        self.play(Write(step1_label))

        # Create a 6x6 grid of outcomes (36 total)
        grid = VGroup()
        grid_size = 6
        dot_spacing = 0.45
        dots = {}  # Store references for later highlighting

        for row in range(grid_size):
            for col in range(grid_size):
                dot = Dot(radius=0.12, color=WHITE, fill_opacity=0.6)
                dot.move_to(
                    LEFT * 2.5 + RIGHT * col * dot_spacing +
                    UP * 0.5 + DOWN * row * dot_spacing
                )
                dots[(row, col)] = dot
                grid.add(dot)

        # Add border rectangle around the grid
        grid_rect = SurroundingRectangle(grid, color=WHITE, buff=0.2)
        sample_space_label = MathTex(r"S", font_size=28)
        sample_space_label.next_to(grid_rect, UP, buff=0.1)

        total_label = Text("36 outcomes", font_size=18)
        total_label.next_to(grid_rect, DOWN, buff=0.1)

        self.play(
            LaggedStart(*[FadeIn(dot, scale=0.5) for dot in grid], lag_ratio=0.02),
            Create(grid_rect),
            Write(sample_space_label)
        )
        self.play(Write(total_label))
        self.wait(0.5)

        # ========== STEP 2: Define Event B (the condition) ==========
        self.play(FadeOut(step1_label))
        step2_label = Text("Step 2: Event B (the GIVEN condition)", font_size=24, color=EMPHASIS_COLOR)
        step2_label.next_to(title, DOWN, buff=0.3)
        self.play(Write(step2_label))

        # Event B: last 3 columns (18 outcomes)
        event_b_dots = []
        for row in range(grid_size):
            for col in range(3, grid_size):  # Columns 3, 4, 5
                event_b_dots.append(dots[(row, col)])

        # Highlight Event B in RED
        self.play(
            *[dot.animate.set_color(B_COLOR).set_fill(B_COLOR, opacity=0.8) for dot in event_b_dots],
            run_time=1
        )

        # Add Event B label
        b_label = MathTex(r"B", font_size=28, color=B_COLOR)
        b_brace = Brace(VGroup(*event_b_dots), RIGHT, color=B_COLOR)
        b_label.next_to(b_brace, RIGHT, buff=0.1)

        b_count = Text("18 outcomes", font_size=16, color=B_COLOR)
        b_count.next_to(b_label, DOWN, buff=0.1)

        self.play(Create(b_brace), Write(b_label), Write(b_count))
        self.wait(0.5)

        # Show P(B) calculation on the right side
        formula_group = VGroup()
        pb_formula = MathTex(
            r"P(B) = \frac{18}{36} = \frac{1}{2}",
            font_size=28,
            color=B_COLOR
        )
        pb_formula.move_to(RIGHT * 4 + UP * 2)
        formula_group.add(pb_formula)

        self.play(Write(pb_formula))
        self.wait(0.5)

        # ========== STEP 3: RESTRICT to only Event B ==========
        self.play(FadeOut(step2_label))
        step3_label = Text("Step 3: RESTRICT sample space to B", font_size=24, color=EMPHASIS_COLOR)
        step3_label.next_to(title, DOWN, buff=0.3)
        self.play(Write(step3_label))

        # Fade out dots NOT in B
        non_b_dots = []
        for row in range(grid_size):
            for col in range(3):  # Columns 0, 1, 2
                non_b_dots.append(dots[(row, col)])

        self.play(
            *[dot.animate.set_opacity(0.15).set_color(GRAY) for dot in non_b_dots],
            run_time=1
        )

        # Key insight text
        insight1 = Text("B is now our ENTIRE universe!", font_size=22, color=EMPHASIS_COLOR)
        insight1.move_to(RIGHT * 4 + UP * 0.5)
        insight1_box = SurroundingRectangle(insight1, color=EMPHASIS_COLOR, buff=0.1)

        self.play(Write(insight1), Create(insight1_box))
        self.wait(1)

        # ========== STEP 4: Find Event A within restricted space ==========
        self.play(FadeOut(step3_label))
        step4_label = Text("Step 4: Find Event A within B", font_size=24, color=EMPHASIS_COLOR)
        step4_label.next_to(title, DOWN, buff=0.3)
        self.play(Write(step4_label))

        # Event A: top 2 rows (but we only care about A AND B now)
        # A intersect B: top 2 rows AND last 3 columns = 6 outcomes
        intersection_dots = []
        for row in range(2):  # Rows 0, 1
            for col in range(3, grid_size):  # Columns 3, 4, 5
                intersection_dots.append(dots[(row, col)])

        # Highlight intersection in GREEN
        self.play(
            *[dot.animate.set_color(INTERSECTION_COLOR).set_fill(INTERSECTION_COLOR, opacity=1.0)
              for dot in intersection_dots],
            run_time=1
        )

        # Add intersection label
        int_label = MathTex(r"A \cap B", font_size=24, color=INTERSECTION_COLOR)
        int_brace = Brace(VGroup(*intersection_dots), UP, color=INTERSECTION_COLOR)
        int_label.next_to(int_brace, UP, buff=0.1)

        int_count = Text("6 outcomes", font_size=16, color=INTERSECTION_COLOR)
        int_count.next_to(int_label, RIGHT, buff=0.2)

        self.play(Create(int_brace), Write(int_label), Write(int_count))
        self.wait(0.5)

        # ========== STEP 5: Show the formula with visual connection ==========
        self.play(FadeOut(step4_label), FadeOut(insight1), FadeOut(insight1_box))
        step5_label = Text("Step 5: Calculate P(A|B)", font_size=24, color=EMPHASIS_COLOR)
        step5_label.next_to(title, DOWN, buff=0.3)
        self.play(Write(step5_label))

        # Main conditional probability formula
        main_formula = MathTex(
            r"P(A|B)", r"=", r"\frac{P(A \cap B)}{P(B)}",
            font_size=36
        )
        main_formula.move_to(RIGHT * 4 + DOWN * 0.5)
        main_formula[0].set_color(EMPHASIS_COLOR)
        main_formula[2][0:7].set_color(INTERSECTION_COLOR)  # numerator
        main_formula[2][8:12].set_color(B_COLOR)  # denominator

        self.play(Write(main_formula))
        self.wait(0.5)

        # Show the calculation with actual numbers
        calc_formula = MathTex(
            r"= \frac{6/36}{18/36} = \frac{6}{18} = \frac{1}{3}",
            font_size=32
        )
        calc_formula.next_to(main_formula, DOWN, buff=0.3)

        self.play(Write(calc_formula))
        self.wait(0.5)

        # Alternative interpretation: direct counting within B
        direct_formula = MathTex(
            r"\text{Or directly: } \frac{6 \text{ in } A \cap B}{18 \text{ in } B} = \frac{1}{3}",
            font_size=26,
            color=EMPHASIS_COLOR
        )
        direct_formula.next_to(calc_formula, DOWN, buff=0.3)

        self.play(Write(direct_formula))
        self.wait(1)

        # ========== STEP 6: Key Insight - Denominator is the CONDITION ==========
        self.play(FadeOut(step5_label))

        # Clear some elements to make room for final insight
        self.play(
            FadeOut(b_brace), FadeOut(b_label), FadeOut(b_count),
            FadeOut(int_brace), FadeOut(int_label), FadeOut(int_count),
            FadeOut(total_label), FadeOut(sample_space_label),
            FadeOut(pb_formula), FadeOut(main_formula),
            FadeOut(calc_formula), FadeOut(direct_formula)
        )

        # Final key insight
        final_title = Text("KEY INSIGHT", font_size=32, color=EMPHASIS_COLOR)
        final_title.move_to(RIGHT * 4 + UP * 2)
        self.play(Write(final_title))

        insight_box = VGroup()

        line1 = Text("The denominator P(B) is the", font_size=22)
        line2 = Text("CONDITION, not the grand total!", font_size=22, color=EMPHASIS_COLOR)
        line3 = MathTex(r"P(A|B) = \frac{\text{favorable in }B}{\text{total in }B}", font_size=28)

        insight_box.add(line1, line2, line3)
        insight_box.arrange(DOWN, buff=0.2)
        insight_box.move_to(RIGHT * 4 + DOWN * 0.3)

        self.play(Write(line1))
        self.play(Write(line2))
        self.play(Write(line3))
        self.wait(0.5)

        # Highlight the restricted sample space one more time
        self.play(
            Indicate(VGroup(*event_b_dots), color=EMPHASIS_COLOR, scale_factor=1.05),
            run_time=1.5
        )

        # Create final boxed answer
        final_answer = VGroup(
            MathTex(r"P(A|B) = \frac{P(A \cap B)}{P(B)} = \frac{1}{3}", font_size=32),
            Text("B becomes the new sample space", font_size=20, color=B_COLOR)
        ).arrange(DOWN, buff=0.15)
        final_answer.to_edge(DOWN, buff=0.5)

        final_box = SurroundingRectangle(final_answer, color=EMPHASIS_COLOR, buff=0.2, corner_radius=0.1)

        self.play(
            Write(final_answer[0]),
            Write(final_answer[1]),
            Create(final_box)
        )
        self.wait(2)


class ConditionalProbabilityWithContext(Scene):
    """Extended version with a concrete real-world example (cards or dice)"""
    def construct(self):
        # Color scheme
        A_COLOR = BLUE
        B_COLOR = RED
        INTERSECTION_COLOR = GREEN
        EMPHASIS_COLOR = YELLOW

        # Title
        title = Text("Conditional Probability: A Card Example", font_size=36)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # Problem statement
        problem = VGroup(
            Text("A card is drawn from a standard deck.", font_size=24),
            Text("Given that it's a FACE CARD, what's the probability it's a HEART?", font_size=24)
        ).arrange(DOWN, buff=0.15)
        problem.next_to(title, DOWN, buff=0.4)
        self.play(Write(problem))
        self.wait(1)

        # Define events
        events = VGroup(
            MathTex(r"A = \text{Heart}", font_size=26, color=A_COLOR),
            MathTex(r"B = \text{Face Card (J, Q, K)}", font_size=26, color=B_COLOR)
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        events.next_to(problem, DOWN, buff=0.4)
        self.play(Write(events))
        self.wait(0.5)

        # Show the sample space restriction
        self.play(FadeOut(problem))

        # Create visual of face cards
        face_cards = VGroup()
        suits = ["Hearts", "Diamonds", "Clubs", "Spades"]
        suit_colors = [RED, RED, WHITE, WHITE]
        faces = ["J", "Q", "K"]

        card_width = 0.8
        card_height = 1.1

        for i, (suit, color) in enumerate(zip(suits, suit_colors)):
            for j, face in enumerate(faces):
                card = VGroup()
                rect = Rectangle(width=card_width, height=card_height, color=color)
                rect.set_fill(DARK_GRAY, opacity=0.3)
                label = Text(f"{face}", font_size=18, color=color)
                label.move_to(rect.get_center())
                card.add(rect, label)
                card.move_to(LEFT * 3 + RIGHT * j * 1.0 + UP * 0.5 + DOWN * i * 1.3)
                face_cards.add(card)

        face_cards.center().shift(LEFT * 1.5 + DOWN * 0.5)

        # Labels for rows
        suit_labels = VGroup()
        for i, suit in enumerate(suits):
            label = Text(suit, font_size=16, color=suit_colors[i])
            label.next_to(face_cards[i * 3], LEFT, buff=0.3)
            suit_labels.add(label)

        self.play(
            events.animate.scale(0.8).to_corner(UL, buff=0.5),
            LaggedStart(*[FadeIn(card, scale=0.8) for card in face_cards], lag_ratio=0.05),
            *[Write(label) for label in suit_labels]
        )
        self.wait(0.5)

        # Label the grid
        b_label = Text("Event B: All 12 Face Cards", font_size=20, color=B_COLOR)
        b_label.next_to(face_cards, DOWN, buff=0.3)
        self.play(Write(b_label))
        self.wait(0.5)

        # Highlight Hearts (first row) - this is A intersect B
        heart_cards = [face_cards[0], face_cards[1], face_cards[2]]
        self.play(
            *[card[0].animate.set_fill(INTERSECTION_COLOR, opacity=0.6).set_stroke(INTERSECTION_COLOR, width=3)
              for card in heart_cards],
            run_time=1
        )

        int_label = MathTex(r"A \cap B: \text{Heart Face Cards} = 3", font_size=22, color=INTERSECTION_COLOR)
        int_label.next_to(b_label, DOWN, buff=0.2)
        self.play(Write(int_label))
        self.wait(0.5)

        # Show the calculation on the right
        calc_group = VGroup()

        formula = MathTex(
            r"P(A|B) = \frac{P(A \cap B)}{P(B)}",
            font_size=28
        )
        formula.move_to(RIGHT * 4 + UP * 1)

        step1 = MathTex(
            r"= \frac{3/52}{12/52}",
            font_size=26
        )
        step1.next_to(formula, DOWN, buff=0.2)

        step2 = MathTex(
            r"= \frac{3}{12} = \frac{1}{4}",
            font_size=28,
            color=EMPHASIS_COLOR
        )
        step2.next_to(step1, DOWN, buff=0.2)

        self.play(Write(formula))
        self.wait(0.3)
        self.play(Write(step1))
        self.wait(0.3)
        self.play(Write(step2))
        self.wait(0.5)

        # Key point
        key_point = VGroup(
            Text("We only count within B!", font_size=22, color=EMPHASIS_COLOR),
            MathTex(r"\frac{3 \text{ heart face cards}}{12 \text{ face cards total}}", font_size=24)
        ).arrange(DOWN, buff=0.15)
        key_point.next_to(step2, DOWN, buff=0.4)

        key_box = SurroundingRectangle(key_point, color=EMPHASIS_COLOR, buff=0.15)
        self.play(Write(key_point), Create(key_box))
        self.wait(2)

        # Final answer
        final = MathTex(
            r"P(\text{Heart} | \text{Face Card}) = \frac{1}{4} = 25\%",
            font_size=30,
            color=EMPHASIS_COLOR
        )
        final.to_edge(DOWN, buff=0.4)
        final_box = SurroundingRectangle(final, color=EMPHASIS_COLOR, buff=0.15, corner_radius=0.1)

        self.play(Write(final), Create(final_box))
        self.wait(2)

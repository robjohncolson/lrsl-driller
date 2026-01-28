"""
Random Selection vs Random Assignment - Scope of Inference
AP Statistics: The most critical concept for understanding what conclusions can be drawn.

- Random SELECTION: How we get our sample from population -> enables GENERALIZATION
- Random ASSIGNMENT: How we assign treatments in experiment -> enables CAUSATION

Run with: manim -qm --format=mp4 random_selection_vs_assignment.py RandomSelectionVsAssignment
"""
from manim import *


class RandomSelectionVsAssignment(Scene):
    def construct(self):
        # Title
        title = Text("Random Selection vs Random Assignment", font_size=40)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # Subtitle emphasizing importance
        subtitle = Text("The Key to Scope of Inference", font_size=24, color=YELLOW)
        subtitle.next_to(title, DOWN, buff=0.2)
        self.play(FadeIn(subtitle))
        self.wait(0.5)

        # Fade subtitle
        self.play(FadeOut(subtitle))

        # =====================
        # PART 1: Random Selection (Population -> Sample)
        # =====================

        selection_title = Text("Random Selection", font_size=32, color=BLUE)
        selection_title.shift(UP * 2)
        self.play(Write(selection_title))

        # Population (large blue rectangle with stick figures)
        population_rect = Rectangle(height=2, width=3.5, color=BLUE, fill_opacity=0.3)
        population_rect.shift(LEFT * 4 + DOWN * 0.5)
        population_label = Text("POPULATION", font_size=20, color=BLUE)
        population_label.next_to(population_rect, UP, buff=0.1)

        # Create stick figures for population
        pop_figures = VGroup()
        positions = [
            [-0.8, 0.4], [-0.3, 0.4], [0.3, 0.4], [0.8, 0.4],
            [-0.8, -0.1], [-0.3, -0.1], [0.3, -0.1], [0.8, -0.1],
            [-0.5, -0.5], [0, -0.5], [0.5, -0.5]
        ]
        for pos in positions:
            fig = self.create_stick_figure(0.25, BLUE)
            fig.move_to(population_rect.get_center() + np.array([pos[0], pos[1], 0]))
            pop_figures.add(fig)

        self.play(
            Create(population_rect),
            Write(population_label),
            FadeIn(pop_figures)
        )

        # Sample (smaller green rectangle)
        sample_rect = Rectangle(height=1.5, width=2, color=GREEN, fill_opacity=0.3)
        sample_rect.shift(RIGHT * 0 + DOWN * 0.5)
        sample_label = Text("SAMPLE", font_size=20, color=GREEN)
        sample_label.next_to(sample_rect, UP, buff=0.1)

        # Arrow from population to sample
        selection_arrow = Arrow(
            population_rect.get_right() + RIGHT * 0.1,
            sample_rect.get_left() + LEFT * 0.1,
            color=WHITE,
            buff=0.1
        )
        arrow_label = Text("Random\nSelection", font_size=16)
        arrow_label.next_to(selection_arrow, UP, buff=0.1)

        self.play(
            GrowArrow(selection_arrow),
            Write(arrow_label)
        )

        # Sample figures (subset highlighted)
        sample_figures = VGroup()
        sample_positions = [[-0.3, 0.2], [0.3, 0.2], [0, -0.2]]
        for pos in sample_positions:
            fig = self.create_stick_figure(0.25, GREEN)
            fig.move_to(sample_rect.get_center() + np.array([pos[0], pos[1], 0]))
            sample_figures.add(fig)

        self.play(
            Create(sample_rect),
            Write(sample_label),
            FadeIn(sample_figures)
        )

        # Key insight for selection
        selection_insight = Text("Enables GENERALIZATION to population", font_size=22, color=GREEN)
        selection_insight.shift(DOWN * 2.3)
        self.play(Write(selection_insight))
        self.wait(1)

        # Clear for next part
        selection_group = VGroup(
            selection_title, population_rect, population_label, pop_figures,
            sample_rect, sample_label, sample_figures,
            selection_arrow, arrow_label, selection_insight
        )
        self.play(FadeOut(selection_group))

        # =====================
        # PART 2: Random Assignment (Sample -> Treatment Groups)
        # =====================

        assignment_title = Text("Random Assignment", font_size=32, color=ORANGE)
        assignment_title.shift(UP * 2)
        self.play(Write(assignment_title))

        # Sample in the middle
        sample_rect2 = Rectangle(height=1.8, width=2.5, color=GREEN, fill_opacity=0.3)
        sample_rect2.shift(LEFT * 3.5 + DOWN * 0.3)
        sample_label2 = Text("SAMPLE", font_size=20, color=GREEN)
        sample_label2.next_to(sample_rect2, UP, buff=0.1)

        sample_figures2 = VGroup()
        positions2 = [[-0.5, 0.3], [0, 0.3], [0.5, 0.3], [-0.3, -0.3], [0.3, -0.3]]
        for pos in positions2:
            fig = self.create_stick_figure(0.25, GREEN)
            fig.move_to(sample_rect2.get_center() + np.array([pos[0], pos[1], 0]))
            sample_figures2.add(fig)

        self.play(
            Create(sample_rect2),
            Write(sample_label2),
            FadeIn(sample_figures2)
        )

        # Treatment Group 1 (yellow/orange)
        treat1_rect = Rectangle(height=1.3, width=1.8, color=YELLOW, fill_opacity=0.3)
        treat1_rect.shift(RIGHT * 1.5 + UP * 0.7)
        treat1_label = Text("Treatment", font_size=16, color=YELLOW)
        treat1_label.next_to(treat1_rect, UP, buff=0.05)

        # Treatment Group 2 (control - orange)
        treat2_rect = Rectangle(height=1.3, width=1.8, color=ORANGE, fill_opacity=0.3)
        treat2_rect.shift(RIGHT * 1.5 + DOWN * 1.3)
        treat2_label = Text("Control", font_size=16, color=ORANGE)
        treat2_label.next_to(treat2_rect, UP, buff=0.05)

        # Arrows for random assignment
        assign_arrow1 = Arrow(
            sample_rect2.get_right() + RIGHT * 0.1 + UP * 0.3,
            treat1_rect.get_left() + LEFT * 0.1,
            color=WHITE,
            buff=0.1
        )
        assign_arrow2 = Arrow(
            sample_rect2.get_right() + RIGHT * 0.1 + DOWN * 0.3,
            treat2_rect.get_left() + LEFT * 0.1,
            color=WHITE,
            buff=0.1
        )
        assign_label = Text("Random\nAssignment", font_size=16)
        assign_label.move_to((sample_rect2.get_right() + treat1_rect.get_left()) / 2 + UP * 0.3)

        self.play(
            GrowArrow(assign_arrow1),
            GrowArrow(assign_arrow2),
            Write(assign_label)
        )

        # Figures in treatment groups
        treat1_figures = VGroup()
        for i, x in enumerate([-0.3, 0.3]):
            fig = self.create_stick_figure(0.22, YELLOW)
            fig.move_to(treat1_rect.get_center() + np.array([x, 0, 0]))
            treat1_figures.add(fig)

        treat2_figures = VGroup()
        for i, x in enumerate([-0.3, 0.3]):
            fig = self.create_stick_figure(0.22, ORANGE)
            fig.move_to(treat2_rect.get_center() + np.array([x, 0, 0]))
            treat2_figures.add(fig)

        self.play(
            Create(treat1_rect), Write(treat1_label), FadeIn(treat1_figures),
            Create(treat2_rect), Write(treat2_label), FadeIn(treat2_figures)
        )

        # Key insight for assignment
        assignment_insight = Text("Enables CAUSATION claims", font_size=22, color=ORANGE)
        assignment_insight.shift(DOWN * 2.5)
        self.play(Write(assignment_insight))
        self.wait(1)

        # Clear for the 2x2 grid
        assignment_group = VGroup(
            assignment_title, sample_rect2, sample_label2, sample_figures2,
            treat1_rect, treat1_label, treat1_figures,
            treat2_rect, treat2_label, treat2_figures,
            assign_arrow1, assign_arrow2, assign_label, assignment_insight
        )
        self.play(FadeOut(assignment_group))

        # =====================
        # PART 3: Scope of Inference 2x2 Grid
        # =====================

        grid_title = Text("Scope of Inference", font_size=36, color=WHITE)
        grid_title.shift(UP * 3)
        self.play(Write(grid_title))

        # Create 2x2 table
        # Headers
        col_header1 = Text("Random\nAssignment", font_size=18, color=ORANGE)
        col_header1.move_to(RIGHT * 1.2 + UP * 1.8)
        col_header2 = Text("No Random\nAssignment", font_size=18, color=GRAY)
        col_header2.move_to(RIGHT * 3.5 + UP * 1.8)

        row_header1 = Text("Random\nSelection", font_size=18, color=GREEN)
        row_header1.move_to(LEFT * 1.2 + UP * 0.7)
        row_header2 = Text("No Random\nSelection", font_size=18, color=GRAY)
        row_header2.move_to(LEFT * 1.2 + DOWN * 1.1)

        self.play(
            Write(col_header1), Write(col_header2),
            Write(row_header1), Write(row_header2)
        )

        # Grid cells (2x2)
        cell_width = 2.2
        cell_height = 1.5

        # Cell positions: [row, col] where row 0 = top, col 0 = left
        cells = []
        cell_centers = [
            (RIGHT * 1.2 + UP * 0.7),    # Top-left: Selection + Assignment
            (RIGHT * 3.5 + UP * 0.7),    # Top-right: Selection only
            (RIGHT * 1.2 + DOWN * 1.1),  # Bottom-left: Assignment only
            (RIGHT * 3.5 + DOWN * 1.1),  # Bottom-right: Neither
        ]

        for center in cell_centers:
            cell = Rectangle(height=cell_height, width=cell_width, color=WHITE, stroke_width=2)
            cell.move_to(center)
            cells.append(cell)

        self.play(*[Create(cell) for cell in cells])

        # Cell contents
        # Top-left: Both (BEST)
        cell1_content = VGroup(
            Text("GENERALIZE", font_size=16, color=GREEN),
            Text("+", font_size=14),
            Text("CAUSE", font_size=16, color=ORANGE),
        ).arrange(DOWN, buff=0.1)
        cell1_content.move_to(cell_centers[0])
        cell1_box = SurroundingRectangle(cell1_content, color=GOLD, buff=0.15, stroke_width=3)

        # Top-right: Selection only
        cell2_content = VGroup(
            Text("GENERALIZE", font_size=16, color=GREEN),
            Text("No causation", font_size=14, color=GRAY),
        ).arrange(DOWN, buff=0.15)
        cell2_content.move_to(cell_centers[1])

        # Bottom-left: Assignment only
        cell3_content = VGroup(
            Text("CAUSE", font_size=16, color=ORANGE),
            Text("No generalization", font_size=14, color=GRAY),
        ).arrange(DOWN, buff=0.15)
        cell3_content.move_to(cell_centers[2])

        # Bottom-right: Neither
        cell4_content = VGroup(
            Text("No inference", font_size=16, color=RED),
            Text("possible", font_size=14, color=RED),
        ).arrange(DOWN, buff=0.1)
        cell4_content.move_to(cell_centers[3])

        # Animate each cell with emphasis
        self.play(Write(cell1_content))
        self.play(Create(cell1_box))
        self.wait(0.3)

        self.play(Write(cell2_content))
        self.wait(0.3)

        self.play(Write(cell3_content))
        self.wait(0.3)

        self.play(Write(cell4_content))
        self.wait(0.5)

        # Study type labels
        study_labels = VGroup(
            Text("Experiment\nwith random sample", font_size=11, color=GOLD),
            Text("Observational\nstudy", font_size=11, color=GREEN_B),
            Text("Experiment\nwith volunteers", font_size=11, color=ORANGE),
            Text("Voluntary\nresponse survey", font_size=11, color=RED_B),
        )
        for i, label in enumerate(study_labels):
            label.next_to(cells[i], DOWN, buff=0.05)

        self.play(*[Write(label) for label in study_labels])
        self.wait(1)

        # Final emphasis - highlight the golden cell
        highlight_text = Text(
            "Both random selection AND random assignment = Full inference power!",
            font_size=20,
            color=GOLD
        )
        highlight_text.to_edge(DOWN, buff=0.3)
        self.play(Write(highlight_text))

        # Pulse the best cell
        self.play(
            cell1_box.animate.set_stroke(width=6),
            rate_func=there_and_back,
            run_time=0.8
        )
        self.play(
            cell1_box.animate.set_stroke(width=6),
            rate_func=there_and_back,
            run_time=0.8
        )

        self.wait(1.5)

        # Summary
        self.play(FadeOut(highlight_text))

        summary = VGroup(
            Text("Remember:", font_size=24, color=WHITE),
            Text("Selection = WHO is in the study", font_size=20, color=GREEN),
            Text("Assignment = WHO gets which treatment", font_size=20, color=ORANGE),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        summary.to_edge(DOWN, buff=0.3)

        self.play(Write(summary))
        self.wait(2)

    def create_stick_figure(self, scale, color):
        """Create a simple stick figure."""
        head = Circle(radius=0.12 * scale, color=color, fill_opacity=1)
        head.shift(UP * 0.35 * scale)
        body = Line(UP * 0.23 * scale, DOWN * 0.15 * scale, color=color, stroke_width=2)
        left_arm = Line(UP * 0.1 * scale, UP * 0.05 * scale + LEFT * 0.15 * scale, color=color, stroke_width=2)
        right_arm = Line(UP * 0.1 * scale, UP * 0.05 * scale + RIGHT * 0.15 * scale, color=color, stroke_width=2)
        left_leg = Line(DOWN * 0.15 * scale, DOWN * 0.35 * scale + LEFT * 0.1 * scale, color=color, stroke_width=2)
        right_leg = Line(DOWN * 0.15 * scale, DOWN * 0.35 * scale + RIGHT * 0.1 * scale, color=color, stroke_width=2)
        return VGroup(head, body, left_arm, right_arm, left_leg, right_leg)


class ScopeOfInferenceQuickReference(Scene):
    """Quick reference card for scope of inference - shorter version."""
    def construct(self):
        title = Text("Scope of Inference Quick Reference", font_size=36)
        title.to_edge(UP)
        self.play(Write(title))

        # Two key equations
        eq1 = VGroup(
            Text("Random Selection", font_size=28, color=GREEN),
            MathTex("\\rightarrow", font_size=36),
            Text("Generalize to Population", font_size=28),
        ).arrange(RIGHT, buff=0.3)
        eq1.shift(UP * 1)

        eq2 = VGroup(
            Text("Random Assignment", font_size=28, color=ORANGE),
            MathTex("\\rightarrow", font_size=36),
            Text("Claim Causation", font_size=28),
        ).arrange(RIGHT, buff=0.3)
        eq2.shift(UP * 0)

        self.play(Write(eq1))
        self.play(Write(eq2))
        self.wait(1)

        # Memory device
        memory = VGroup(
            Text("Memory Device:", font_size=24, color=YELLOW),
            Text("'Selection = Sample = who we Study'", font_size=22),
            Text("'Assignment = Allocate = who gets what treatment'", font_size=22),
        ).arrange(DOWN, buff=0.2)
        memory.shift(DOWN * 1.5)

        self.play(Write(memory))
        self.wait(2)

        # Box the key insight
        key = Text(
            "Only EXPERIMENTS with RANDOM SAMPLES can do both!",
            font_size=24,
            color=GOLD
        )
        key.to_edge(DOWN, buff=0.5)
        box = SurroundingRectangle(key, color=GOLD, buff=0.15)

        self.play(Write(key), Create(box))
        self.wait(2)
